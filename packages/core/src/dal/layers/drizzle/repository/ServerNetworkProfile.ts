// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IServerNetworkProfileRepository } from '@/dal/index.js';
import type { BootstrapConfig, ServerNetworkProfileDto } from '@citrineos/base';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type ServerNetworkProfileEntity,
  serverNetworkProfileTable,
  tenantServerNetworkProfileTable,
} from '../schema/ServerNetworkProfile.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ServerNetworkProfileDto contract.
// Note: the DTO intentionally omits the model-only columns dynamicTenantResolution
// and tenantPathMapping — they are persisted but not part of the public contract.
export function toServerNetworkProfileDto(
  entity: ServerNetworkProfileEntity,
): ServerNetworkProfileDto {
  const dto: Explicit<ServerNetworkProfileDto> = {
    id: entity.id,
    host: entity.host,
    port: entity.port,
    pingInterval: entity.pingInterval,
    protocols: entity.protocols,
    messageTimeout: entity.messageTimeout,
    securityProfile: entity.securityProfile,
    allowUnknownChargingStations: entity.allowUnknownChargingStations,
    tlsKeyFilePath: entity.tlsKeyFilePath ?? undefined,
    tlsCertificateChainFilePath: entity.tlsCertificateChainFilePath ?? undefined,
    mtlsCertificateAuthorityKeyFilePath: entity.mtlsCertificateAuthorityKeyFilePath ?? undefined,
    rootCACertificateFilePath: entity.rootCACertificateFilePath ?? undefined,
    chargingStations: undefined,
    tenantId: entity.tenantId ?? undefined,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleServerNetworkProfileRepository
  extends DrizzleRepository<typeof serverNetworkProfileTable, ServerNetworkProfileDto>
  implements IServerNetworkProfileRepository
{
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof serverNetworkProfileTable {
    return this.useTenantSchema
      ? tenantServerNetworkProfileTable(tenantId)
      : serverNetworkProfileTable;
  }

  protected toDto(row: ServerNetworkProfileEntity): ServerNetworkProfileDto {
    return toServerNetworkProfileDto(row);
  }

  // ─── IServerNetworkProfileRepository methods ─────────────────────────────

  // Upserts by id (the websocket server id). Mirrors the Sequelize findOrBuild +
  // save behavior: insert a new row or overwrite the existing one's fields.
  // messageTimeout is derived from maxCallLengthSeconds, matching the Sequelize repo.
  async upsertServerNetworkProfile(
    websocketServerConfig: any,
    maxCallLengthSeconds: number,
  ): Promise<ServerNetworkProfileDto> {
    const tenantId = websocketServerConfig.tenantId ?? DEFAULT_TENANT_ID;
    const table = this.getTable(tenantId);

    const values = {
      id: websocketServerConfig.id,
      host: websocketServerConfig.host,
      port: websocketServerConfig.port,
      pingInterval: websocketServerConfig.pingInterval,
      protocols: websocketServerConfig.protocols,
      messageTimeout: maxCallLengthSeconds,
      securityProfile: websocketServerConfig.securityProfile,
      allowUnknownChargingStations: websocketServerConfig.allowUnknownChargingStations,
      dynamicTenantResolution: websocketServerConfig.dynamicTenantResolution ?? false,
      tenantPathMapping: websocketServerConfig.tenantPathMapping ?? null,
      tlsKeyFilePath: websocketServerConfig.tlsKeyFilePath ?? null,
      tlsCertificateChainFilePath: websocketServerConfig.tlsCertificateChainFilePath ?? null,
      mtlsCertificateAuthorityKeyFilePath:
        websocketServerConfig.mtlsCertificateAuthorityKeyFilePath ?? null,
      rootCACertificateFilePath: websocketServerConfig.rootCACertificateFilePath ?? null,
      tenantId,
    };

    const rows = (await (this.db.insert(table as any) as any)
      .values(values)
      .onConflictDoUpdate({
        target: table.id,
        set: { ...values, updatedAt: new Date() },
      })
      .returning()) as ServerNetworkProfileEntity[];

    const dto = this.toDto(rows[0]);
    this.emit('updated', [dto]);
    return dto;
  }
}

export default DrizzleServerNetworkProfileRepository;
