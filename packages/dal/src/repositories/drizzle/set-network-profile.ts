// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SetNetworkProfileDto } from '@citrineos/types';
import {
  type SetNetworkProfileEntity,
  setNetworkProfileTable,
  tenantSetNetworkProfileTable,
} from '../../db/drizzle/schema/set-network-profile.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external SetNetworkProfileDto contract.
export function toSetNetworkProfileDto(entity: SetNetworkProfileEntity): SetNetworkProfileDto {
  const dto: Explicit<SetNetworkProfileDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    correlationId: entity.correlationId ?? '',
    websocketServerConfigId: entity.websocketServerConfigId ?? undefined,
    // Relation is not present on a flat DB row.
    websocketServerConfig: undefined,
    configurationSlot: entity.configurationSlot ?? 0,
    // Enums stored as strings in the DB — cast back to the DTO's enum unions.
    ocppVersion: entity.ocppVersion as SetNetworkProfileDto['ocppVersion'],
    ocppTransport: entity.ocppTransport as SetNetworkProfileDto['ocppTransport'],
    ocppCsmsUrl: entity.ocppCsmsUrl ?? '',
    messageTimeout: entity.messageTimeout ?? 0,
    securityProfile: entity.securityProfile ?? 0,
    ocppInterface: entity.ocppInterface as SetNetworkProfileDto['ocppInterface'],
    apn: entity.apn ?? undefined,
    vpn: entity.vpn ?? undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleSetNetworkProfileRepository extends DrizzleRepository<
  typeof setNetworkProfileTable,
  SetNetworkProfileDto
> {
  protected getTable(tenantId: number): typeof setNetworkProfileTable {
    return this.useTenantSchema ? tenantSetNetworkProfileTable(tenantId) : setNetworkProfileTable;
  }

  protected toDto(row: SetNetworkProfileEntity): SetNetworkProfileDto {
    return toSetNetworkProfileDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
