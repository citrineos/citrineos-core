// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  MeterValueDto,
  TransactionEventDto,
  TransactionEventEnumType,
  TriggerReasonEnumType,
} from '@citrineos/types';
import { and, eq, inArray } from 'drizzle-orm';
import {
  type TransactionEventEntity,
  transactionEventTable,
  tenantTransactionEventTable,
} from '../../db/drizzle/schema/transaction-event.js';
import {
  type MeterValueEntity,
  meterValueTable,
  tenantMeterValueTable,
} from '../../db/drizzle/schema/meter-value.js';
import {
  type EvseTypeEntity,
  evseTypeTable,
  tenantEvseTypeTable,
} from '../../db/drizzle/schema/evse-type.js';
import { tenantTransactionTable, transactionTable } from '../../db/drizzle/schema/transaction.js';
import { type Explicit } from '../../db/drizzle/types.js';
import type { ITransactionEventRepository } from '../repositories.js';
import { toMeterValueDto } from './meter-value.js';
import { toEvseTypeDto } from './evse-type.js';
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
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleTransactionEventRepository
  extends DrizzleRepository<typeof transactionEventTable, TransactionEventDto>
  implements ITransactionEventRepository
{
  protected getTable(tenantId: number): typeof transactionEventTable {
    return this.useTenantSchema ? tenantTransactionEventTable(tenantId) : transactionEventTable;
  }

  protected toDto(row: TransactionEventEntity): TransactionEventDto {
    return toTransactionEventDto(row);
  }

  private getTransactionTable(tenantId: number): typeof transactionTable {
    return this.useTenantSchema ? tenantTransactionTable(tenantId) : transactionTable;
  }

  private getMeterValueTable(tenantId: number): typeof meterValueTable {
    return this.useTenantSchema ? tenantMeterValueTable(tenantId) : meterValueTable;
  }

  private getEvseTypeTable(tenantId: number): typeof evseTypeTable {
    return this.useTenantSchema ? tenantEvseTypeTable(tenantId) : evseTypeTable;
  }

  async readAllByStationIdAndTransactionId(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<TransactionEventDto[]> {
    const events = this.getTable(tenantId);
    const transactions = this.getTransactionTable(tenantId);

    const rows = (await this.db
      .select({ event: events })
      .from(events)
      .innerJoin(
        transactions,
        and(
          eq(events.transactionDatabaseId, transactions.id),
          eq(transactions.transactionId, transactionId),
          this.tenantFilter(transactions, tenantId),
        ),
      )
      .where(
        and(eq(events.ocppConnectionName, ocppConnectionName), this.tenantFilter(events, tenantId)),
      )) as { event: TransactionEventEntity }[];

    return await this.hydrateTransactionEvents(
      tenantId,
      rows.map((row) => row.event),
    );
  }

  // Owned here rather than on the transaction repository: these hydrate TransactionEvents
  // rows, and that repository delegates to this one for them.
  async readByTransactionDatabaseIds(
    tenantId: number,
    transactionDatabaseIds: number[],
  ): Promise<Map<number, TransactionEventDto[]>> {
    const byTransaction = new Map<number, TransactionEventDto[]>();
    if (transactionDatabaseIds.length === 0) {
      return byTransaction;
    }
    const events = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(events)
      .where(
        and(
          inArray(events.transactionDatabaseId, transactionDatabaseIds),
          this.tenantFilter(events, tenantId),
        ),
      )) as TransactionEventEntity[];

    const hydrated = await this.hydrateTransactionEvents(tenantId, rows);
    for (const [index, row] of rows.entries()) {
      if (row.transactionDatabaseId == null) continue;
      const bucket = byTransaction.get(row.transactionDatabaseId) ?? [];
      bucket.push(hydrated[index]);
      byTransaction.set(row.transactionDatabaseId, bucket);
    }
    return byTransaction;
  }

  private async hydrateTransactionEvents(
    tenantId: number,
    rows: TransactionEventEntity[],
  ): Promise<TransactionEventDto[]> {
    const meterValuesByEvent = await this.readMeterValuesByTransactionEventIds(
      tenantId,
      rows.map((row) => row.id),
    );
    const evseTypesByDatabaseId = await this.readEvseTypesByDatabaseIds(
      tenantId,
      rows.flatMap((row) => (row.evseId == null ? [] : [row.evseId])),
    );

    return rows.map((row) => {
      const meterValues = meterValuesByEvent.get(row.id);
      const evseType = row.evseId == null ? undefined : evseTypesByDatabaseId.get(row.evseId);
      return {
        ...toTransactionEventDto(row),
        // The DTO types meterValue as a non-empty tuple, so an event with no readings
        // keeps the undefined the mapper already set rather than an empty array.
        ...(meterValues?.length
          ? { meterValue: meterValues as TransactionEventDto['meterValue'] }
          : {}),
        ...(evseType ? { evse: toEvseTypeDto(evseType) } : {}),
      };
    });
  }

  private async readMeterValuesByTransactionEventIds(
    tenantId: number,
    transactionEventIds: number[],
  ): Promise<Map<number, MeterValueDto[]>> {
    const byEvent = new Map<number, MeterValueDto[]>();
    if (transactionEventIds.length === 0) {
      return byEvent;
    }
    const meterValues = this.getMeterValueTable(tenantId);
    const rows = (await this.db
      .select()
      .from(meterValues)
      .where(
        and(
          inArray(meterValues.transactionEventId, transactionEventIds),
          this.tenantFilter(meterValues, tenantId),
        ),
      )) as MeterValueEntity[];

    for (const row of rows) {
      if (row.transactionEventId == null) continue;
      const bucket = byEvent.get(row.transactionEventId) ?? [];
      bucket.push(toMeterValueDto(row));
      byEvent.set(row.transactionEventId, bucket);
    }
    return byEvent;
  }

  // TransactionEvents.evseId targets EvseTypes.databaseId, the surrogate key — not
  // EvseTypes.id, which carries the OCPP evse number.
  private async readEvseTypesByDatabaseIds(
    tenantId: number,
    evseTypeDatabaseIds: number[],
  ): Promise<Map<number, EvseTypeEntity>> {
    const byDatabaseId = new Map<number, EvseTypeEntity>();
    if (evseTypeDatabaseIds.length === 0) {
      return byDatabaseId;
    }
    const evseTypes = this.getEvseTypeTable(tenantId);
    const rows = (await this.db
      .select()
      .from(evseTypes)
      .where(
        and(
          inArray(evseTypes.databaseId, evseTypeDatabaseIds),
          this.tenantFilter(evseTypes, tenantId),
        ),
      )) as EvseTypeEntity[];
    for (const row of rows) {
      byDatabaseId.set(row.databaseId, row);
    }
    return byDatabaseId;
  }
}
