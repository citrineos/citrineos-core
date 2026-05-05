// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject } from '@nestjs/common';
import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import {
  HANDLER_HANDLED_RESPONSE,
  type HandlerHandledResponse,
  OcppMessage,
  OcppRequestHandler,
} from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { TransactionEventRequest } from '@dto/transactions/transaction-event.request';
import { TransactionEventEnumType } from '@enums/transaction-event.enum';
import { TRANSACTIONS_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { TransactionsModuleConfig } from '@modules/config/config.schema';
import { TransactionService } from '@modules/transactions/services/transaction.service';
import { TransactionRepository } from '@repositories/transaction.repository';
import { CostService } from '@modules/transactions/services/cost.service';
import { CostNotifier } from '@modules/transactions/services/cost-notifier.service';
import { IdleTransactionWatchdog } from '@modules/transactions/services/idle-transaction-watchdog.service';
import { ReservationRepository } from '@repositories/reservation.repository';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * TransactionEvent (OCPP 2.0.1 / 2.1) — Started / Updated / Ended.
 *
 * Mirrors legacy `_handleTransactionEvent`:
 *   1. If idToken present, run the inline Authorize chain to build idTokenInfo.
 *   2. **Updated** events with `sendCostUpdatedOnMeterValue=true` and an
 *      active transaction with `totalKwh` set → include `totalCost` in
 *      the response so the charger displays running cost (OCPP I02).
 *   3. **Ended** events with `totalKwh` → always include `totalCost`.
 *   4. Respond to the charger.
 *   5. Persist Transaction row, deactivate stale tx on same EVSE,
 *      retire matching Reservation, schedule CostNotifier on Started.
 */
@OcppHandler(
  OCPP_CallAction.TransactionEvent,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  TransactionEventRequest,
)
export class TransactionEventHandler extends OcppRequestHandler<TransactionEventRequest> {
  constructor(
    @Inject(TRANSACTIONS_MODULE_CONFIG) private readonly cfg: TransactionsModuleConfig,
    private readonly transactionService: TransactionService,
    private readonly txRepo: TransactionRepository,
    private readonly costService: CostService,
    private readonly reservationRepo: ReservationRepository,
    private readonly webhooks: WebhookService,
    private readonly costNotifier: CostNotifier,
    private readonly idleWatchdog: IdleTransactionWatchdog,
  ) {
    super();
  }

  async handle(msg: OcppMessage<TransactionEventRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { eventType, transactionInfo, seqNo, timestamp, idToken } = msg.payload;

    this.logger.debug(
      `TransactionEvent from ${stationId}: eventType=${eventType}, txId=${transactionInfo.transactionId}`,
    );

    // Build the response body.
    const response: Record<string, unknown> = {};
    if (idToken) {
      response.idTokenInfo = await this.transactionService.authorizeIdToken(tenantId, idToken, {
        stationId,
        evseId: msg.payload.evse?.id,
        connectorId: msg.payload.evse?.connectorId,
      });
    }

    // Updated/Ended cost calc — include `totalCost` in the response so
    // the charger displays running cost. Legacy "I02 Show EV Driver
    // Running Total Cost" + final-tick cost on Ended.
    if (eventType === TransactionEventEnumType.Updated && this.cfg.sendCostUpdatedOnMeterValue) {
      const totalCost = await this.computeTotalCostIfActive(
        tenantId,
        stationId,
        transactionInfo.transactionId,
      );
      if (totalCost !== null) response.totalCost = totalCost;
    } else if (eventType === TransactionEventEnumType.Ended) {
      const totalCost = await this.computeTotalCostIfActive(
        tenantId,
        stationId,
        transactionInfo.transactionId,
      );
      if (totalCost !== null) response.totalCost = totalCost;
    }

    // Respond to the charger NOW.
    await msg.respond(response);

    // Semantic webhook.
    const eventName: WebhookEvent =
      eventType === TransactionEventEnumType.Started
        ? WebhookEvent.TransactionStarted
        : eventType === TransactionEventEnumType.Updated
          ? WebhookEvent.TransactionUpdated
          : WebhookEvent.TransactionEnded;
    this.webhooks.emit(eventName, { request: msg.payload, response }, { stationId, tenantId });

    void this.persistTransactionEvent(
      tenantId,
      stationId,
      eventType,
      transactionInfo,
      seqNo,
      timestamp,
      msg.payload,
    ).catch((err) =>
      this.logger.error(
        `Failed to persist TransactionEvent for ${stationId}/${transactionInfo.transactionId}: ${(err as Error).message}`,
      ),
    );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }

  /**
   * Read the Transaction row's totalKwh (already maintained by
   * recordMeterValues) and convert to totalCost via the flat-rate
   * pricing service. Returns `null` when the tx isn't active or has
   * no totalKwh yet — in either case legacy omits the field.
   */
  private async computeTotalCostIfActive(
    tenantId: number,
    stationId: string,
    transactionId: string,
  ): Promise<number | null> {
    const tx = await this.txRepo.findActive(tenantId, stationId, transactionId);
    if (!tx || !tx.isActive || !tx.totalKwh) return null;
    const cost = this.costService.computeFromKwh(tx.totalKwh);
    if (!cost) return null;
    const n = Number(cost.totalCost);
    return Number.isFinite(n) ? n : null;
  }

  private async persistTransactionEvent(
    tenantId: number,
    stationId: string,
    eventType: TransactionEventEnumType,
    transactionInfo: TransactionEventRequest['transactionInfo'],
    seqNo: number,
    timestamp: string,
    fullPayload: TransactionEventRequest,
  ): Promise<void> {
    if (eventType === TransactionEventEnumType.Started) {
      const evseId = fullPayload.evse?.id ?? null;
      await this.transactionService.startTransaction(
        tenantId,
        stationId,
        transactionInfo.transactionId,
        timestamp,
        evseId,
      );

      if (typeof fullPayload.reservationId === 'number') {
        await this.reservationRepo.upsert({
          stationId,
          tenantId,
          id: fullPayload.reservationId,
          isActive: false,
        });
      }

      this.costNotifier.notifyWhileActive(stationId, transactionInfo.transactionId, tenantId);
      this.idleWatchdog.arm(
        stationId,
        transactionInfo.transactionId,
        tenantId,
        fullPayload.evse?.id,
      );
    } else if (eventType === TransactionEventEnumType.Updated) {
      this.idleWatchdog.kick(
        stationId,
        transactionInfo.transactionId,
        tenantId,
        fullPayload.evse?.id,
      );
    }

    if (fullPayload.meterValue && fullPayload.meterValue.length > 0) {
      await this.transactionService.recordMeterValues(
        tenantId,
        stationId,
        transactionInfo.transactionId,
        fullPayload.meterValue,
      );
    }

    if (eventType === TransactionEventEnumType.Ended) {
      await this.transactionService.endTransaction(
        tenantId,
        stationId,
        transactionInfo.transactionId,
        transactionInfo.stoppedReason ?? 'Other',
      );
      this.idleWatchdog.cancel(stationId, transactionInfo.transactionId);
      await this.costNotifier.notifyOnce(stationId, transactionInfo.transactionId, tenantId);
    }

    await this.transactionService.addEvent(
      tenantId,
      stationId,
      transactionInfo.transactionId,
      eventType,
      seqNo,
      timestamp,
      fullPayload,
    );
  }
}
