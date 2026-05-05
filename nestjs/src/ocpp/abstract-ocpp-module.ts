import { Logger, OnModuleInit, Optional } from '@nestjs/common';
import { propagation, SpanStatusCode, context as otelContext, trace } from '@opentelemetry/api';
import { AmqpService, OcppAmqpMessage } from '@amqp/amqp.service';
import { CacheService } from '@cache/cache.service';
import { BaseModuleConfig } from '@modules/config/config.schema';
import type { ConfigLimits } from '@modules/config/config.tokens';
import { withLogContext } from '@logger/structured-logger';
import { EventGroup } from '@ocpp/event-group';
import { OCPP_CallAction } from '@ocpp/call-action';
import { CsmsResponseHandlerRef } from '@ocpp/csms-response-handler';
import {
  HANDLER_HANDLED_RESPONSE,
  HandlerHandledResponse,
  OcppHandlerRef,
} from '@ocpp/ocpp-request-handler';

/**
 * Base class for every OCPP domain module's AMQP orchestration service.
 * Mirrors the role of AbstractModule in the original CitrineOS.
 *
 * Subclasses declare:
 *   - eventGroup  — the AMQP routing group (e.g. EventGroup.Transactions)
 *   - getHandlers()       — all OcppRequestHandler instances for this module
 *
 * Request/response action lists come straight off the injected
 * `BaseModuleConfig` slice, so subclasses only declare config once.
 *
 * The base handles:
 *   - Building the dispatch map keyed on "${action}::${protocol}"
 *   - Subscribing to AMQP with config-driven action lists
 *   - Routing incoming messages to the right version-specific handler
 *   - Logging dropped messages (unknown action/protocol) instead of throwing
 */
export abstract class AbstractOcppModule implements OnModuleInit {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly amqp: AmqpService,
    protected readonly moduleConfig: BaseModuleConfig,
    protected readonly limits: ConfigLimits,
    @Optional() protected readonly cache?: CacheService,
  ) {}

  protected abstract readonly eventGroup: EventGroup;

  /** Return all handler instances for this module. */
  protected abstract getHandlers(): OcppHandlerRef[];

  /** Actions this module's AMQP queue binds to (charger → module). */
  protected getRequestActions(): OCPP_CallAction[] {
    return this.moduleConfig.requests;
  }

  /** Actions this module's AMQP queue binds to (module → charger responses). */
  protected getResponseActions(): OCPP_CallAction[] {
    return this.moduleConfig.responses;
  }

  /**
   * Handlers that run domain logic when a charger returns a CALL_RESULT
   * for a CSMS-initiated CALL. Default: none. Subclasses override to
   * register e.g. `ReserveNowResponseHandler` for `ReserveNow`.
   *
   * These run *in addition to* the default cache-write that lets
   * `RemoteCallsService.sendAndAwait` resolve — they never replace it.
   */
  protected getResponseHandlers(): CsmsResponseHandlerRef[] {
    return [];
  }

  async onModuleInit(): Promise<void> {
    // Build composite key map: "${action}::${protocol}" → handler
    const dispatch = new Map<string, OcppHandlerRef>();
    for (const handler of this.getHandlers()) {
      for (const version of handler.versions) {
        dispatch.set(`${handler.action}::${version}`, handler);
      }
    }

    const requests = this.getRequestActions();
    const responses = this.getResponseActions();

    await this.amqp.subscribeModule(
      this.eventGroup,
      requests,
      async (msg: OcppAmqpMessage): Promise<Record<string, unknown> | null> => {
        const key = `${msg.action}::${msg.protocol}`;
        const handler = dispatch.get(key);
        if (!handler) {
          this.logger.warn(`No handler for [${key}] in ${this.eventGroup} — dropping`);
          return {};
        }
        return this.runWithObservability(msg, key, () => this.dispatchOne(msg, handler));
      },
      responses,
      // Composite responseHandler:
      //   1. Write the CALL_RESULT payload to cache so
      //      `RemoteCallsService.sendAndAwait` resolves (legacy parity).
      //   2. Dispatch to any module-registered `CsmsResponseHandler` for
      //      domain logic (e.g. ReserveNow → upsert Reservation).
      this.buildResponseHandler(),
    );

    this.logger.log(
      `Registered — ${requests.length} request action(s), ${responses.length} response action(s)` +
        (this.getResponseHandlers().length
          ? `, ${this.getResponseHandlers().length} response handler(s)`
          : ''),
    );
  }

  /**
   * Run the handler dispatch with the message's correlationId / stationId
   * propagated as the active log context AND under an OTel span linked
   * to the router-side parent span via the AMQP `traceparent` header.
   *
   * Logs emitted inside the handler now carry `correlationId`,
   * `stationId`, `tenantId` automatically (no manual threading), and
   * traces stitched across router → AMQP → module form one tree.
   */
  private async runWithObservability<T>(
    msg: OcppAmqpMessage,
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const carrier: Record<string, string> = {};
    const tp = (msg.context as Record<string, unknown>).traceparent;
    if (typeof tp === 'string') carrier.traceparent = tp;
    const ts = (msg.context as Record<string, unknown>).tracestate;
    if (typeof ts === 'string') carrier.tracestate = ts;
    const parentCtx = propagation.extract(otelContext.active(), carrier);
    const tracer = trace.getTracer('citrineos.module-handler');

    return withLogContext(
      {
        correlationId: msg.context.correlationId,
        stationId: msg.context.stationId,
        tenantId: msg.context.tenantId,
      },
      () =>
        otelContext.with(parentCtx, () =>
          tracer.startActiveSpan(
            `ocpp.handle ${key}`,
            {
              attributes: {
                'ocpp.action': msg.action,
                'ocpp.protocol': msg.protocol,
                'ocpp.station_id': msg.context.stationId,
                'ocpp.correlation_id': msg.context.correlationId,
                'tenant.id': msg.context.tenantId,
                'module.event_group': this.eventGroup,
              },
            },
            async (span) => {
              try {
                return await fn();
              } catch (err) {
                span.recordException(err as Error);
                span.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: (err as Error).message,
                });
                throw err;
              } finally {
                span.end();
              }
            },
          ),
        ),
    );
  }

  private async dispatchOne(
    msg: OcppAmqpMessage,
    handler: OcppHandlerRef,
  ): Promise<Record<string, unknown> | null> {
    // `respond` and `respondError` let the handler push a CallResult or
    // CallError back to the charger immediately (mirrors legacy
    // `sendCallResultWithMessage` / `sendCallErrorWithMessage`). Both
    // paths set `alreadyResponded`; either suppresses the post-handler
    // auto-publish.
    let alreadyResponded = false;
    const respond = async (payload: Record<string, unknown>): Promise<void> => {
      if (alreadyResponded) return;
      alreadyResponded = true;
      await this.amqp.publishCsmsResponse(msg, payload);
    };
    const respondError = async (
      errorCode: string,
      errorDescription: string,
      errorDetails?: Record<string, unknown>,
    ): Promise<void> => {
      if (alreadyResponded) return;
      alreadyResponded = true;
      await this.amqp.publishCsmsCallError(msg, errorCode, errorDescription, errorDetails);
    };

    const result = await handler.dispatch(msg, respond, respondError);
    if (alreadyResponded || (result as HandlerHandledResponse)[HANDLER_HANDLED_RESPONSE]) {
      return null; // tells subscribeModule to skip auto-publish
    }
    return result as Record<string, unknown>;
  }

  private buildResponseHandler(): ((msg: OcppAmqpMessage) => Promise<void>) | undefined {
    const responseHandlers = this.getResponseHandlers();
    if (!this.cache && responseHandlers.length === 0) return undefined;

    const responseDispatch = new Map<string, CsmsResponseHandlerRef>();
    for (const handler of responseHandlers) {
      for (const version of handler.versions) {
        responseDispatch.set(`${handler.action}::${version}`, handler);
      }
    }

    return async (msg: OcppAmqpMessage): Promise<void> => {
      const key = `${msg.action}::${msg.protocol}`;
      return this.runWithObservability(msg, `response ${key}`, async () => {
        // Always write to cache first so awaiting REST requests can resolve.
        if (this.cache) {
          await this.cache.set(
            msg.context.correlationId,
            JSON.stringify(msg.payload),
            msg.context.stationId,
            this.limits.maxCachingSeconds,
          );
        }

        const handler = responseDispatch.get(key);
        if (!handler) {
          // Mirror legacy's per-action `_logger.debug('X response received', ...)` —
          // many legacy `@AsHandler` bodies are pure-log (Reset, TriggerMessage,
          // ChangeAvailability, etc.). We capture the same observability without
          // a class per action.
          this.logger.debug(
            `${msg.action} response received from ${msg.context.stationId} ` +
              `(${msg.protocol}, corrId=${msg.context.correlationId})`,
          );
          return;
        }
        try {
          await handler.dispatch(msg);
        } catch (err) {
          this.logger.error(
            `CsmsResponseHandler for ${msg.action} (${msg.protocol}) threw: ${(err as Error).message}`,
          );
        }
      });
    };
  }
}
