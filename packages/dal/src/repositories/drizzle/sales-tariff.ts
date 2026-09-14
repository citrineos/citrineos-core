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
import { DrizzleRepository } from './base.js';

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

  // Domain query/write methods intentionally omitted — stub outline only.
}
