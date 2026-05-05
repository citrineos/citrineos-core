// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { NotifyEVChargingScheduleRequest } from '@dto/smartcharging/notify-ev-charging-schedule.request';
import { TransactionRepository } from '@repositories/transaction.repository';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * NotifyEVChargingSchedule (OCPP 2.0.1 / 2.1).
 *
 * Charger forwards the EV's negotiated ISO 15118 schedule. Mirrors legacy
 * `_handleNotifyEVChargingSchedule`:
 *
 *   1. Always Accept (per OCPP 2.0.1 V3 Part 2 §1.37.2 — the `status`
 *      field semantics differ from the K17.FR.11/12 expectation; legacy
 *      uses §1.37.2's interpretation).
 *   2. If no active transaction exists on the (station, evse), log + skip
 *      downstream work — the schedule has nowhere to attach.
 *   3. Otherwise emit the webhook so downstream optimizers (load balancing,
 *      energy trading) can consume it.
 *
 * Legacy also runs `checkLimitsOfChargingSchedule` and dispatches a fresh
 * `SetChargingProfile` when the EV-supplied schedule exceeds existing
 * limits. That path requires a real schedule generator + limit checker —
 * deferred along with `NotifyEVChargingNeeds`. External optimizers
 * subscribed to the webhook can do the same dispatch themselves.
 */
@OcppHandler(
  OCPP_CallAction.NotifyEVChargingSchedule,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  NotifyEVChargingScheduleRequest,
)
export class NotifyEVChargingScheduleHandler extends OcppRequestHandler<NotifyEVChargingScheduleRequest> {
  constructor(
    private readonly txRepo: TransactionRepository,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(
    msg: OcppMessage<NotifyEVChargingScheduleRequest>,
  ): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { evseId, timeBase, chargingSchedule } = msg.payload;
    this.logger.debug(
      `NotifyEVChargingSchedule from ${stationId}: evseId=${evseId}, timeBase=${timeBase}, periods=${chargingSchedule.chargingSchedulePeriod?.length ?? 0}`,
    );

    const activeTx = await this.txRepo.findActiveByEvse(tenantId, stationId, evseId);
    if (!activeTx) {
      this.logger.error(
        `NotifyEVChargingSchedule ${stationId}: no active transaction on evse ${evseId} — schedule dropped`,
      );
      return { status: 'Accepted' };
    }

    this.webhooks.emit(
      WebhookEvent.SmartChargingNotifyEVChargingSchedule,
      { ...msg.payload, transactionId: activeTx.transactionId },
      { stationId, tenantId },
    );

    return { status: 'Accepted' };
  }
}
