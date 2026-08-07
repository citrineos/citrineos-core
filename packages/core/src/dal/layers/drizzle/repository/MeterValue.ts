// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { MeterValueDto, SampledValue } from '@citrineos/types';
import {
  type MeterValueEntity,
  meterValueTable,
  tenantMeterValueTable,
} from '../schema/MeterValue.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external MeterValueDto contract.
export function toMeterValueDto(entity: MeterValueEntity): MeterValueDto {
  const dto: Explicit<MeterValueDto> = {
    id: entity.id,
    transactionEventId: entity.transactionEventId ?? null,
    transactionDatabaseId: entity.transactionDatabaseId ?? null,
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

export class DrizzleMeterValueRepository extends DrizzleRepository<
  typeof meterValueTable,
  MeterValueDto
> {
  protected getTable(tenantId: number): typeof meterValueTable {
    return this.useTenantSchema ? tenantMeterValueTable(tenantId) : meterValueTable;
  }

  protected toDto(row: MeterValueEntity): MeterValueDto {
    return toMeterValueDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
