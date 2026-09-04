// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ISetNetworkProfileRepository,
  SetNetworkProfileCreateInput,
} from '@dal/repositories/repositories.js';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { SetNetworkProfileDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import { chargingStationTable } from '../../db/drizzle/schema/charging-station.js';
import {
  type SetNetworkProfileEntity,
  setNetworkProfileTable,
  tenantSetNetworkProfileTable,
} from '../../db/drizzle/schema/set-network-profile.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

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

export class DrizzleSetNetworkProfileRepository
  extends DrizzleRepository<typeof setNetworkProfileTable, SetNetworkProfileDto>
  implements ISetNetworkProfileRepository
{
  protected getTable(tenantId: number): typeof setNetworkProfileTable {
    return this.useTenantSchema ? tenantSetNetworkProfileTable(tenantId) : setNetworkProfileTable;
  }

  protected toDto(row: SetNetworkProfileEntity): SetNetworkProfileDto {
    return toSetNetworkProfileDto(row);
  }

  async createPending(values: SetNetworkProfileCreateInput): Promise<SetNetworkProfileDto> {
    const tenantId = values.tenantId ?? DEFAULT_TENANT_ID;
    const stationId = await this.resolveStationId(tenantId, values.ocppConnectionName ?? undefined);
    return this.insert(tenantId, {
      stationId,
      ocppConnectionName: values.ocppConnectionName,
      correlationId: values.correlationId,
      websocketServerConfigId: values.websocketServerConfigId,
      configurationSlot: values.configurationSlot,
      ocppVersion: values.ocppVersion,
      ocppTransport: values.ocppTransport,
      ocppCsmsUrl: values.ocppCsmsUrl,
      messageTimeout: values.messageTimeout,
      securityProfile: values.securityProfile,
      ocppInterface: values.ocppInterface,
      apn: values.apn,
      vpn: values.vpn,
    });
  }

  private async resolveStationId(
    tenantId: number,
    ocppConnectionName?: string,
  ): Promise<number | undefined> {
    if (!ocppConnectionName) {
      return undefined;
    }
    const rows = await this.db
      .select({ id: chargingStationTable.id })
      .from(chargingStationTable)
      .where(
        and(
          eq(chargingStationTable.ocppConnectionName, ocppConnectionName),
          eq(chargingStationTable.tenantId, tenantId),
        ),
      )
      .limit(1);
    return rows[0]?.id;
  }
}
