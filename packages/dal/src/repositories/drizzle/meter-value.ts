// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { MeterValueDto, OCPP2_common_types, SampledValue } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type MeterValueEntity,
  type MeterValueEntityInsert,
  meterValueTable,
  tenantMeterValueTable,
} from '../../db/drizzle/schema/meter-value.js';
import { tenantTransactionTable, transactionTable } from '../../db/drizzle/schema/transaction.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { MeterValueMapper } from '../../mappers/2/meter-value-mapper.js';
import type { IMeterValueRepository } from '../repositories.js';
import { DrizzleRepository, type DrizzleExecutor } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external MeterValueDto contract.
export function toMeterValueDto(entity: MeterValueEntity): MeterValueDto {
  const dto: Explicit<MeterValueDto> = {
    id: entity.id,
    transactionEventId: entity.transactionEventId ?? null,
    transactionDatabaseId: entity.transactionDatabaseId ?? null,
    transactionCreatedAt: entity.transactionCreatedAt,
    sampledValue: entity.sampledValue as [SampledValue, ...SampledValue[]],
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp.toISOString(),
    connectorId: entity.connectorId ?? undefined,
    tariffId: entity.tariffId ?? null,
    transactionId: entity.transactionId ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleMeterValueRepository
  extends DrizzleRepository<typeof meterValueTable, MeterValueDto>
  implements IMeterValueRepository
{
  protected getTable(tenantId: number): typeof meterValueTable {
    return this.useTenantSchema ? tenantMeterValueTable(tenantId) : meterValueTable;
  }

  protected toDto(row: MeterValueEntity): MeterValueDto {
    return toMeterValueDto(row);
  }

  private getTransactionTable(tenantId: number): typeof transactionTable {
    return this.useTenantSchema ? tenantTransactionTable(tenantId) : transactionTable;
  }

  private async resolveMeterValuePartitionKey(
    tenantId: number,
    transactionCreatedAt: Date | undefined,
    transactionDatabaseId: number | null | undefined,
  ): Promise<Date> {
    if (transactionCreatedAt != null) {
      return transactionCreatedAt;
    }
    if (transactionDatabaseId != null) {
      const transactions = this.getTransactionTable(tenantId);
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

  async insertRow(
    tenantId: number,
    values: Omit<MeterValueEntityInsert, 'tenantId'>,
    db: DrizzleExecutor = this.db,
  ): Promise<MeterValueDto> {
    const meterValues = this.getTable(tenantId);
    const rows = (await db
      .insert(meterValues)
      .values({ ...values, tenantId })
      .returning()) as MeterValueEntity[];
    return toMeterValueDto(rows[0]);
  }

  async createMeterValue(
    tenantId: number,
    meterValue: OCPP2_common_types.MeterValueType,
    transactionDatabaseId?: number | null,
    transactionId?: string | null,
    tariffId?: number | null,
    transactionCreatedAt?: Date,
  ): Promise<MeterValueDto> {
    const mapped = MeterValueMapper.fromMeterValueType(meterValue);
    const partitionKey = await this.resolveMeterValuePartitionKey(
      tenantId,
      transactionCreatedAt,
      transactionDatabaseId,
    );
    return await this.insertRow(tenantId, {
      transactionDatabaseId: transactionDatabaseId ?? null,
      transactionCreatedAt: partitionKey,
      transactionId: transactionId ?? null,
      tariffId: tariffId ?? null,
      sampledValue: mapped.sampledValue,
      timestamp: new Date(mapped.timestamp),
    });
  }
}
