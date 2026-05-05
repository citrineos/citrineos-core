// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject } from '@nestjs/common';
import { TRANSACTIONS_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { TransactionsModuleConfig } from '@modules/config/config.schema';
import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { MeterValuesRequest } from '@dto/transactions/meter-values.request';
import { TransactionRepository } from '@repositories/transaction.repository';
import { TransactionService } from '@modules/transactions/services/transaction.service';
import { CostNotifier } from '@modules/transactions/services/cost-notifier.service';

/**
 * Standalone OCPP 2.0.1 / 2.1 MeterValues handler.
 *
 * Mirrors legacy `_handleMeterValues` in
 * `core/src/modules/Transactions/src/module/module.ts`:
 *
 *   - Per OCPP 2.0.1, samples for a transaction MUST be carried in the
 *     `TransactionEvent` request. The standalone `MeterValues` request is
 *     reserved for clock-driven / non-transaction sampling and only
 *     processed when `sendCostUpdatedOnMeterValue` is enabled.
 *   - When enabled and `evseId !== 0`, look up the active transaction on
 *     that EVSE and attribute the samples to it; recompute totalKwh and
 *     fire a CostUpdated CALL via CostNotifier.
 *   - When `evseId === 0`, the request applies to the entire charging
 *     station — there's no single transaction to attribute against, so
 *     we log and ignore (matches legacy).
 */
@OcppHandler(
  OCPP_CallAction.MeterValues,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  MeterValuesRequest,
)
export class MeterValuesHandler extends OcppRequestHandler<MeterValuesRequest> {
  constructor(
    @Inject(TRANSACTIONS_MODULE_CONFIG) private readonly cfg: TransactionsModuleConfig,
    private readonly txRepo: TransactionRepository,
    private readonly transactionService: TransactionService,
    private readonly costNotifier: CostNotifier,
  ) {
    super();
  }

  async handle(msg: OcppMessage<MeterValuesRequest>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { evseId, meterValue } = msg.payload;

    this.logger.debug(
      `MeterValues from ${stationId}: evseId=${evseId}, ${meterValue.length} readings`,
    );

    // Legacy parity: standalone MeterValues only persisted when the
    // operator opts in via `sendCostUpdatedOnMeterValue`. Otherwise the
    // CSMS just acks `{}` (transaction-tied samples flow via
    // TransactionEvent.meterValue instead).
    if (!this.cfg.sendCostUpdatedOnMeterValue || evseId === 0) {
      return {};
    }

    // Fire-and-forget: attribute to the active transaction on this evse,
    // persist + recompute totalKwh + dispatch CostUpdated.
    void this.attributeAndNotify(tenantId, stationId, evseId, meterValue).catch((err) =>
      this.logger.error(
        `Failed to attribute MeterValues for ${stationId}/evse=${evseId}: ${(err as Error).message}`,
      ),
    );
    return {};
  }

  private async attributeAndNotify(
    tenantId: number,
    stationId: string,
    evseId: number,
    meterValue: MeterValuesRequest['meterValue'],
  ): Promise<void> {
    const activeTx = await this.txRepo.findActiveByEvse(tenantId, stationId, evseId);
    if (!activeTx) {
      this.logger.warn(
        `Active transaction not found on station ${stationId} evse ${evseId} — dropping ${meterValue.length} sample(s)`,
      );
      return;
    }

    await this.transactionService.recordMeterValues(
      tenantId,
      stationId,
      activeTx.transactionId,
      meterValue,
    );

    // CostNotifier already runs on its own interval; this is a one-shot
    // dispatch to surface the new totalKwh immediately.
    await this.costNotifier.notifyOnce(stationId, activeTx.transactionId, tenantId);
  }
}
