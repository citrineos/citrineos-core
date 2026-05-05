// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { TRANSACTIONS_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { TransactionsModuleConfig } from '@modules/config/config.schema';
import { OCPP_CallAction } from '@ocpp/call-action';
import { computeTotalKwh } from '@mappers/transactions/total-kwh';
import { CostService } from '@modules/transactions/services/cost.service';
import { MeterValueRepository } from '@repositories/meter-value.repository';
import { TransactionRepository } from '@repositories/transaction.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

/**
 * Periodic CostUpdated dispatcher. Mirrors `core/src/modules/Transactions/src/module/CostNotifier.ts`.
 *
 * Started transactions register here via `notifyWhileActive`; the service
 * fires a CostUpdated CALL at `costUpdatedInterval` until the transaction
 * row turns inactive (at which point the timer self-cancels).
 *
 * Each tick:
 *   1. Reload the Transaction row
 *   2. If `isActive=false` → unschedule and exit
 *   3. Recompute totalKwh from MeterValues, then totalCost via CostService
 *   4. Persist the recomputed cost
 *   5. Dispatch CostUpdated CALL via RemoteCallsService (best-effort,
 *      doesn't await charger response — the charger acknowledges async)
 *
 * Timers are stored in an in-memory Map keyed on `stationId:transactionId`.
 * Restarts lose the schedule — the legacy server has the same constraint;
 * it's typically re-armed on the next TransactionEvent.Updated.
 */
@Injectable()
export class CostNotifier implements OnModuleDestroy {
  private readonly logger = new Logger(CostNotifier.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(TRANSACTIONS_MODULE_CONFIG) private readonly cfg: TransactionsModuleConfig,
    private readonly txRepo: TransactionRepository,
    private readonly meterValueRepo: MeterValueRepository,
    private readonly costService: CostService,
    private readonly remoteCalls: RemoteCallsService,
  ) {}

  /**
   * Schedule a periodic CostUpdated for this active transaction. No-op
   * if the configured interval is non-positive (cost notification disabled)
   * or if a timer is already running for this key.
   */
  notifyWhileActive(stationId: string, transactionId: string, tenantId: number): void {
    const interval = this.cfg.costUpdatedInterval ?? 0;
    if (interval <= 0) return;

    const key = `${stationId}:${transactionId}`;
    if (this.timers.has(key)) return;

    const timer = setInterval(() => {
      void this.tick(stationId, transactionId, tenantId);
    }, interval * 1_000);
    this.timers.set(key, timer);
    this.logger.debug(`Scheduled CostUpdated for ${key} every ${interval}s`);
  }

  /** Manual one-shot — used by the early-respond path on TransactionEvent.Ended. */
  async notifyOnce(stationId: string, transactionId: string, tenantId: number): Promise<void> {
    await this.computeAndDispatch(stationId, transactionId, tenantId);
  }

  onModuleDestroy(): void {
    for (const t of this.timers.values()) clearInterval(t);
    this.timers.clear();
  }

  private async tick(stationId: string, transactionId: string, tenantId: number): Promise<void> {
    const key = `${stationId}:${transactionId}`;
    try {
      const tx = await this.txRepo.findActive(tenantId, stationId, transactionId);
      if (!tx) {
        this.logger.warn(`Transaction ${key} not found — unscheduling`);
        this.unschedule(key);
        return;
      }
      if (!tx.isActive) {
        this.logger.debug(`Transaction ${key} no longer active — unscheduling`);
        this.unschedule(key);
        return;
      }
      await this.computeAndDispatch(stationId, transactionId, tenantId);
    } catch (err) {
      this.logger.error(`CostNotifier tick failed for ${key}: ${(err as Error).message}`);
      this.unschedule(key);
    }
  }

  private unschedule(key: string): void {
    const timer = this.timers.get(key);
    if (!timer) return;
    clearInterval(timer);
    this.timers.delete(key);
  }

  private async computeAndDispatch(
    stationId: string,
    transactionId: string,
    tenantId: number,
  ): Promise<void> {
    const stored = await this.meterValueRepo.findByTransaction(tenantId, transactionId);
    const totalKwh = computeTotalKwh(stored);
    if (totalKwh === null) return;
    const cost = this.costService.computeFromKwh(totalKwh);
    if (!cost) return;

    await this.txRepo.setTotalCost(tenantId, stationId, transactionId, cost.totalCost);

    // Fire-and-forget — the charger ACKs back via the normal response
    // handler chain. We don't await `sendAndAwait` because the timer
    // shouldn't queue up if the charger is slow to ACK.
    void this.remoteCalls
      .sendAndAwait(
        OCPP_CallAction.CostUpdated,
        stationId,
        tenantId,
        { totalCost: Number(cost.totalCost), transactionId },
        Math.max(5, (this.cfg.costUpdatedInterval ?? 60) - 5),
      )
      .catch((err) =>
        this.logger.warn(
          `CostUpdated to ${stationId}/${transactionId} failed: ${(err as Error).message}`,
        ),
      );
  }
}
