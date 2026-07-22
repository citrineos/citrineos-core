// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, ChargingStationSequenceDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type ChargingStationSequenceEntity,
  chargingStationSequenceTable,
  tenantChargingStationSequenceTable,
} from '../schema/ChargingStationSequence.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ChargingStationSequenceDto contract.
export function toChargingStationSequenceDto(
  entity: ChargingStationSequenceEntity,
): ChargingStationSequenceDto {
  const dto: Explicit<ChargingStationSequenceDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    type: entity.type as ChargingStationSequenceDto['type'],
    value: entity.value,
    station: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleChargingStationSequenceRepository extends DrizzleRepository<
  typeof chargingStationSequenceTable,
  ChargingStationSequenceDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof chargingStationSequenceTable {
    return this.useTenantSchema
      ? tenantChargingStationSequenceTable(tenantId)
      : chargingStationSequenceTable;
  }

  protected toDto(row: ChargingStationSequenceEntity): ChargingStationSequenceDto {
    return toChargingStationSequenceDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
