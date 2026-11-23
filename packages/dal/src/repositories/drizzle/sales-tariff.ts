// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SalesTariffDto } from '@citrineos/types';
import {
  type SalesTariffEntity,
  salesTariffTable,
  tenantSalesTariffTable,
} from '../../db/drizzle/schema/sales-tariff.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { and, inArray } from 'drizzle-orm';
import type { SalesTariffInput } from '../../mappers/2.0.1/charging-profile-mapper.js';
import { DrizzleRepository, type DrizzleWriteContext } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external SalesTariffDto contract.
export function toSalesTariffDto(entity: SalesTariffEntity): SalesTariffDto {
  const dto: Explicit<SalesTariffDto> = {
    databaseId: entity.databaseId,
    id: entity.id!,
    numEPriceLevels: entity.numEPriceLevels,
    salesTariffDescription: entity.salesTariffDescription,
    salesTariffEntry: entity.salesTariffEntry!,
    chargingScheduleDatabaseId: entity.chargingScheduleDatabaseId!,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleSalesTariffRepository extends DrizzleRepository<
  typeof salesTariffTable,
  SalesTariffDto
> {
  protected getTable(tenantId: number): typeof salesTariffTable {
    return this.useTenantSchema ? tenantSalesTariffTable(tenantId) : salesTariffTable;
  }

  protected toDto(row: SalesTariffEntity): SalesTariffDto {
    return toSalesTariffDto(row);
  }

  async createForSchedule(
    tenantId: number,
    chargingScheduleDatabaseId: number,
    input: SalesTariffInput,
    ctx?: DrizzleWriteContext,
  ): Promise<SalesTariffDto> {
    return await this.insert(
      tenantId,
      {
        id: input.id,
        salesTariffDescription: input.salesTariffDescription ?? null,
        numEPriceLevels: input.numEPriceLevels ?? null,
        salesTariffEntry: input.salesTariffEntry,
        chargingScheduleDatabaseId,
      },
      ctx,
    );
  }

  async deleteByChargingScheduleDatabaseIds(
    tenantId: number,
    chargingScheduleDatabaseIds: number[],
    ctx?: DrizzleWriteContext,
  ): Promise<number> {
    if (chargingScheduleDatabaseIds.length === 0) {
      return 0;
    }
    const salesTariffs = this.getTable(tenantId);
    const rows = (await (ctx?.db ?? this.db)
      .delete(salesTariffs)
      .where(
        and(
          inArray(salesTariffs.chargingScheduleDatabaseId, chargingScheduleDatabaseIds),
          this.tenantFilter(salesTariffs, tenantId),
        ),
      )
      .returning()) as SalesTariffEntity[];
    for (const row of rows) {
      this.raise(ctx, 'deleted', [toSalesTariffDto(row)]);
    }
    return rows.length;
  }
}
