// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffDto } from '@citrineos/types';
import {
  type TariffEntity,
  tariffTable,
  tenantTariffTable,
} from '../../db/drizzle/schema/tariff.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// Coerces a nullable numeric (drizzle returns DECIMAL as string) to a number|null.
function toNumberOrNull(value: string | null): number | null {
  return value != null ? Number(value) : null;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external TariffDto contract.
export function toTariffDto(entity: TariffEntity): TariffDto {
  const dto: Explicit<TariffDto> = {
    id: entity.id,
    currency: entity.currency,
    // DECIMAL columns are returned as strings by drizzle numeric().
    pricePerKwh: Number(entity.pricePerKwh),
    pricePerMin: toNumberOrNull(entity.pricePerMin),
    pricePerSession: toNumberOrNull(entity.pricePerSession),
    authorizationAmount: toNumberOrNull(entity.authorizationAmount),
    paymentFee: toNumberOrNull(entity.paymentFee),
    taxRate: toNumberOrNull(entity.taxRate),
    tariffAltText: (entity.tariffAltText as Record<string, any> | null) ?? null,
    tariffId: entity.tariffId ?? null,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    validFrom: entity.validFrom ? entity.validFrom.toISOString() : null,
    description: (entity.description as any[] | null) ?? null,
    energy: entity.energy ?? null,
    chargingTime: entity.chargingTime ?? null,
    idleTime: entity.idleTime ?? null,
    fixedFee: entity.fixedFee ?? null,
    reservationTime: entity.reservationTime ?? null,
    reservationFixed: entity.reservationFixed ?? null,
    minCost: entity.minCost ?? null,
    maxCost: entity.maxCost ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleTariffRepository extends DrizzleRepository<typeof tariffTable, TariffDto> {
  protected getTable(tenantId: number): typeof tariffTable {
    return this.useTenantSchema ? tenantTariffTable(tenantId) : tariffTable;
  }

  protected toDto(row: TariffEntity): TariffDto {
    return toTariffDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
