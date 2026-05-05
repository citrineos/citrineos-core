// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { TransactionEventEnumType } from '@enums/transaction-event.enum';
import { TransactionEventRequest } from '@dto/transactions/transaction-event.request';
import { NewTransaction } from '@entities/transaction.entity';
import { NewTransactionEventRow } from '@entities/transaction-event.entity';

/**
 * 1.6 transactionId is an int, but our internal `Transactions.transactionId`
 * is a string so 1.6 and 2.0.1 share the same column. The composite
 * `16-{stationId}-{intId}` key is opaque to the wire — it never leaks
 * back to a charger — but is referenced by handlers and tests.
 */
export const ocpp16TransactionUuid = (stationId: string, transactionId: number): string =>
  `16-${stationId}-${transactionId}`;

/**
 * Encode an OCPP 1.6 integer transactionId from a wall-clock timestamp.
 * 32-bit positive int per the 1.6 spec; collisions inside a second are
 * vanishingly unlikely for a single station, and a unique index on
 * `(stationId, transactionId)` would catch them anyway.
 */
export const mintOcpp16TransactionId = (now: Date = new Date()): number =>
  Math.floor(now.getTime() / 1000) & 0x7fffffff;

/**
 * Maps OCPP TransactionEvent / 1.6 StartTransaction wire shapes into
 * Transaction + TransactionEvent rows.
 *
 * Mirrors `core/src/dal/layers/sequelize/model/TransactionEvent/Transaction.ts`
 * and the inline persistence in legacy `_handleTransactionEvent`.
 */
export class TransactionMapper {
  /**
   * OCPP 2.0.1 / 2.1 TransactionEvent eventType=Started → Transaction insert.
   * Note: `Transaction.evseId` is a FK to `Evses.id` (the integer surrogate),
   * not the wire-level OCPP evseId. Until the Evse row is materialised it
   * stays null; the wire value is preserved on `TransactionEvents`.
   */
  static fromTransactionStarted(
    stationId: string,
    tenantId: number,
    transactionId: string,
    timestamp: string,
    _evseId?: number | null,
  ): NewTransaction {
    return {
      stationId,
      tenantId,
      transactionId,
      isActive: true,
      startTime: new Date(timestamp),
      evseId: null,
    };
  }

  /** OCPP 1.6 StartTransaction → Transaction insert (uses composite uuid). */
  static fromStartTransaction16(
    stationId: string,
    tenantId: number,
    transactionId: number,
    timestamp: string,
  ): NewTransaction {
    return {
      stationId,
      tenantId,
      transactionId: ocpp16TransactionUuid(stationId, transactionId),
      isActive: true,
      startTime: new Date(timestamp),
    };
  }

  /**
   * Any TransactionEvent → log entry on TransactionEvents table.
   * Legacy schema: full wire payload on `transactionInfo` (json) + flat
   * columns mirroring the top-level fields. The caller passes
   * `transactionDatabaseId` after looking up the parent Transactions
   * row.
   */
  static toTransactionEventRow(
    stationId: string,
    tenantId: number,
    transactionDatabaseId: number | null,
    eventType: TransactionEventEnumType,
    seqNo: number,
    timestamp: string,
    payload: TransactionEventRequest,
  ): NewTransactionEventRow {
    return {
      stationId,
      tenantId,
      transactionDatabaseId,
      eventType,
      seqNo,
      timestamp: new Date(timestamp),
      transactionInfo: payload as unknown as Record<string, unknown>,
      triggerReason: payload.triggerReason ?? null,
      offline: payload.offline ?? false,
      numberOfPhasesUsed: payload.numberOfPhasesUsed ?? null,
      cableMaxCurrent:
        payload.cableMaxCurrent !== undefined && payload.cableMaxCurrent !== null
          ? String(payload.cableMaxCurrent)
          : null,
      reservationId: payload.reservationId ?? null,
      // `TransactionEvents.evseId` is a FK to `EvseTypes.databaseId`, not
      // the wire-level OCPP evseId. The wire value is preserved on
      // `transactionInfo`. Until the EvseType row exists, leave null.
      evseId: null,
      idTokenValue: payload.idToken?.idToken ?? null,
      idTokenType: payload.idToken?.type ?? null,
    };
  }
}
