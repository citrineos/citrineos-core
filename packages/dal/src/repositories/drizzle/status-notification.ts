// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ConnectorStatusNotificationResult,
  IStatusNotificationRepository,
  StationStatusNotificationResult,
} from '@dal/repositories/repositories.js';
import type { ConnectorDto, StatusNotificationDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  type StatusNotificationEntity,
  statusNotificationTable,
  tenantStatusNotificationTable,
} from '../../db/drizzle/schema/status-notification.js';
import { type Explicit } from '../../db/drizzle/types.js';
import {
  DrizzleRepository,
  type DrizzleRepositoryDependencies,
  type DrizzleWriteContext,
} from './base.js';
import { type DrizzleConnectorRepository } from './connector.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external StatusNotificationDto contract.
export function toStatusNotificationDto(entity: StatusNotificationEntity): StatusNotificationDto {
  const dto: Explicit<StatusNotificationDto> = {
    id: entity.id,
    stationId: entity.stationId,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp ? entity.timestamp.toISOString() : null,
    // Enum stored as string in the DB — cast back to the DTO's enum union.
    connectorStatus: entity.connectorStatus as StatusNotificationDto['connectorStatus'],
    evseId: entity.evseId,
    connectorId: entity.connectorId ?? 0,
    connectorDatabaseId: entity.connectorDatabaseId,
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
  private _connectorRepository: DrizzleConnectorRepository;

  constructor({
    config,
    logger,
    drizzleInstance,
    useTenantSchema,
    connectorRepository,
  }: DrizzleRepositoryDependencies & {
    connectorRepository: DrizzleConnectorRepository;
  }) {
    super({ config, logger, drizzleInstance, useTenantSchema });

    this._connectorRepository = connectorRepository;
  }

  protected getTable(tenantId: number): typeof statusNotificationTable {
    return this.useTenantSchema ? tenantStatusNotificationTable(tenantId) : statusNotificationTable;
  }

  protected toDto(row: StatusNotificationEntity): StatusNotificationDto {
    return toStatusNotificationDto(row);
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
  ): Promise<StatusNotificationDto> {
    return this.withAtomicWrite((ctx) =>
      this.insertStatusNotification(tenantId, ocppConnectionName, statusNotification, ctx),
    );
  }

  async addOcpp2ConnectorStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    connector: ConnectorDto & { evseTypeConnectorId: number },
    statusNotification: StatusNotificationDto,
  ): Promise<ConnectorStatusNotificationResult> {
    return this.withAtomicWrite(async (ctx) =>
      this.linkStatusNotificationToConnector(
        tenantId,
        ocppConnectionName,
        await this._connectorRepository.createOrUpdateOcpp2Connector(tenantId, connector, ctx),
        statusNotification,
        ctx,
      ),
    );
  }

  async addOcpp16ConnectorStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    connector: ConnectorDto & { connectorId: number },
    statusNotification: StatusNotificationDto,
  ): Promise<ConnectorStatusNotificationResult> {
    return this.withAtomicWrite(async (ctx) =>
      this.linkStatusNotificationToConnector(
        tenantId,
        ocppConnectionName,
        await this._connectorRepository.createOrUpdateOcpp16Connector(tenantId, connector, ctx),
        statusNotification,
        ctx,
      ),
    );
  }

  async addOcpp16StationStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    connector: Partial<ConnectorDto>,
    statusNotification: StatusNotificationDto,
  ): Promise<StationStatusNotificationResult> {
    return this.withAtomicWrite(async (ctx) => {
      const saved = await this.insertStatusNotification(
        tenantId,
        ocppConnectionName,
        statusNotification,
        ctx,
      );
      if (saved.stationId == null) {
        throw new Error(`Charging station ${ocppConnectionName} not found`);
      }

      const connectors = await this._connectorRepository.updateAllConnectorsByStationId(
        tenantId,
        saved.stationId,
        { ...connector, latestStatusNotificationId: saved.id },
        ctx,
      );
      return { statusNotification: saved, connectors };
    });
  }

  private async linkStatusNotificationToConnector(
    tenantId: number,
    ocppConnectionName: string,
    connector: ConnectorDto | undefined,
    statusNotification: StatusNotificationDto,
    ctx: DrizzleWriteContext,
  ): Promise<ConnectorStatusNotificationResult> {
    if (connector?.id === undefined) {
      throw new Error(`Failed to save the connector reported by ${ocppConnectionName}`);
    }

    const saved = await this.insertStatusNotification(
      tenantId,
      ocppConnectionName,
      { ...statusNotification, connectorDatabaseId: connector.id },
      ctx,
    );
    const linked = await this._connectorRepository.updateById(
      tenantId,
      connector.id,
      { latestStatusNotificationId: saved.id, updatedAt: new Date() },
      ctx,
    );
    if (!linked) {
      throw new Error(`Failed to save the connector reported by ${ocppConnectionName}`);
    }
    return { statusNotification: saved, connector: linked };
  }

  private async insertStatusNotification(
    tenantId: number,
    ocppConnectionName: string,
    statusNotification: StatusNotificationDto,
    ctx: DrizzleWriteContext,
  ): Promise<StatusNotificationDto> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName, ctx);

    return await this.insert(
      tenantId,
      {
        stationId,
        timestamp: statusNotification.timestamp ? new Date(statusNotification.timestamp) : null,
        connectorStatus: statusNotification.connectorStatus,
        evseId: statusNotification.evseId ?? null,
        connectorId: statusNotification.connectorId,
        connectorDatabaseId: statusNotification.connectorDatabaseId,
        errorCode: statusNotification.errorCode,
        info: statusNotification.info,
        vendorId: statusNotification.vendorId,
        vendorErrorCode: statusNotification.vendorErrorCode,
      },
      ctx,
    );
  }
}
