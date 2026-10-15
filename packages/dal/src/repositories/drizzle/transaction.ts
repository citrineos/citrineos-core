// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  MeterValueDto,
  OCPP1_6,
  OCPP2_request_types,
  StopTransactionDto,
  TransactionCreate,
  TransactionDto,
} from '@citrineos/types';
import { ChargingStationSequenceTypeEnum, OCPP2_0_1 } from '@citrineos/types';
import { MeterValueUtils } from '@citrineos/base';
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
import {
  type StartTransactionEntity,
  startTransactionTable,
  tenantStartTransactionTable,
} from '../../db/drizzle/schema/start-transaction.js';
import {
  type ConnectorEntity,
  connectorTable,
  tenantConnectorTable,
} from '../../db/drizzle/schema/connector.js';
import { MeterValueMapper } from '../../mappers/2/meter-value-mapper.js';
import { type ITransactionRepository } from '../repositories.js';
import { DrizzleTransactionEventRepository } from './transaction-event.js';
import { DrizzleMeterValueRepository, toMeterValueDto } from './meter-value.js';
import { toEvseDto } from './evse.js';
import { toTariffDto } from './tariff.js';
import { toStopTransactionDto } from './stop-transaction.js';
import { toStartTransactionDto } from './start-transaction.js';
import { toAuthorizationDto } from './authorization.js';
import { elapsedSecondsSinceStart, transactionInfoForRow } from '../utils.js';
import { DrizzleChargingStationSequenceRepository } from './charging-station-sequence.js';
import type { IChargingStationSequenceRepository } from '../repositories.js';
import {
  DrizzleRepository,
  type DrizzleRepositoryDependencies,
  type DrizzleWriteContext,
} from './base.js';

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
  private readonly chargingStationSequence: IChargingStationSequenceRepository;
  private readonly meterValue: DrizzleMeterValueRepository;
  private readonly transactionEvent: DrizzleTransactionEventRepository;

  constructor(dependencies: DrizzleRepositoryDependencies) {
    super(dependencies);
    this.chargingStationSequence = new DrizzleChargingStationSequenceRepository(dependencies);
    this.meterValue = new DrizzleMeterValueRepository(dependencies);
    this.transactionEvent = new DrizzleTransactionEventRepository(dependencies);
  }

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

  private getStartTransactionTable(tenantId: number): typeof startTransactionTable {
    return this.useTenantSchema ? tenantStartTransactionTable(tenantId) : startTransactionTable;
  }

  private getConnectorTable(tenantId: number): typeof connectorTable {
    return this.useTenantSchema ? tenantConnectorTable(tenantId) : connectorTable;
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

  private async hydrateTransaction(
    tenantId: number,
    row: TransactionEntity,
  ): Promise<TransactionDto> {
    const [eventsByTransaction, meterValuesByTransaction] = await Promise.all([
      this.transactionEvent.readByTransactionDatabaseIds(tenantId, [row.id]),
      this.readMeterValuesByTransactionDatabaseIds(tenantId, [row.id]),
    ]);
    return {
      ...toTransactionDto(row),
      transactionEvents: eventsByTransaction.get(row.id) ?? [],
      meterValues: meterValuesByTransaction.get(row.id) ?? [],
    };
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

  private async readOrCreateEvse(
    ctx: DrizzleWriteContext,
    tenantId: number,
    stationId: number,
    evseTypeId: number,
  ): Promise<EvseEntity> {
    const evses = this.getEvseTable(tenantId);
    const existing = (await ctx.db
      .select()
      .from(evses)
      .where(
        and(
          eq(evses.stationId, stationId),
          eq(evses.evseTypeId, evseTypeId),
          this.tenantFilter(evses, tenantId),
        ),
      )
      .limit(1)) as EvseEntity[];
    if (existing[0]) {
      return existing[0];
    }

    const inserted = (await ctx.db
      .insert(evses)
      .values({ tenantId, stationId, evseTypeId })
      .onConflictDoUpdate({
        target: [evses.stationId, evses.evseTypeId],
        set: { updatedAt: new Date() },
      })
      .returning()) as EvseEntity[];
    return inserted[0];
  }

  private async readOrCreateConnector(
    ctx: DrizzleWriteContext,
    tenantId: number,
    stationId: number,
    evseId: number,
    evseTypeConnectorId: number,
    defaults: { connectorId?: number },
  ): Promise<ConnectorEntity> {
    const connectors = this.getConnectorTable(tenantId);
    const existing = (await ctx.db
      .select()
      .from(connectors)
      .where(
        and(
          eq(connectors.stationId, stationId),
          eq(connectors.evseId, evseId),
          eq(connectors.evseTypeConnectorId, evseTypeConnectorId),
          this.tenantFilter(connectors, tenantId),
        ),
      )
      .limit(1)) as ConnectorEntity[];
    if (existing[0]) {
      return existing[0];
    }

    const inserted = (await ctx.db
      .insert(connectors)
      .values({
        tenantId,
        stationId,
        evseId,
        evseTypeConnectorId,
        connectorId: defaults.connectorId ?? null,
      })
      .onConflictDoUpdate({
        target: [connectors.evseId, connectors.evseTypeConnectorId],
        set: { updatedAt: new Date() },
      })
      .returning()) as ConnectorEntity[];
    return inserted[0];
  }

  private async findTariffIdByTariffId(
    ctx: DrizzleWriteContext,
    tenantId: number,
    tariffId: string,
  ): Promise<number | undefined> {
    const tariffs = this.getTariffTable(tenantId);
    const rows = (await ctx.db
      .select({ id: tariffs.id })
      .from(tariffs)
      .where(and(eq(tariffs.tariffId, tariffId), this.tenantFilter(tariffs, tenantId)))
      .limit(1)) as { id: number }[];
    return rows[0]?.id;
  }

  private async findAuthorizationByIdToken(
    ctx: DrizzleWriteContext,
    tenantId: number,
    idToken: string,
    idTokenType?: string,
  ): Promise<AuthorizationEntity | undefined> {
    const authorizations = this.getAuthorizationTable(tenantId);
    const rows = (await ctx.db
      .select()
      .from(authorizations)
      .where(
        and(
          eq(authorizations.idToken, idToken),
          // 1.6 matches on the token alone; 2.x always reports a type and filters on it.
          idTokenType === undefined ? undefined : eq(authorizations.idTokenType, idTokenType),
          this.tenantFilter(authorizations, tenantId),
        ),
      )
      .limit(1)) as AuthorizationEntity[];
    return rows[0];
  }

  private async readStationLocationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | null | undefined> {
    const stations = this.getChargingStationTable(tenantId);
    const rows = await this.db
      .select({ locationId: stations.locationId })
      .from(stations)
      .where(
        and(
          eq(stations.ocppConnectionName, ocppConnectionName),
          this.tenantFilter(stations, tenantId),
        ),
      )
      .limit(1);
    if (rows.length === 0) {
      return undefined;
    }
    return rows[0].locationId;
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
        await this.meterValue.insertRow(
          tenantId,
          {
            transactionDatabaseId,
            transactionCreatedAt: transaction.createdAt,
            stopTransactionDatabaseId: stopTransaction.id,
            sampledValue: meterValue.sampledValue,
            timestamp: new Date(meterValue.timestamp),
            connectorId: meterValue.connectorId ?? null,
            tariffId: meterValue.tariffId ?? null,
            transactionId: meterValue.transactionId ?? null,
          },
          ctx.db,
        );
      }

      return toStopTransactionDto(stopTransaction);
    });
  }

  async createOrUpdateTransactionByTransactionEventAndStationId(
    tenantId: number,
    value: OCPP2_request_types.TransactionEventRequest,
    ocppConnectionName: string,
  ): Promise<TransactionDto> {
    // In OCPP 2.1, transactionEventRequest contains tariffId
    const { tariffId: infoTariffId, ...transactionInfo } =
      value.transactionInfo as typeof value.transactionInfo & { tariffId?: string | null };
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      throw new Error(
        `Cannot record a transaction event: no charging station named ` +
          `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
      );
    }
    const locationId = await this.readStationLocationId(tenantId, ocppConnectionName);

    const transactions = this.getTable(tenantId);
    const events = this.getTransactionEventTable(tenantId);

    return await this.withAtomicWrite(async (ctx) => {
      const existingRows = (await ctx.db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.stationId, stationId),
            eq(transactions.transactionId, value.transactionInfo.transactionId),
            this.tenantFilter(transactions, tenantId),
          ),
        )
        .limit(2)) as TransactionEntity[];
      const existingTransaction = this.onlyOne(
        existingRows,
        `stationId=${stationId}, transactionId=${value.transactionInfo.transactionId}`,
      );

      const isEnded = value.eventType === OCPP2_0_1.TransactionEventEnumType.Ended;
      let finalTransaction: TransactionEntity;
      let created = false;

      if (existingTransaction) {
        let evseId = existingTransaction.evseId;
        if (!evseId && value.evse) {
          const evse = await this.readOrCreateEvse(ctx, tenantId, stationId, value.evse.id);
          evseId = evse.id;
        }
        let connectorId = existingTransaction.connectorId;
        let tariffId = existingTransaction.tariffId;
        if (!connectorId && value.evse?.connectorId) {
          const evse = await this.readOrCreateEvse(ctx, tenantId, stationId, value.evse.id);
          const connector = await this.readOrCreateConnector(
            ctx,
            tenantId,
            stationId,
            evse.id,
            value.evse.connectorId,
            {},
          );
          connectorId = connector.id;
          tariffId = connector.tariffId;
        }
        if (infoTariffId) {
          const found = await this.findTariffIdByTariffId(ctx, tenantId, infoTariffId);
          if (found !== undefined) {
            tariffId = found;
          }
        }
        let authorizationId = existingTransaction.authorizationId;
        if (!authorizationId && value.idToken) {
          const authorization = await this.findAuthorizationByIdToken(
            ctx,
            tenantId,
            value.idToken.idToken,
            value.idToken.type,
          );
          if (authorization) {
            authorizationId = authorization.id;
          } else {
            this.logger.warn(
              `Authorization with idToken ${value.idToken.idToken} : ${value.idToken.type} does not exist. Transaction ${existingTransaction.transactionId} will not be associated with an authorization.`,
            );
          }
        }

        const updatedRows = (await ctx.db
          .update(transactions)
          .set({
            ...this.toTransactionColumns({
              ...transactionInfoForRow(transactionInfo),
              isActive: !isEnded,
              endTime: isEnded ? value.timestamp : undefined,
            }),
            authorizationId,
            evseId,
            connectorId,
            tariffId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(transactions.id, existingTransaction.id),
              this.tenantFilter(transactions, tenantId),
            ),
          )
          .returning()) as TransactionEntity[];
        finalTransaction = updatedRows[0];
      } else {
        const infoTariff = infoTariffId
          ? await this.findTariffIdByTariffId(ctx, tenantId, infoTariffId)
          : undefined;

        let evseId: number | null = null;
        let connectorId: number | null = null;
        let tariffId: number | null = infoTariff ?? null;
        if (value.evse) {
          const evse = await this.readOrCreateEvse(ctx, tenantId, stationId, value.evse.id);
          evseId = evse.id;
          if (value.evse.connectorId) {
            const connector = await this.readOrCreateConnector(
              ctx,
              tenantId,
              stationId,
              evse.id,
              value.evse.connectorId,
              { connectorId: value.evse.connectorId },
            );
            connectorId = connector.id;
            tariffId = infoTariff ?? connector.tariffId;
          }
        }

        let authorizationId: number | null = null;
        if (value.idToken) {
          const authorization = await this.findAuthorizationByIdToken(
            ctx,
            tenantId,
            value.idToken.idToken,
            value.idToken.type,
          );
          if (authorization) {
            authorizationId = authorization.id;
          } else {
            this.logger.warn(
              `Authorization with idToken ${value.idToken.idToken} : ${value.idToken.type} does not exist. Transaction ${value.transactionInfo.transactionId} will not be associated with an authorization.`,
            );
          }
        }

        if (locationId === undefined) {
          this.logger.error(
            `Charging station with ocppConnectionName ${ocppConnectionName} does not exist.`,
          );
        } else if (locationId === null) {
          this.logger.warn(
            `Charging station with ocppConnectionName ${ocppConnectionName} does not have a locationId. Transaction ${value.transactionInfo.transactionId} will not be associated with a location, which may prevent it from being sent to upstream partners.`,
          );
        }

        const insertedRows = (await ctx.db
          .insert(transactions)
          .values({
            ...this.toTransactionColumns({
              ...transactionInfoForRow(transactionInfo),
              startTime:
                value.eventType === OCPP2_0_1.TransactionEventEnumType.Started
                  ? value.timestamp
                  : undefined,
            }),
            tenantId,
            stationId,
            transactionId: value.transactionInfo.transactionId,
            isActive: !isEnded,
            locationId: locationId ?? null,
            evseId,
            connectorId,
            tariffId,
            authorizationId,
          })
          .returning()) as TransactionEntity[];
        finalTransaction = insertedRows[0];
        created = true;
      }

      const transactionDatabaseId = finalTransaction.id;
      // The MeterValues partition key. Taken from the row written moments ago in this
      // same pg transaction, which no fallback lookup outside it could see.
      const transactionCreatedAt = finalTransaction.createdAt;

      let idTokenValue: string | null = null;
      let idTokenType: string | null = null;
      if (value.idToken && value.idToken.type !== OCPP2_0_1.IdTokenEnumType.NoAuthorization) {
        const authorization = await this.findAuthorizationByIdToken(
          ctx,
          tenantId,
          value.idToken.idToken,
          value.idToken.type,
        );
        if (!authorization) {
          this.logger.warn(
            `Authorization not found for ${value.idToken.idToken}:${value.idToken.type}`,
          );
        } else {
          idTokenValue = authorization.idToken;
          idTokenType = authorization.idTokenType ?? null;
        }
      }

      const eventRows = (await ctx.db
        .insert(events)
        .values({
          tenantId,
          ocppConnectionName,
          transactionDatabaseId,
          transactionCreatedAt,
          eventType: value.eventType,
          timestamp: new Date(value.timestamp),
          triggerReason: value.triggerReason,
          seqNo: value.seqNo,
          offline: value.offline ?? false,
          numberOfPhasesUsed: value.numberOfPhasesUsed ?? null,
          cableMaxCurrent: value.cableMaxCurrent?.toString() ?? null,
          reservationId: value.reservationId ?? null,
          transactionInfo: value.transactionInfo,
          idTokenValue,
          idTokenType,
        })
        .returning()) as TransactionEventEntity[];
      const event = eventRows[0];

      const createdMeterValues: MeterValueDto[] = [];
      if (value.meterValue && value.meterValue.length > 0) {
        const meterValueTypes = value.meterValue.map((meterValue) =>
          MeterValueMapper.fromMeterValueType(meterValue),
        );
        // Sequentially, not Promise.all: one pg transaction cannot interleave statements.
        for (const meterValueType of meterValueTypes) {
          createdMeterValues.push(
            await this.meterValue.insertRow(
              tenantId,
              {
                transactionEventId: event.id,
                transactionDatabaseId,
                transactionCreatedAt,
                transactionId: finalTransaction.transactionId,
                tariffId: finalTransaction.tariffId,
                sampledValue: meterValueType.sampledValue,
                timestamp: new Date(meterValueType.timestamp),
              },
              ctx.db,
            ),
          );
        }

        const meterValueDtos = createdMeterValues;
        const currentTotalKwh =
          finalTransaction.totalKwh != null ? Number(finalTransaction.totalKwh) : 0;
        const existingMeterStart =
          finalTransaction.meterStart != null ? Number(finalTransaction.meterStart) : null;
        const meterStart =
          existingMeterStart === null
            ? MeterValueUtils.getMeterStart(meterValueDtos)
            : existingMeterStart;
        const totalKwh = MeterValueUtils.getTotalKwh(
          meterValueDtos,
          currentTotalKwh,
          meterStart ?? undefined,
        );

        const refreshed = (await ctx.db
          .update(transactions)
          .set({
            totalKwh: totalKwh.toString(),
            ...(existingMeterStart === null ? { meterStart: meterStart?.toString() ?? null } : {}),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(transactions.id, transactionDatabaseId),
              this.tenantFilter(transactions, tenantId),
            ),
          )
          .returning()) as TransactionEntity[];
        finalTransaction = refreshed[0];
      }

      // `this` is the Transactions repository here, where Sequelize's `this` is the
      // TransactionEvents one. Only the transaction-level emit has an emitter to land
      // on; the TransactionEvent and MeterValue emits belong to repositories that do
      // not exist on the Drizzle side yet.
      ctx.events.push({
        name: created ? 'created' : 'updated',
        payload: [toTransactionDto(finalTransaction)],
      });

      return {
        ...toTransactionDto(finalTransaction),
        meterValues: createdMeterValues,
      };
    });
  }

  async createTransactionByStartTransaction(
    tenantId: number,
    request: OCPP1_6.StartTransactionRequest,
    ocppConnectionName: string,
  ): Promise<TransactionDto> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      throw new Error(
        `Cannot start a transaction: no charging station named ` +
          `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
      );
    }
    const locationId = await this.readStationLocationId(tenantId, ocppConnectionName);

    // Allocated outside the write so a rollback does not hand the same id out twice.
    const transactionId = await this.chargingStationSequence.getNextSequenceValue(
      tenantId,
      ocppConnectionName,
      ChargingStationSequenceTypeEnum.transactionId,
    );

    const transactions = this.getTable(tenantId);
    const connectors = this.getConnectorTable(tenantId);
    const startTransactions = this.getStartTransactionTable(tenantId);

    return await this.withAtomicWrite(async (ctx) => {
      const connectorRows = (await ctx.db
        .select()
        .from(connectors)
        .where(
          and(
            eq(connectors.connectorId, request.connectorId),
            eq(connectors.stationId, stationId),
            this.tenantFilter(connectors, tenantId),
          ),
        )
        .limit(2)) as ConnectorEntity[];
      const connector = this.onlyOne(
        connectorRows,
        `connectorId=${request.connectorId}, stationId=${stationId}`,
      );
      if (!connector) {
        this.logger.error(`Unable to find connector ${request.connectorId}.`);
        throw new Error(`Unable to find connector ${request.connectorId}.`);
      }

      const authorization = await this.findAuthorizationByIdToken(ctx, tenantId, request.idTag);
      if (!authorization) {
        this.logger.warn(`Authorization with idToken ${request.idTag} does not exist.`);
      }

      if (locationId === null) {
        this.logger.warn(
          `Charging station with ocppConnectionName ${ocppConnectionName} does not have a locationId. Transaction ${transactionId} will not be associated with a location, which may prevent it from being sent to upstream partners.`,
        );
      }

      const insertedRows = (await ctx.db
        .insert(transactions)
        .values({
          tenantId,
          stationId,
          locationId: locationId ?? null,
          evseId: connector.evseId,
          connectorId: connector.id,
          tariffId: connector.tariffId,
          isActive: true,
          transactionId: transactionId.toString(),
          authorizationId: authorization ? authorization.id : null,
          meterStart: (request.meterStart / 1000).toString(), // Convert Wh to kWh
          startTime: new Date(request.timestamp),
        })
        .returning()) as TransactionEntity[];
      const newTransaction = insertedRows[0];

      const startRows = (await ctx.db
        .insert(startTransactions)
        .values({
          tenantId,
          ocppConnectionName,
          transactionDatabaseId: newTransaction.id,
          transactionCreatedAt: newTransaction.createdAt,
          connectorDatabaseId: connector.id,
          idTokenDatabaseId: authorization ? authorization.id : null,
          meterStart: request.meterStart,
          timestamp: new Date(request.timestamp),
          reservationId: request.reservationId ?? null,
        })
        .returning()) as StartTransactionEntity[];

      ctx.events.push({ name: 'created', payload: [toTransactionDto(newTransaction)] });

      return {
        ...toTransactionDto(newTransaction),
        startTransaction: toStartTransactionDto(startRows[0]),
      };
    });
  }

  async updateTransactionByMeterValues(
    tenantId: number,
    meterValues: MeterValueDto[],
    ocppConnectionName: string,
    transactionId: number,
  ): Promise<void> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      this.logger.error(
        `Transaction ${transactionId} on station ${ocppConnectionName} does not exist.`,
      );
      return;
    }

    const transactions = this.getTable(tenantId);
    const meterValueRows = this.getMeterValueTable(tenantId);

    await this.withAtomicWrite(async (ctx) => {
      const rows = (await ctx.db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.stationId, stationId),
            eq(transactions.transactionId, transactionId.toString()),
            this.tenantFilter(transactions, tenantId),
          ),
        )
        .limit(2)) as TransactionEntity[];
      const row = this.onlyOne(
        rows,
        `stationId=${stationId}, transactionId=${transactionId.toString()}`,
      );
      if (!row) {
        this.logger.error(
          `Transaction ${transactionId} on station ${ocppConnectionName} does not exist.`,
        );
        return;
      }
      const transaction = toTransactionDto(row);

      // Sequentially, not Promise.all: one pg transaction cannot interleave statements.
      for (const meterValue of meterValues) {
        await this.meterValue.insertRow(
          tenantId,
          {
            transactionDatabaseId: row.id,
            transactionCreatedAt: row.createdAt,
            transactionId: row.transactionId,
            tariffId: row.tariffId,
            connectorId: row.connectorId,
            sampledValue: meterValue.sampledValue,
            timestamp: new Date(meterValue.timestamp),
          },
          ctx.db,
        );
      }

      const meterStart =
        transaction.meterStart == null
          ? MeterValueUtils.getMeterStart(meterValues)
          : transaction.meterStart;
      const totalKwh = MeterValueUtils.getTotalKwh(
        meterValues,
        transaction.totalKwh ?? 0,
        meterStart ?? undefined,
      );

      await ctx.db
        .update(transactions)
        .set({
          totalKwh: totalKwh.toString(),
          ...(transaction.meterStart == null ? { meterStart: meterStart?.toString() ?? null } : {}),
          timeSpentCharging: elapsedSecondsSinceStart(transaction.startTime, meterValues),
          updatedAt: new Date(),
        })
        .where(and(eq(transactions.id, row.id), this.tenantFilter(transactions, tenantId)));
    });
  }
}
