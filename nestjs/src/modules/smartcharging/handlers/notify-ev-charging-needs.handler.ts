// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { NotifyEVChargingNeedsRequest } from '@dto/smartcharging/notify-ev-charging-needs.request';
import { ChargingNeedsRepository } from '@repositories/charging-needs.repository';
import { TransactionRepository } from '@repositories/transaction.repository';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * NotifyEVChargingNeeds (OCPP 2.0.1 / 2.1).
 *
 * EV announces its charging needs (energy transfer mode + AC/DC
 * parameters). Mirrors legacy `_handleNotifyEVChargingNeeds`:
 *
 *   1. Reject when no active transaction exists on the (station, evse)
 *      pair, or when the AC/DC parameters don't match the declared
 *      `requestedEnergyTransfer`. Per OCPP 2.0.1 Part 2 K17.FR.06.
 *   2. Otherwise: persist the needs, ack `Accepted`, emit a webhook so a
 *      downstream optimizer can produce a charging profile.
 *
 * Schedule generation + dispatch of a follow-up `SetChargingProfile` is
 * deferred (legacy delegates to `SmartChargingService.calculateChargingProfile`
 * which requires a real energy optimizer). External optimizers can subscribe
 * to the webhook and dispatch `SetChargingProfile` themselves; the parity
 * gap is the *internal* schedule generation, not the data path.
 */
@OcppHandler(
  OCPP_CallAction.NotifyEVChargingNeeds,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  NotifyEVChargingNeedsRequest,
)
export class NotifyEVChargingNeedsHandler extends OcppRequestHandler<NotifyEVChargingNeedsRequest> {
  constructor(
    private readonly chargingNeedsRepo: ChargingNeedsRepository,
    private readonly txRepo: TransactionRepository,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<NotifyEVChargingNeedsRequest>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { evseId, chargingNeeds } = msg.payload;
    this.logger.debug(
      `NotifyEVChargingNeeds from ${stationId}: evseId=${evseId}, energyTransfer=${chargingNeeds.requestedEnergyTransfer}`,
    );

    const activeTx = await this.txRepo.findActiveByEvse(tenantId, stationId, evseId);

    const hasAcOrDcParams =
      chargingNeeds.dcChargingParameters != null || chargingNeeds.acChargingParameters != null;
    const transferIsDc = chargingNeeds.requestedEnergyTransfer === 'DC';
    const matchedChargingType =
      (chargingNeeds.dcChargingParameters != null && transferIsDc) ||
      (chargingNeeds.acChargingParameters != null && !transferIsDc);

    if (!activeTx || !hasAcOrDcParams || !matchedChargingType) {
      this.logger.debug(
        `NotifyEVChargingNeeds ${stationId}: rejected (activeTx=${!!activeTx}, hasParams=${hasAcOrDcParams}, matched=${matchedChargingType})`,
      );
      return { status: 'Rejected' };
    }

    await this.chargingNeedsRepo.insert({
      evseId,
      transactionDatabaseId: activeTx.id,
      requestedEnergyTransfer: chargingNeeds.requestedEnergyTransfer,
      acChargingParameters: chargingNeeds.acChargingParameters ?? null,
      dcChargingParameters: chargingNeeds.dcChargingParameters ?? null,
      tenantId,
    });

    this.webhooks.emit(
      WebhookEvent.SmartChargingNotifyEVChargingNeeds,
      { ...msg.payload },
      { stationId, tenantId },
    );

    return { status: 'Accepted' };
  }
}
