// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  MeterValueDto,
  OCPP2_common_types,
  StopTransactionDto,
  TransactionCreate,
  TransactionDto,
  TransactionEventDto,
} from '@citrineos/types';
import { and, desc, eq, inArray, isNotNull, ne } from 'drizzle-orm';
import {
  tenantTransactionTable,
  type TransactionEntity,
  transactionTable,
} from '../../db/drizzle/schema/transaction.js';
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
import { type EvseEntity, evseTable, tenantEvseTable } from '../../db/drizzle/schema/evse.js';
import {
  type TariffEntity,
  tariffTable,
  tenantTariffTable,
} from '../../db/drizzle/schema/tariff.js';
import {
  type AuthorizationEntity,
  authorizationTable,
  tenantAuthorizationTable,
} from '../../db/drizzle/schema/authorization.js';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  type StopTransactionEntity,
  stopTransactionTable,
  tenantStopTransactionTable,
} from '../../db/drizzle/schema/stop-transaction.js';
import { MeterValueMapper } from '../../mappers/2/meter-value-mapper.js';
import { type ITransactionRepository } from '../repositories.js';
import { DrizzleRepository } from './base.js';
import { toTransactionEventDto } from './transaction-event.js';
import { toMeterValueDto } from './meter-value.js';
import { toEvseTypeDto } from './evse-type.js';
import { toEvseDto } from './evse.js';
import { toTariffDto } from './tariff.js';
import { toStopTransactionDto } from './stop-transaction.js';
import { toAuthorizationDto } from './authorization.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Scalar columns only; every relation on TransactionDto is optional and a flat row
// carries none of them. DECIMAL columns arrive as strings and are converted here.
// TODO: map relations (station, location, evse, connector, authorization, tariff,
// transactionEvents, meterValues, startTransaction, stopTransaction).
export function toTransactionDto(entity: TransactionEntity): TransactionDto {
  return {
    id: entity.id,
    transactionId: entity.transactionId,
    stationId: entity.stationId,
    isActive: entity.isActive,
    locationId: entity.locationId ?? undefined,
    evseId: entity.evseId ?? undefined,
    connectorId: entity.connectorId ?? undefined,
    authorizationId: entity.authorizationId ?? undefined,
    tariffId: entity.tariffId ?? undefined,
    chargingState: entity.chargingState ?? null,
    timeSpentCharging: entity.timeSpentCharging ?? null,
    transactionLimit: entity.transactionLimit ?? null,
    meterStart: entity.meterStart != null ? Number(entity.meterStart) : null,
    totalKwh: entity.totalKwh != null ? Number(entity.totalKwh) : null,
    stoppedReason: entity.stoppedReason ?? null,
    remoteStartId: entity.remoteStartId ?? null,
    totalCost: entity.totalCost != null ? Number(entity.totalCost) : undefined,
    // Drizzle returns timestamps as JS Date (mode: 'date'); DTO contract is ISO string.
    startTime: entity.startTime?.toISOString(),
    endTime: entity.endTime?.toISOString(),
    customData: entity.customData ?? null,
    tenantId: entity.tenantId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

export class DrizzleTransactionRepository
  extends DrizzleRepository<typeof transactionTable, TransactionDto>
  implements ITransactionRepository
{
  protected getTable(tenantId: number): typeof transactionTable {
    return this.useTenantSchema ? tenantTransactionTable(tenantId) : transactionTable;
  }

  protected toDto(row: TransactionEntity): TransactionDto {
    return toTransactionDto(row);
  }

  private getTransactionEventTable(tenantId: number): typeof transactionEventTable {
    return this.useTenantSchema ? tenantTransactionEventTable(tenantId) : transactionEventTable;
  }

  private getMeterValueTable(tenantId: number): typeof meterValueTable {
    return this.useTenantSchema ? tenantMeterValueTable(tenantId) : meterValueTable;
  }

  private getEvseTypeTable(tenantId: number): typeof evseTypeTable {
    return this.useTenantSchema ? tenantEvseTypeTable(tenantId) : evseTypeTable;
  }

  private getEvseTable(tenantId: number): typeof evseTable {
    return this.useTenantSchema ? tenantEvseTable(tenantId) : evseTable;
  }

  private getTariffTable(tenantId: number): typeof tariffTable {
    return this.useTenantSchema ? tenantTariffTable(tenantId) : tariffTable;
  }

  private getAuthorizationTable(tenantId: number): typeof authorizationTable {
    return this.useTenantSchema ? tenantAuthorizationTable(tenantId) : authorizationTable;
  }

  private getStopTransactionTable(tenantId: number): typeof stopTransactionTable {
    return this.useTenantSchema ? tenantStopTransactionTable(tenantId) : stopTransactionTable;
  }

  private getChargingStationTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  private async resolveStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | undefined> {
    const stations = this.getChargingStationTable(tenantId);
    const rows = await this.db
      .select({ id: stations.id })
      .from(stations)
      .where(
        and(
          eq(stations.ocppConnectionName, ocppConnectionName),
          this.tenantFilter(stations, tenantId),
        ),
      )
      .limit(1);
    return rows[0]?.id;
  }

  // Matches CrudRepository.readOnlyOneByQuery.
  private onlyOne<T>(rows: T[], query: string): T | undefined {
    if (rows.length > 1) {
      throw new Error(`More than one value found for query: ${query}`);
    }
    return rows[0];
  }

  private async readMeterValuesByTransactionDatabaseIds(
    tenantId: number,
    transactionDatabaseIds: number[],
  ): Promise<Map<number, MeterValueDto[]>> {
    const byTransaction = new Map<number, MeterValueDto[]>();
    if (transactionDatabaseIds.length === 0) {
      return byTransaction;
    }
    const meterValues = this.getMeterValueTable(tenantId);
    const rows = (await this.db
      .select()
      .from(meterValues)
      .where(
        and(
          inArray(meterValues.transactionDatabaseId, transactionDatabaseIds),
          this.tenantFilter(meterValues, tenantId),
        ),
      )) as MeterValueEntity[];

    for (const row of rows) {
      if (row.transactionDatabaseId == null) continue;
      const bucket = byTransaction.get(row.transactionDatabaseId) ?? [];
      bucket.push(toMeterValueDto(row));
      byTransaction.set(row.transactionDatabaseId, bucket);
    }
    return byTransaction;
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

  private async readTransactionEventsByTransactionDatabaseIds(
    tenantId: number,
    transactionDatabaseIds: number[],
  ): Promise<Map<number, TransactionEventDto[]>> {
    const byTransaction = new Map<number, TransactionEventDto[]>();
    if (transactionDatabaseIds.length === 0) {
      return byTransaction;
    }
    const events = this.getTransactionEventTable(tenantId);
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

  private async hydrateTransaction(
    tenantId: number,
    row: TransactionEntity,
  ): Promise<TransactionDto> {
    const [eventsByTransaction, meterValuesByTransaction] = await Promise.all([
      this.readTransactionEventsByTransactionDatabaseIds(tenantId, [row.id]),
      this.readMeterValuesByTransactionDatabaseIds(tenantId, [row.id]),
    ]);
    return {
      ...toTransactionDto(row),
      transactionEvents: eventsByTransaction.get(row.id) ?? [],
      meterValues: meterValuesByTransaction.get(row.id) ?? [],
    };
  }

  // MeterValues is partitioned on (id, transactionCreatedAt),
  // Since Drizzle has no hooks as in Sequelize, the same fallback
  // chain runs here or the row lands in the wrong partition.
  private async resolveMeterValuePartitionKey(
    tenantId: number,
    transactionCreatedAt: Date | undefined,
    transactionDatabaseId: number | null | undefined,
  ): Promise<Date> {
    if (transactionCreatedAt != null) {
      return transactionCreatedAt;
    }
    if (transactionDatabaseId != null) {
      const transactions = this.getTable(tenantId);
      const rows = await this.db
        .select({ createdAt: transactions.createdAt })
        .from(transactions)
        .where(
          and(
            eq(transactions.id, transactionDatabaseId),
            this.tenantFilter(transactions, tenantId),
          ),
        )
        .limit(1);
      if (rows[0]?.createdAt) {
        return rows[0].createdAt;
      }
    }
    return new Date();
  }

  private toTransactionColumns(values: Partial<TransactionCreate>): Record<string, unknown> {
    const columns: Record<string, unknown> = {};
    const assign = (key: string, value: unknown) => {
      if (value !== undefined) columns[key] = value;
    };
    assign('stationId', values.stationId);
    assign('evseId', values.evseId);
    assign('connectorId', values.connectorId);
    assign('authorizationId', values.authorizationId);
    assign('tariffId', values.tariffId);
    assign('locationId', values.locationId);
    assign('isActive', values.isActive);
    assign('chargingState', values.chargingState);
    assign('timeSpentCharging', values.timeSpentCharging);
    assign('transactionLimit', values.transactionLimit);
    assign('stoppedReason', values.stoppedReason);
    assign('remoteStartId', values.remoteStartId);
    assign('customData', values.customData);
    // DECIMAL columns are written as strings by node-postgres.
    assign('meterStart', values.meterStart?.toString());
    assign('totalKwh', values.totalKwh?.toString());
    assign('totalCost', values.totalCost?.toString());
    assign('startTime', values.startTime === undefined ? undefined : new Date(values.startTime));
    assign('endTime', values.endTime === undefined ? undefined : new Date(values.endTime));
    return columns;
  }

  // ─── ITransactionRepository reads ───────────────────────────────────

  async readTransactionByStationIdAndTransactionId(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<TransactionDto | undefined> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return undefined;
    }
    const transactions = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.transactionId, transactionId),
          this.tenantFilter(transactions, tenantId),
        ),
      )
      .limit(2)) as TransactionEntity[];

    const row = this.onlyOne(rows, `stationId=${stationId}, transactionId=${transactionId}`);
    return row ? toTransactionDto(row) : undefined;
  }

  async readAllActiveTransactionsByAuthorizationId(
    tenantId: number,
    authorizationId: number,
  ): Promise<TransactionDto[]> {
    const transactions = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.isActive, true),
          eq(transactions.authorizationId, authorizationId),
          this.tenantFilter(transactions, tenantId),
        ),
      )) as TransactionEntity[];
    return rows.map(toTransactionDto);
  }

  async getActiveTransactionByStationIdAndEvseId(
    tenantId: number,
    ocppConnectionName: string,
    evseId: number,
  ): Promise<TransactionDto | undefined> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return undefined;
    }
    const transactions = this.getTable(tenantId);
    const evses = this.getEvseTable(tenantId);

    // evseId is the EVSE as OCPP numbers it, so it matches Evses.evseTypeId rather than
    // the Evses primary key the transaction stores.
    const rows = (await this.db
      .select({ transaction: transactions })
      .from(transactions)
      .innerJoin(
        evses,
        and(
          eq(transactions.evseId, evses.id),
          eq(evses.evseTypeId, evseId),
          this.tenantFilter(evses, tenantId),
        ),
      )
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.isActive, true),
          this.tenantFilter(transactions, tenantId),
        ),
      )
      .orderBy(desc(transactions.updatedAt))
      .limit(1)) as { transaction: TransactionEntity }[];

    const row = rows[0]?.transaction;
    return row ? await this.hydrateTransaction(tenantId, row) : undefined;
  }

  async readActiveTransactionsWithTariffAndEvseByStationId(
    tenantId: number,
    ocppConnectionName: string,
    evseTypeId?: number,
  ): Promise<TransactionDto[]> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return [];
    }
    const transactions = this.getTable(tenantId);
    const authorizations = this.getAuthorizationTable(tenantId);
    const tariffs = this.getTariffTable(tenantId);
    const evses = this.getEvseTable(tenantId);

    // The tariff hangs off the Authorization, not off the transaction's own tariffId.
    const rows = (await this.db
      .select({
        transaction: transactions,
        authorization: authorizations,
        tariff: tariffs,
        evse: evses,
      })
      .from(transactions)
      .innerJoin(
        authorizations,
        and(
          eq(transactions.authorizationId, authorizations.id),
          isNotNull(authorizations.tariffId),
          this.tenantFilter(authorizations, tenantId),
        ),
      )
      .innerJoin(
        tariffs,
        and(eq(authorizations.tariffId, tariffs.id), this.tenantFilter(tariffs, tenantId)),
      )
      .innerJoin(
        evses,
        and(
          eq(transactions.evseId, evses.id),
          evseTypeId !== undefined ? eq(evses.evseTypeId, evseTypeId) : undefined,
          this.tenantFilter(evses, tenantId),
        ),
      )
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.isActive, true),
          isNotNull(transactions.authorizationId),
          this.tenantFilter(transactions, tenantId),
        ),
      )) as {
      transaction: TransactionEntity;
      authorization: AuthorizationEntity;
      tariff: TariffEntity;
      evse: EvseEntity;
    }[];

    return rows.map((row) => ({
      ...toTransactionDto(row.transaction),
      authorization: { ...toAuthorizationDto(row.authorization), tariff: toTariffDto(row.tariff) },
      evse: toEvseDto(row.evse),
    }));
  }

  // Deliberately not scoped to a station: the caller has only the transactionId.
  async findByTransactionId(
    tenantId: number,
    transactionId: string,
  ): Promise<TransactionDto | undefined> {
    const transactions = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.transactionId, transactionId),
          this.tenantFilter(transactions, tenantId),
        ),
      )
      .limit(2)) as TransactionEntity[];

    const row = this.onlyOne(rows, `transactionId=${transactionId}`);
    return row ? await this.hydrateTransaction(tenantId, row) : undefined;
  }

  async readAllByStationIdAndTransactionId(
    tenantId: number,
    ocppConnectionName: string,
    transactionId: string,
  ): Promise<TransactionEventDto[]> {
    const events = this.getTransactionEventTable(tenantId);
    const transactions = this.getTable(tenantId);

    // The transaction is joined only to filter by its business id; the Sequelize
    // implementation drops it from the result for the same reason.
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

  // ─── ITransactionRepository writes ───────────────────────────────────

  async updateTransactionTotalCostById(
    tenantId: number,
    totalCost: number,
    id: number,
  ): Promise<void> {
    const transactions = this.getTable(tenantId);
    await this.db
      .update(transactions)
      .set({ totalCost: totalCost.toString(), updatedAt: new Date() })
      .where(and(eq(transactions.id, id), this.tenantFilter(transactions, tenantId)));
  }

  async updateTransactionByStationIdAndTransactionId(
    tenantId: number,
    transaction: Partial<TransactionCreate>,
    transactionId: string,
    ocppConnectionName: string,
  ): Promise<TransactionDto | undefined> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return undefined;
    }
    const transactions = this.getTable(tenantId);
    const rows = (await this.db
      .update(transactions)
      .set({ ...this.toTransactionColumns(transaction), updatedAt: new Date() })
      .where(
        and(
          eq(transactions.transactionId, transactionId),
          eq(transactions.stationId, stationId),
          this.tenantFilter(transactions, tenantId),
        ),
      )
      .returning()) as TransactionEntity[];

    return rows[0] ? toTransactionDto(rows[0]) : undefined;
  }

  async deactivateActiveTransactionsByStationIdAndEvseId(
    tenantId: number,
    ocppConnectionName: string,
    evseId: number,
    excludeTransactionId: string,
  ): Promise<TransactionDto[]> {
    if (!excludeTransactionId || excludeTransactionId === '0') {
      return [];
    }
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      return [];
    }
    const transactions = this.getTable(tenantId);
    const rows = (await this.db
      .update(transactions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.evseId, evseId),
          eq(transactions.isActive, true),
          ne(transactions.transactionId, excludeTransactionId),
          this.tenantFilter(transactions, tenantId),
        ),
      )
      .returning()) as TransactionEntity[];

    return rows.map(toTransactionDto);
  }

  async createMeterValue(
    tenantId: number,
    meterValue: OCPP2_common_types.MeterValueType,
    transactionDatabaseId?: number | null,
    transactionId?: string | null,
    tariffId?: number | null,
    transactionCreatedAt?: Date,
  ): Promise<MeterValueDto> {
    const meterValues = this.getMeterValueTable(tenantId);
    const mapped = MeterValueMapper.fromMeterValueType(meterValue);
    const partitionKey = await this.resolveMeterValuePartitionKey(
      tenantId,
      transactionCreatedAt,
      transactionDatabaseId,
    );
    const rows = (await this.db
      .insert(meterValues)
      .values({
        tenantId,
        transactionDatabaseId: transactionDatabaseId ?? null,
        transactionCreatedAt: partitionKey,
        transactionId: transactionId ?? null,
        tariffId: tariffId ?? null,
        sampledValue: mapped.sampledValue,
        timestamp: new Date(mapped.timestamp),
      })
      .returning()) as MeterValueEntity[];

    return toMeterValueDto(rows[0]);
  }

  async createStopTransaction(
    tenantId: number,
    transactionDatabaseId: number,
    ocppConnectionName: string,
    meterStop: number,
    timestamp: Date,
    meterValues: MeterValueDto[],
    reason?: string,
  ): Promise<StopTransactionDto> {
    const transactions = this.getTable(tenantId);
    const stopTransactions = this.getStopTransactionTable(tenantId);
    const meterValueRows = this.getMeterValueTable(tenantId);

    return await this.withAtomicWrite(async (ctx) => {
      const existing = (await ctx.db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.id, transactionDatabaseId),
            this.tenantFilter(transactions, tenantId),
          ),
        )
        .limit(1)) as TransactionEntity[];

      const transaction = existing[0];
      if (!transaction) {
        this.logger.error(`Transaction with id ${transactionDatabaseId} not found.`);
        throw new Error(`Transaction with id ${transactionDatabaseId} not found.`);
      }

      const stopRows = (await ctx.db
        .insert(stopTransactions)
        .values({
          tenantId,
          ocppConnectionName,
          transactionDatabaseId,
          transactionCreatedAt: transaction.createdAt,
          meterStop,
          timestamp,
          reason: reason ?? null,
        })
        .returning()) as StopTransactionEntity[];
      const stopTransaction = stopRows[0];

      await ctx.db
        .update(transactions)
        .set({ endTime: timestamp, isActive: false, updatedAt: new Date() })
        .where(
          and(
            eq(transactions.id, transactionDatabaseId),
            this.tenantFilter(transactions, tenantId),
          ),
        );

      // Sequentially, not Promise.all: one pg transaction cannot interleave statements.
      for (const meterValue of meterValues) {
        await ctx.db.insert(meterValueRows).values({
          tenantId,
          transactionDatabaseId,
          transactionCreatedAt: transaction.createdAt,
          stopTransactionDatabaseId: stopTransaction.id,
          sampledValue: meterValue.sampledValue,
          timestamp: new Date(meterValue.timestamp),
          connectorId: meterValue.connectorId ?? null,
          tariffId: meterValue.tariffId ?? null,
          transactionId: meterValue.transactionId ?? null,
        });
      }

      return toStopTransactionDto(stopTransaction);
    });
  }
}
