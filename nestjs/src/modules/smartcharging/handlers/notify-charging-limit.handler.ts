// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { NotifyChargingLimitRequest } from '@dto/smartcharging/notify-charging-limit.request';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * NotifyChargingLimit (OCPP 2.0.1 / 2.1).
 *
 * Charger reports that an external entity (grid operator, energy
 * management system) applied a charging limit. We ack `{}` and emit a
 * `charging-limit.set` webhook so external systems (load balancers,
 * billing) can react. Mirrors the legacy `_handleNotifyChargingLimit`.
 */
@OcppHandler(
  OCPP_CallAction.NotifyChargingLimit,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  NotifyChargingLimitRequest,
)
export class NotifyChargingLimitHandler extends OcppRequestHandler<NotifyChargingLimitRequest> {
  constructor(private readonly webhooks: WebhookService) {
    super();
  }

  async handle(msg: OcppMessage<NotifyChargingLimitRequest>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { chargingLimit, evseId } = msg.payload;
    this.logger.debug(
      `NotifyChargingLimit from ${stationId}: source=${chargingLimit.chargingLimitSource}, evseId=${evseId ?? 'all'}, gridCritical=${chargingLimit.isGridCritical ?? false}`,
    );

    this.webhooks.emit(WebhookEvent.ChargingLimitSet, { ...msg.payload }, { stationId, tenantId });

    return {};
  }
}
