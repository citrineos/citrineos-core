// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, StatusNotificationDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type StatusNotificationEntity,
  statusNotificationTable,
  tenantStatusNotificationTable,
} from '../schema/StatusNotification.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external StatusNotificationDto contract.
export function toStatusNotificationDto(
  entity: StatusNotificationEntity,
): StatusNotificationDto {
  const dto: Explicit<StatusNotificationDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp ? entity.timestamp.toISOString() : null,
    // Enum stored as string in the DB — cast back to the DTO's enum union.
    connectorStatus: entity.connectorStatus as StatusNotificationDto['connectorStatus'],
    evseId: entity.evseId,
    connectorId: entity.connectorId ?? 0,
    errorCode: entity.errorCode,
    info: entity.info,
    vendorId: entity.vendorId,
    vendorErrorCode: entity.vendorErrorCode,
    // Relation is not present on a flat DB row.
    chargingStation: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleStatusNotificationRepository extends DrizzleRepository<
  typeof statusNotificationTable,
  StatusNotificationDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof statusNotificationTable {
    return this.useTenantSchema
      ? tenantStatusNotificationTable(tenantId)
      : statusNotificationTable;
  }

  protected toDto(row: StatusNotificationEntity): StatusNotificationDto {
    return toStatusNotificationDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
