// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { OCPP_CallAction } from '@ocpp/call-action';
import { MessageConfirmation } from '@remote-calls/message-confirmation.dto';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

/**
 * Fan-out helper used by every CSMS-initiated REST controller.
 *
 * The legacy CitrineOS API accepts `identifier` as either a single
 * stationId or an array; this helper normalizes both, dispatches them
 * sequentially through `RemoteCallsService.sendAndAwait`, and assembles
 * a `MessageConfirmation[]` (success/payload) so the response shape
 * exactly matches the legacy contract.
 *
 * Errors are caught per-station and reported as `{ success: false }`
 * rather than propagated — partial-success is the legacy semantic for
 * batch CSMS calls.
 */
@Injectable()
export class RemoteCallDispatcher {
  private readonly logger = new Logger(RemoteCallDispatcher.name);

  constructor(private readonly remoteCalls: RemoteCallsService) {}

  /**
   * @param identifier   one or more stationIds
   * @param timeoutSeconds  maximum time to wait for each charger's CALL_RESULT
   */
  async dispatch(
    action: OCPP_CallAction,
    identifier: string | string[],
    tenantId: number,
    payload: Record<string, unknown>,
    timeoutSeconds = 30,
  ): Promise<MessageConfirmation[]> {
    const ids = Array.isArray(identifier) ? identifier : [identifier];
    const out: MessageConfirmation[] = [];
    for (const stationId of ids) {
      try {
        const result = await this.remoteCalls.sendAndAwait<Record<string, unknown>>(
          action,
          stationId,
          tenantId,
          payload,
          timeoutSeconds,
        );
        out.push({ success: true, payload: result });
      } catch (err) {
        const reason = (err as Error).message;
        this.logger.warn(`${action} → ${stationId} failed: ${reason}`);
        out.push({ success: false, payload: reason });
      }
    }
    return out;
  }
}
