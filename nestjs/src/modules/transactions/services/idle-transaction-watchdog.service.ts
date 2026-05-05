// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { TRANSACTIONS_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { TransactionsModuleConfig } from '@modules/config/config.schema';
import { MessageTriggerEnumType } from '@enums/message-trigger.enum';
import { OCPP_CallAction } from '@ocpp/call-action';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

/**
 * Per-(station, transaction) watchdog that fires a CSMS-initiated
 * `TriggerMessage(TransactionEvent)` CALL when the charger goes
 * `idleTransactionWatchdogSeconds` without a meter sample.
 *
 * Mirrors `core/src/modules/Transactions/src/module/_triggerIdleTransactionUpdate`.
 *
 * Lifecycle:
 *   1. `arm(...)` on TransactionEvent.Started.
 *   2. `kick(...)` on every TransactionEvent.Updated to reset the timer.
 *   3. `cancel(...)` on TransactionEvent.Ended.
 *
 * Disabled when `config.modules.transactions.idleTransactionWatchdogSeconds <= 0`.
 */
@Injectable()
export class IdleTransactionWatchdog implements OnModuleDestroy {
  private readonly logger = new Logger(IdleTransactionWatchdog.name);
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    @Inject(TRANSACTIONS_MODULE_CONFIG) private readonly cfg: TransactionsModuleConfig,
    private readonly remoteCalls: RemoteCallsService,
  ) {}

  /** Schedule (or reschedule) the watchdog for this transaction. */
  arm(stationId: string, transactionId: string, tenantId: number, evseId?: number | null): void {
    const seconds = this.cfg.idleTransactionWatchdogSeconds ?? 0;
    if (seconds <= 0) return;
    const key = this.key(stationId, transactionId);
    const existing = this.timers.get(key);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      void this.fire(stationId, transactionId, tenantId, evseId);
    }, seconds * 1_000);
    this.timers.set(key, timer);
  }

  /** Reset the watchdog — typically called on every Updated event. */
  kick(stationId: string, transactionId: string, tenantId: number, evseId?: number | null): void {
    this.arm(stationId, transactionId, tenantId, evseId);
  }

  /** Cancel — call on Ended (or when the row is deactivated). */
  cancel(stationId: string, transactionId: string): void {
    const key = this.key(stationId, transactionId);
    const t = this.timers.get(key);
    if (!t) return;
    clearTimeout(t);
    this.timers.delete(key);
  }

  onModuleDestroy(): void {
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
  }

  private async fire(
    stationId: string,
    transactionId: string,
    tenantId: number,
    evseId: number | null | undefined,
  ): Promise<void> {
    const key = this.key(stationId, transactionId);
    this.timers.delete(key);
    try {
      await this.remoteCalls.sendAndAwait(
        OCPP_CallAction.TriggerMessage,
        stationId,
        tenantId,
        {
          requestedMessage: MessageTriggerEnumType.TransactionEvent,
          ...(evseId !== undefined && evseId !== null ? { evse: { id: evseId } } : {}),
        },
        15,
      );
      this.logger.debug(
        `TriggerMessage(TransactionEvent) sent for idle ${stationId}/${transactionId}`,
      );
    } catch (err) {
      this.logger.warn(
        `Idle watchdog dispatch failed for ${stationId}/${transactionId}: ${(err as Error).message}`,
      );
    }
  }

  private key(stationId: string, transactionId: string): string {
    return `${stationId}:${transactionId}`;
  }
}
