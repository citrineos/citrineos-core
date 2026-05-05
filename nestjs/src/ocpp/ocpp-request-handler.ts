import { Logger } from '@nestjs/common';
import { OcppAmqpMessage } from '@amqp/amqp.service';
import { OCPP_CallAction } from '@ocpp/call-action';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { getOcppHandlerMetadata } from '@ocpp/ocpp-handler.decorator';
import { validatePayload } from '@ocpp/validate-payload';

/**
 * Sentinel returned by `OcppHandlerRef.dispatch` to tell `AbstractOcppModule`
 * "I've already published the CallResult myself — don't auto-publish my
 * return value".
 *
 * Handlers don't construct this directly. The dispatcher infers it: if the
 * handler invoked `msg.respond(payload)`, we mark the message as
 * already-responded and the post-handler auto-publish is suppressed.
 */
export const HANDLER_HANDLED_RESPONSE: unique symbol = Symbol('OcppHandlerHandledResponse');
export type HandlerHandledResponse = { [HANDLER_HANDLED_RESPONSE]: true };

/**
 * Typed OCPP message delivered to a handler after payload validation.
 *
 * The `respond` callback lets the handler send the CallResult back to the
 * charger as early as possible — typically before any DB writes — so the
 * charger gets a fast response while the handler continues background work.
 *
 * Mirrors the legacy `sendCallResultWithMessage` pattern used throughout
 * `core/src/modules/<X>/src/module/module.ts`. Use early-respond when:
 *   - the response shape is fully known up-front (e.g. {} for ack-only messages),
 *   - the handler still has more DB work / fan-out to do after responding.
 *
 * If a handler doesn't call `respond`, `AbstractOcppModule` auto-publishes
 * its return value once it resolves — the legacy "compute and return" pattern.
 */
export interface OcppMessage<TPayload> {
  context: OcppAmqpMessage['context'];
  payload: TPayload;
  action: string;
  protocol: string;
  /**
   * Send the CallResult to the charger now. Idempotent: subsequent calls
   * are no-ops. After invoking this, the handler can do background work
   * without delaying the charger's response.
   */
  respond: (payload: Record<string, unknown>) => Promise<void>;
  /**
   * Reject the inbound CALL with an OCPP CallError. Mirrors legacy
   * `sendCallErrorWithMessage`. Idempotent and mutually exclusive with
   * `respond` — the dispatcher tracks the responded flag and suppresses
   * the post-handler auto-publish for either path.
   *
   * `errorCode` follows the OCPP error-code enum (`PropertyConstraintViolation`,
   * `OccurrenceConstraintViolation`, `GenericError`, etc.). `errorDetails`
   * is optional vendor metadata.
   */
  respondError: (
    errorCode: string,
    errorDescription: string,
    errorDetails?: Record<string, unknown>,
  ) => Promise<void>;
}

/**
 * Minimal interface used by module services to dispatch to handlers without
 * needing to know TRequest. Using this instead of OcppRequestHandler<object>
 * avoids TypeScript contravariance issues on the handle() method signature.
 */
export interface OcppHandlerRef {
  readonly action: OCPP_CallAction;
  readonly versions: OCPPVersion[];
  dispatch(
    raw: OcppAmqpMessage,
    respond: (payload: Record<string, unknown>) => Promise<void>,
    respondError: (
      errorCode: string,
      errorDescription: string,
      errorDetails?: Record<string, unknown>,
    ) => Promise<void>,
  ): Promise<Record<string, unknown> | HandlerHandledResponse>;
}

/**
 * Base class for all OCPP request handlers. The `action`, `versions`, and
 * `requestClass` triple comes from the `@OcppHandler(...)` class decorator
 * (read via Reflect metadata), so subclasses don't repeat the four-line
 * preamble. A `protected logger` is created lazily from
 * `this.constructor.name`, replacing the per-handler `new Logger(FooHandler.name)`.
 *
 * Validation runs in dispatch() before handle() is invoked, so handle()
 * always receives a fully typed, validated payload — no casts needed.
 */
export abstract class OcppRequestHandler<TRequest extends object> implements OcppHandlerRef {
  readonly action: OCPP_CallAction;
  readonly versions: OCPPVersion[];
  protected readonly requestClass: new () => TRequest;
  protected readonly logger: Logger;

  constructor() {
    const meta = getOcppHandlerMetadata<TRequest>(this.constructor);
    this.action = meta.action;
    this.versions = meta.versions;
    this.requestClass = meta.requestClass;
    this.logger = new Logger(this.constructor.name);
  }

  abstract handle(
    msg: OcppMessage<TRequest>,
  ): Promise<Record<string, unknown> | HandlerHandledResponse>;

  async dispatch(
    raw: OcppAmqpMessage,
    respond: (payload: Record<string, unknown>) => Promise<void>,
    respondError: (
      errorCode: string,
      errorDescription: string,
      errorDetails?: Record<string, unknown>,
    ) => Promise<void>,
  ): Promise<Record<string, unknown> | HandlerHandledResponse> {
    const payload = await validatePayload(this.requestClass, raw.payload);
    return this.handle({
      context: raw.context,
      payload,
      action: raw.action,
      protocol: raw.protocol,
      respond,
      respondError,
    });
  }
}
