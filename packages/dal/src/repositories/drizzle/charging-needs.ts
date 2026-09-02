// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingNeedsDto, EnergyTransferModeEnumType } from '@citrineos/types';
import {
  type ChargingNeedsEntity,
  chargingNeedsTable,
  tenantChargingNeedsTable,
} from '../../db/drizzle/schema/charging-needs.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingNeedsDto contract.
export function toChargingNeedsDto(entity: ChargingNeedsEntity): ChargingNeedsDto {
  const dto: Explicit<ChargingNeedsDto> = {
    id: entity.id,
    acChargingParameters: entity.acChargingParameters,
    dcChargingParameters: entity.dcChargingParameters,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    departureTime: entity.departureTime ? entity.departureTime.toISOString() : null,
    requestedEnergyTransfer: entity.requestedEnergyTransfer as EnergyTransferModeEnumType,
    maxScheduleTuples: entity.maxScheduleTuples,
    evseId: entity.evseId!,
    transactionDatabaseId: entity.transactionDatabaseId!,
    transactionCreatedAt: entity.transactionCreatedAt,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChargingNeedsRepository extends DrizzleRepository<
  typeof chargingNeedsTable,
  ChargingNeedsDto
> {
  protected getTable(tenantId: number): typeof chargingNeedsTable {
    return this.useTenantSchema ? tenantChargingNeedsTable(tenantId) : chargingNeedsTable;
  }

  protected toDto(row: ChargingNeedsEntity): ChargingNeedsDto {
    return toChargingNeedsDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
