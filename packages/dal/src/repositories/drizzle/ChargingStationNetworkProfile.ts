// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationNetworkProfileDto } from '@citrineos/types';
import {
  type ChargingStationNetworkProfileEntity,
  chargingStationNetworkProfileTable,
  tenantChargingStationNetworkProfileTable,
} from '../../db/drizzle/schema/ChargingStationNetworkProfile.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingStationNetworkProfileDto contract.
// The DTO carries a required nested `setNetworkProfile` relation that cannot be produced
// from a flat DB row, so scalar columns are mapped and returned with a pragmatic cast.
export function toChargingStationNetworkProfileDto(
  entity: ChargingStationNetworkProfileEntity,
): ChargingStationNetworkProfileDto {
  return {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    configurationSlot: entity.configurationSlot ?? 0,
    setNetworkProfileId: entity.setNetworkProfileId ?? 0,
    websocketServerConfigId: entity.websocketServerConfigId ?? undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    // TODO: map relations (setNetworkProfile, websocketServerConfig)
  } as ChargingStationNetworkProfileDto;
}

export class DrizzleChargingStationNetworkProfileRepository extends DrizzleRepository<
  typeof chargingStationNetworkProfileTable,
  ChargingStationNetworkProfileDto
> {
  protected getTable(tenantId: number): typeof chargingStationNetworkProfileTable {
    return this.useTenantSchema
      ? tenantChargingStationNetworkProfileTable(tenantId)
      : chargingStationNetworkProfileTable;
  }

  protected toDto(row: ChargingStationNetworkProfileEntity): ChargingStationNetworkProfileDto {
    return toChargingStationNetworkProfileDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
