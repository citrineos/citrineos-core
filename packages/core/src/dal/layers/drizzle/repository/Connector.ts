// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, ConnectorDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { type ConnectorEntity, connectorTable, tenantConnectorTable } from '../schema/Connector.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ConnectorDto contract.
export function toConnectorDto(entity: ConnectorEntity): ConnectorDto {
  const dto: Explicit<ConnectorDto> = {
    id: entity.id,
    stationId: entity.stationId,
    ocppConnectionName: entity.ocppConnectionName,
    evseId: entity.evseId,
    connectorId: entity.connectorId,
    evseTypeConnectorId: entity.evseTypeConnectorId,
    // Enums stored as strings in the DB — cast back to the DTO's enum unions.
    status: entity.status as ConnectorDto['status'],
    type: entity.type as ConnectorDto['type'],
    format: entity.format as ConnectorDto['format'],
    errorCode: entity.errorCode as ConnectorDto['errorCode'],
    powerType: entity.powerType as ConnectorDto['powerType'],
    maximumAmperage: entity.maximumAmperage,
    maximumVoltage: entity.maximumVoltage,
    maximumPowerWatts: entity.maximumPowerWatts,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp ? entity.timestamp.toISOString() : '',
    info: entity.info,
    vendorId: entity.vendorId,
    vendorErrorCode: entity.vendorErrorCode,
    termsAndConditionsUrl: entity.termsAndConditionsUrl,
    // Relations are not present on a flat DB row.
    tariff: undefined,
    evse: undefined,
    chargingStation: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleConnectorRepository extends DrizzleRepository<
  typeof connectorTable,
  ConnectorDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof connectorTable {
    return this.useTenantSchema ? tenantConnectorTable(tenantId) : connectorTable;
  }

  protected toDto(row: ConnectorEntity): ConnectorDto {
    return toConnectorDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
