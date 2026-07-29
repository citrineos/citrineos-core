// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, ChargingStationSecurityInfoDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type ChargingStationSecurityInfoEntity,
  chargingStationSecurityInfoTable,
  tenantChargingStationSecurityInfoTable,
} from '../schema/ChargingStationSecurityInfo.js';
import { type Explicit } from '../types.js';
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
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

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
