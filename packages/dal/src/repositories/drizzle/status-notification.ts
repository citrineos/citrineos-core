// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IStatusNotificationRepository } from '@dal/repositories/repositories.js';
import type { StatusNotificationDto } from '@citrineos/types';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  latestStatusNotificationTable,
  tenantLatestStatusNotificationTable,
} from '../../db/drizzle/schema/latest-status-notification.js';
import {
  type StatusNotificationEntity,
  statusNotificationTable,
  tenantStatusNotificationTable,
} from '../../db/drizzle/schema/status-notification.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository, type DrizzleWriteContext } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external StatusNotificationDto contract.
export function toStatusNotificationDto(entity: StatusNotificationEntity): StatusNotificationDto {
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

export class DrizzleStatusNotificationRepository
  extends DrizzleRepository<typeof statusNotificationTable, StatusNotificationDto>
  implements IStatusNotificationRepository
{
  protected getTable(tenantId: number): typeof statusNotificationTable {
    return this.useTenantSchema ? tenantStatusNotificationTable(tenantId) : statusNotificationTable;
  }

  protected toDto(row: StatusNotificationEntity): StatusNotificationDto {
    return toStatusNotificationDto(row);
  }

  private getLatestStatusNotificationTable(tenantId: number): typeof latestStatusNotificationTable {
    return this.useTenantSchema
      ? tenantLatestStatusNotificationTable(tenantId)
      : latestStatusNotificationTable;
  }

  private getChargingStationTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  private async resolveStationId(
    tenantId: number,
    ocppConnectionName: string,
    ctx: DrizzleWriteContext,
  ): Promise<number | undefined> {
    const stations = this.getChargingStationTable(tenantId);
    const rows = await ctx.db
      .select({ id: stations.id })
      .from(stations)
      .where(
        and(
          eq(stations.ocppConnectionName, ocppConnectionName),
          this.tenantFilter(stations, tenantId),
        ),
      )
      .limit(1);

    return rows[0]?.id;
  }

  // ─── IStatusNotificationRepository methods ───────────────────────────────

  async addStatusNotificationToChargingStation(
    tenantId: number,
    ocppConnectionName: string,
    statusNotification: StatusNotificationDto,
  ): Promise<void> {
    await this.withAtomicWrite(async (ctx) => {
      const stationId = await this.resolveStationId(tenantId, ocppConnectionName, ctx);

      const saved = await this.insert(
        tenantId,
        {
          ocppConnectionName,
          stationId,
          timestamp: statusNotification.timestamp ? new Date(statusNotification.timestamp) : null,
          connectorStatus: statusNotification.connectorStatus,
          evseId: statusNotification.evseId ?? null,
          connectorId: statusNotification.connectorId,
          errorCode: statusNotification.errorCode,
          info: statusNotification.info,
          vendorId: statusNotification.vendorId,
          vendorErrorCode: statusNotification.vendorErrorCode,
        },
        ctx,
      );

      await this.replaceLatestStatusNotification(
        tenantId,
        ocppConnectionName,
        stationId,
        saved,
        ctx,
      );
    });
  }

  /**
   * Points LatestStatusNotifications at the row just inserted, replacing whatever
   * pointer currently exists for this (station, evse, connector) combination.
   */
  private async replaceLatestStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    stationId: number | undefined,
    statusNotification: StatusNotificationDto,
    ctx: DrizzleWriteContext,
  ): Promise<void> {
    const latest = this.getLatestStatusNotificationTable(tenantId);
    const notifications = this.getTable(tenantId);

    const evseMatch =
      statusNotification.evseId != null
        ? eq(notifications.evseId, statusNotification.evseId)
        : sql`${notifications.evseId} is null`;

    const stale = await ctx.db
      .select({ id: latest.id })
      .from(latest)
      .innerJoin(notifications, eq(latest.statusNotificationId, notifications.id))
      .where(
        and(
          eq(latest.ocppConnectionName, ocppConnectionName),
          evseMatch,
          eq(notifications.connectorId, statusNotification.connectorId),
          this.tenantFilter(latest, tenantId),
        ),
      );

    if (stale.length > 0) {
      await ctx.db.delete(latest).where(
        and(
          inArray(
            latest.id,
            stale.map((row) => row.id),
          ),
          this.tenantFilter(latest, tenantId),
        ),
      );
    }

    await ctx.db.insert(latest).values({
      tenantId,
      ocppConnectionName,
      statusNotificationId: statusNotification.id,
      stationId,
    });
  }
}
