// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { LatestStatusNotificationDto } from '@citrineos/types';
import {
  type LatestStatusNotificationEntity,
  latestStatusNotificationTable,
  tenantLatestStatusNotificationTable,
} from '../../db/drizzle/schema/latest-status-notification.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external LatestStatusNotificationDto contract.
export function toLatestStatusNotificationDto(
  entity: LatestStatusNotificationEntity,
): LatestStatusNotificationDto {
  const dto: Explicit<LatestStatusNotificationDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    statusNotificationId: entity.statusNotificationId ?? '',
    // Relations are not present on a flat DB row.
    chargingStation: undefined,
    statusNotification: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleLatestStatusNotificationRepository extends DrizzleRepository<
  typeof latestStatusNotificationTable,
  LatestStatusNotificationDto
> {
  protected getTable(tenantId: number): typeof latestStatusNotificationTable {
    return this.useTenantSchema
      ? tenantLatestStatusNotificationTable(tenantId)
      : latestStatusNotificationTable;
  }

  protected toDto(row: LatestStatusNotificationEntity): LatestStatusNotificationDto {
    return toLatestStatusNotificationDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
