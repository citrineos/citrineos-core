// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  TransactionEventDto,
  TransactionEventEnumType,
  TriggerReasonEnumType,
} from '@citrineos/types';
import {
  type TransactionEventEntity,
  transactionEventTable,
  tenantTransactionEventTable,
} from '../../db/drizzle/schema/transaction-event.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external TransactionEventDto contract.
export function toTransactionEventDto(entity: TransactionEventEntity): TransactionEventDto {
  const dto: Explicit<TransactionEventDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    // Enum stored as a plain string column.
    eventType: entity.eventType as TransactionEventEnumType,
    // Relation not present as a scalar column.
    meterValue: undefined,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp.toISOString(),
    triggerReason: entity.triggerReason as TriggerReasonEnumType,
    seqNo: entity.seqNo,
    offline: entity.offline ?? null,
    numberOfPhasesUsed: entity.numberOfPhasesUsed ?? null,
    // DECIMAL column comes back as a string from node-postgres.
    cableMaxCurrent: entity.cableMaxCurrent != null ? Number(entity.cableMaxCurrent) : null,
    reservationId: entity.reservationId ?? null,
    transactionDatabaseId: entity.transactionDatabaseId ?? undefined,
    transactionCreatedAt: entity.transactionCreatedAt,
    transactionInfo: entity.transactionInfo ?? undefined,
    evseId: entity.evseId ?? null,
    // Relation not present as a scalar column.
    evse: undefined,
    idTokenValue: entity.idTokenValue ?? null,
    idTokenType: entity.idTokenType ?? null,
    // customData is not persisted as a column on this model.
    customData: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleTransactionEventRepository extends DrizzleRepository<
  typeof transactionEventTable,
  TransactionEventDto
> {
  protected getTable(tenantId: number): typeof transactionEventTable {
    return this.useTenantSchema ? tenantTransactionEventTable(tenantId) : transactionEventTable;
  }

  protected toDto(row: TransactionEventEntity): TransactionEventDto {
    return toTransactionEventDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
