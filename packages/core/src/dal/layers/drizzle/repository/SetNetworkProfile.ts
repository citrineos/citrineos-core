// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, SetNetworkProfileDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type SetNetworkProfileEntity,
  setNetworkProfileTable,
  tenantSetNetworkProfileTable,
} from '../schema/SetNetworkProfile.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

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
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof setNetworkProfileTable {
    return this.useTenantSchema ? tenantSetNetworkProfileTable(tenantId) : setNetworkProfileTable;
  }

  protected toDto(row: SetNetworkProfileEntity): SetNetworkProfileDto {
    return toSetNetworkProfileDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
