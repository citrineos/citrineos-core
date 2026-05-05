// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '@db/drizzle.module';
import { connectors, NewConnector } from '@entities/connector.entity';

/**
 * Connector — internal per-(station, evseId, connectorId) row.
 *
 * Mirrors `core/src/dal/repository/Location/Connector` access patterns:
 *  - `upsertStatus`: insert-or-update on the unique tuple, used by the
 *    StatusNotification handler to reflect the latest connector status.
 *  - `findByStation` / `findOne`: read-side helpers for REST consumers.
 */
@Injectable()
export class ConnectorRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async upsertStatus(data: NewConnector): Promise<void> {
    await this.db
      .insert(connectors)
      .values(data)
      .onConflictDoUpdate({
        target: [connectors.stationPkId, connectors.connectorId],
        set: {
          status: data.status ?? null,
          timestamp: data.timestamp ?? null,
          errorCode: data.errorCode ?? null,
          info: data.info ?? null,
          vendorId: data.vendorId ?? null,
          vendorErrorCode: data.vendorErrorCode ?? null,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Partial upsert — only the columns explicitly supplied on `data` are
   * touched on conflict; other columns retain their existing values.
   *
   * Used by NotifyReport ingest where each device-model report entry
   * carries one variable's value (e.g. `Type`) and shouldn't disturb
   * the connector's currently-known `status` / `errorCode` / etc.
   */
  async upsertMetadata(data: NewConnector): Promise<void> {
    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (data.status !== undefined) set.status = data.status;
    if (data.timestamp !== undefined) set.timestamp = data.timestamp;
    if (data.errorCode !== undefined) set.errorCode = data.errorCode;
    if (data.info !== undefined) set.info = data.info;
    if (data.vendorId !== undefined) set.vendorId = data.vendorId;
    if (data.vendorErrorCode !== undefined) set.vendorErrorCode = data.vendorErrorCode;
    if (data.type !== undefined) set.type = data.type;
    if (data.format !== undefined) set.format = data.format;
    if (data.powerType !== undefined) set.powerType = data.powerType;
    if (data.maximumAmperage !== undefined) set.maximumAmperage = data.maximumAmperage;
    if (data.maximumVoltage !== undefined) set.maximumVoltage = data.maximumVoltage;
    if (data.maximumPowerWatts !== undefined) set.maximumPowerWatts = data.maximumPowerWatts;
    await this.db
      .insert(connectors)
      .values(data)
      .onConflictDoUpdate({
        target: [connectors.stationPkId, connectors.connectorId],
        set,
      });
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(connectors)
      .where(and(eq(connectors.tenantId, tenantId), eq(connectors.stationId, stationId)));
  }

  async findOne(tenantId: number, stationId: string, evseId: number, connectorId: number) {
    const rows = await this.db
      .select()
      .from(connectors)
      .where(
        and(
          eq(connectors.tenantId, tenantId),
          eq(connectors.stationId, stationId),
          eq(connectors.evseId, evseId),
          eq(connectors.connectorId, connectorId),
        ),
      )
      .limit(1);
    return rows[0];
  }
}
