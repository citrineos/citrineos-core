// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationSecurityInfoDto } from '@citrineos/types';
import {
  type ChargingStationSecurityInfoEntity,
  chargingStationSecurityInfoTable,
  tenantChargingStationSecurityInfoTable,
} from '../../db/drizzle/schema/ChargingStationSecurityInfo.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingStationSecurityInfoDto contract.
export function toChargingStationSecurityInfoDto(
  entity: ChargingStationSecurityInfoEntity,
): ChargingStationSecurityInfoDto {
  const dto: Explicit<ChargingStationSecurityInfoDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    publicKeyFileId: entity.publicKeyFileId ?? '',
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChargingStationSecurityInfoRepository extends DrizzleRepository<
  typeof chargingStationSecurityInfoTable,
  ChargingStationSecurityInfoDto
> {
  protected getTable(tenantId: number): typeof chargingStationSecurityInfoTable {
    return this.useTenantSchema
      ? tenantChargingStationSecurityInfoTable(tenantId)
      : chargingStationSecurityInfoTable;
  }

  protected toDto(row: ChargingStationSecurityInfoEntity): ChargingStationSecurityInfoDto {
    return toChargingStationSecurityInfoDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
