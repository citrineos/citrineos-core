// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ClearedChargingLimitRequest } from '@dto/smartcharging/cleared-charging-limit.request';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * ClearedChargingLimit (OCPP 2.0.1 / 2.1).
 *
 * Pairs with NotifyChargingLimit — charger reports the previously
 * applied external limit has been cleared and the EVSE is back to
 * normal operation. We ack `{}` and emit `charging-limit.cleared` so
 * load-balancing systems can re-balance.
 */
@OcppHandler(
  OCPP_CallAction.ClearedChargingLimit,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  ClearedChargingLimitRequest,
)
export class ClearedChargingLimitHandler extends OcppRequestHandler<ClearedChargingLimitRequest> {
  constructor(private readonly webhooks: WebhookService) {
    super();
  }

  async handle(msg: OcppMessage<ClearedChargingLimitRequest>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { chargingLimitSource, evseId } = msg.payload;
    this.logger.debug(
      `ClearedChargingLimit from ${stationId}: source=${chargingLimitSource}, evseId=${evseId ?? 'all'}`,
    );

    this.webhooks.emit(
      WebhookEvent.ChargingLimitCleared,
      { ...msg.payload },
      { stationId, tenantId },
    );

    return {};
  }
}
