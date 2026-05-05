// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { AmqpService } from '@amqp/amqp.service';
import { CacheService } from '@cache/cache.service';
import { MetricsService } from '@metrics/metrics.service';
import { OCPP_CallAction } from '@ocpp/call-action';
import { RemoteCommandRepository } from '@repositories/remote-command.repository';
import { trace, SpanStatusCode } from '@opentelemetry/api';

/**
 * Send a CSMS-initiated CALL to a charger and await the CALL_RESULT.
 *
 * Mirrors the legacy CitrineOS contract where any module can fire a Reset /
 * TriggerMessage / Get* / Set* / Remote* call and receive the charger's
 * response in-band, even though the round-trip flows through:
 *
 *   REST → AMQP (sendCall, csms-origin) → router queue → WS to charger →
 *   charger CALL_RESULT → router publishes (cs-origin, response) → module's
 *   responseHandler writes payload to cache keyed by correlationId →
 *   awaiting Promise resolves.
 *
 * Anything that needs a CSMS-initiated call should inject this and call
 * `sendAndAwait`.
 */
@Injectable()
export class RemoteCallsService {
  private readonly logger = new Logger(RemoteCallsService.name);

  constructor(
    private readonly amqp: AmqpService,
    private readonly cache: CacheService,
    private readonly remoteCommands: RemoteCommandRepository,
    private readonly metrics: MetricsService,
  ) {}

  /**
   * Fire-and-forget CSMS CALL — no awaiter, no cache slot, no timeout.
   * Used by `CsmsResponseHandler`s that need to chain a follow-up CALL
   * (e.g. SetDisplayMessage Accepted → GetDisplayMessages refresh) where
   * the next CALL_RESULT is handled by its own response handler. Mirrors
   * legacy `sendCall` invocations from inside `_handle*Response` bodies.
   *
   * Tracks the request in `RemoteCommands` for ops visibility — the row's
   * status stays `pending` until / unless its own response handler updates
   * it (most simple log-only response handlers don't, which is the legacy
   * shape).
   */
  async sendNoWait(
    action: OCPP_CallAction | string,
    stationId: string,
    tenantId: number,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const correlationId = crypto.randomUUID();
    await this.remoteCommands
      .create({
        stationId,
        correlationId,
        tenantId,
        action: String(action),
        requestPayload: payload,
        result: 'pending',
      })
      .catch((err) =>
        this.logger.warn(`RemoteCommands persist (pending) failed: ${(err as Error).message}`),
      );
    await this.amqp.sendCall(String(action), stationId, tenantId, payload, correlationId);
    this.metrics.inc(
      'citrineos_csms_calls_sent_total',
      { action: String(action) },
      1,
      'CSMS-initiated CALLs sent to chargers, by action.',
    );
    this.logger.debug(`Sent (no-wait) ${action} to ${stationId} corrId=${correlationId}`);
  }

  async sendAndAwait<TResponse extends Record<string, unknown>>(
    action: OCPP_CallAction | string,
    stationId: string,
    tenantId: number,
    payload: Record<string, unknown>,
    timeoutSeconds = 30,
  ): Promise<TResponse> {
    const tracer = trace.getTracer('citrineos.remote-calls');
    return tracer.startActiveSpan(
      'csms.send_and_await',
      {
        attributes: {
          'ocpp.action': String(action),
          'ocpp.station_id': stationId,
          'tenant.id': tenantId,
          'ocpp.timeout_seconds': timeoutSeconds,
        },
      },
      async (span) => {
        try {
          const result = await this.sendAndAwaitInner<TResponse>(
            action,
            stationId,
            tenantId,
            payload,
            timeoutSeconds,
          );
          return result;
        } catch (err) {
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
          throw err;
        } finally {
          span.end();
        }
      },
    );
  }

  private async sendAndAwaitInner<TResponse extends Record<string, unknown>>(
    action: OCPP_CallAction | string,
    stationId: string,
    tenantId: number,
    payload: Record<string, unknown>,
    timeoutSeconds: number,
  ): Promise<TResponse> {
    const correlationId = crypto.randomUUID();
    // Cache the originating request payload before sending so any
    // CsmsResponseHandler that fires can read it back to reconstruct
    // context (the CALL_RESULT only carries the response body).
    await this.cache.set(
      `${CSMS_REQUEST_NAMESPACE}:${correlationId}`,
      JSON.stringify({ action, payload, tenantId }),
      stationId,
      timeoutSeconds + 5,
    );

    // Record the round-trip in RemoteCommands for ops visibility (status
    // starts as 'pending'; updated below once the response lands).
    await this.remoteCommands
      .create({
        stationId,
        correlationId,
        tenantId,
        action: String(action),
        requestPayload: payload,
        result: 'pending',
      })
      .catch((err) =>
        this.logger.warn(`RemoteCommands persist (pending) failed: ${(err as Error).message}`),
      );

    const responsePromise = this.cache.onChange(correlationId, timeoutSeconds, stationId);
    await this.amqp.sendCall(action, stationId, tenantId, payload, correlationId);
    this.metrics.inc(
      'citrineos_csms_calls_sent_total',
      { action: String(action) },
      1,
      'CSMS-initiated CALLs sent to chargers, by action.',
    );
    this.logger.debug(`Sent ${action} to ${stationId} corrId=${correlationId}`);

    const responseJson = await responsePromise;
    if (responseJson === null) {
      void this.remoteCommands
        .complete({
          correlationId,
          tenantId,
          result: 'timeout',
          reason: `No CALL_RESULT within ${timeoutSeconds}s`,
        })
        .catch(() => {});
      this.metrics.inc(
        'citrineos_csms_calls_completed_total',
        { action: String(action), result: 'timeout' },
        1,
        'CSMS-initiated CALLs completed, by action and result.',
      );
      throw new Error(
        `No CALL_RESULT for ${action}/${stationId} (corrId=${correlationId}) within ${timeoutSeconds}s`,
      );
    }
    const response = JSON.parse(responseJson) as TResponse;
    const result = classifyResult(response);
    void this.remoteCommands
      .complete({
        correlationId,
        tenantId,
        result,
        responsePayload: response,
      })
      .catch((err) =>
        this.logger.warn(`RemoteCommands persist (complete) failed: ${(err as Error).message}`),
      );
    this.metrics.inc(
      'citrineos_csms_calls_completed_total',
      { action: String(action), result },
      1,
      'CSMS-initiated CALLs completed, by action and result.',
    );
    return response;
  }

  /**
   * Look up the originating request payload for a CALL_RESULT — used by
   * `CsmsResponseHandler` implementations that need to know what the CSMS
   * actually asked for.
   */
  async getOriginatingRequest<TPayload extends Record<string, unknown>>(
    correlationId: string,
    stationId: string,
  ): Promise<{ action: string; payload: TPayload; tenantId: number } | null> {
    const raw = await this.cache.get<string>(
      `${CSMS_REQUEST_NAMESPACE}:${correlationId}`,
      stationId,
    );
    if (!raw) return null;
    return JSON.parse(raw) as { action: string; payload: TPayload; tenantId: number };
  }
}

const CSMS_REQUEST_NAMESPACE = 'csms-request';

/**
 * Coarse outcome classification from the charger's CALL_RESULT body.
 * Most OCPP responses use a `status` field with values like `Accepted`,
 * `Rejected`, `Scheduled`, `Failed`. Anything not recognized falls back
 * to `accepted` (the round-trip succeeded; the response just doesn't
 * follow the conventional shape).
 */
function classifyResult(response: Record<string, unknown>): 'accepted' | 'rejected' | 'failed' {
  const status = String(response.status ?? '').toLowerCase();
  if (status === 'rejected') return 'rejected';
  if (status === 'failed') return 'failed';
  return 'accepted';
}
