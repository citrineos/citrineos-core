// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ChargingStationNetworkProfileDto } from '@citrineos/types';
import { and, eq, inArray, type SQL } from 'drizzle-orm';
import type { IChargingStationNetworkProfileRepository } from '@dal/repositories/repositories.js';
import {
  type ChargingStationNetworkProfileEntity,
  chargingStationNetworkProfileTable,
  tenantChargingStationNetworkProfileTable,
} from '../../db/drizzle/schema/charging-station-network-profile.js';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  type ServerNetworkProfileEntity,
  serverNetworkProfileTable,
  tenantServerNetworkProfileTable,
} from '../../db/drizzle/schema/server-network-profile.js';
import {
  type SetNetworkProfileEntity,
  setNetworkProfileTable,
  tenantSetNetworkProfileTable,
} from '../../db/drizzle/schema/set-network-profile.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleTenantScopedRepository, type DrizzleExecutor } from './base.js';
import { toServerNetworkProfileDto } from './server-network-profile.js';
import { toSetNetworkProfileDto } from './set-network-profile.js';

// The columns of a ChargingStationNetworkProfiles row, without the relations the
// DTO requires — what the shared base methods can build from a flat row.
export type ChargingStationNetworkProfileRow = Omit<
  ChargingStationNetworkProfileDto,
  'setNetworkProfile' | 'websocketServerConfig'
>;

// ─── Mappers ─────────────────────────────────────────────────────────────────
export function toChargingStationNetworkProfileRow(
  entity: ChargingStationNetworkProfileEntity,
): Explicit<ChargingStationNetworkProfileRow> {
  const row: Explicit<ChargingStationNetworkProfileRow> = {
    stationId: entity.stationId,
    configurationSlot: entity.configurationSlot ?? 0,
    setNetworkProfileId: entity.setNetworkProfileId ?? 0,
    websocketServerConfigId: entity.websocketServerConfigId ?? undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return row;
}

export function toChargingStationNetworkProfileDto(
  entity: ChargingStationNetworkProfileEntity,
  setNetworkProfile: SetNetworkProfileEntity,
  websocketServerConfig: ServerNetworkProfileEntity | null,
): ChargingStationNetworkProfileDto {
  const dto: Explicit<ChargingStationNetworkProfileDto> = {
    ...toChargingStationNetworkProfileRow(entity),
    setNetworkProfile: toSetNetworkProfileDto(setNetworkProfile),
    websocketServerConfig: websocketServerConfig
      ? toServerNetworkProfileDto(websocketServerConfig)
      : undefined,
  };
  return dto;
}

export class DrizzleChargingStationNetworkProfileRepository
  extends DrizzleTenantScopedRepository<
    typeof chargingStationNetworkProfileTable,
    ChargingStationNetworkProfileRow
  >
  implements IChargingStationNetworkProfileRepository
{
  protected getTable(tenantId: number): typeof chargingStationNetworkProfileTable {
    return this.useTenantSchema
      ? tenantChargingStationNetworkProfileTable(tenantId)
      : chargingStationNetworkProfileTable;
  }

  protected toDto(row: ChargingStationNetworkProfileEntity): ChargingStationNetworkProfileRow {
    return toChargingStationNetworkProfileRow(row);
  }

  // ─── IChargingStationNetworkProfileRepository methods ────────────────────

  async deleteAllByStationIdAndConfigurationSlots(
    tenantId: number,
    ocppConnectionName: string,
    configurationSlot: number[],
  ): Promise<ChargingStationNetworkProfileDto[]> {
    if (configurationSlot.length === 0) {
      return [];
    }

    return this.withAtomicWrite(async (ctx) => {
      const stationId = await this.findStationId(tenantId, ocppConnectionName, ctx.db);
      if (stationId === undefined) {
        return [];
      }

      const table = this.getTable(tenantId);
      const where = and(
        eq(table.stationId, stationId),
        inArray(table.configurationSlot, configurationSlot),
        this.tenantFilter(table, tenantId),
      );
      const dtos = await this.selectWithProfiles(tenantId, where, ctx.db);
      if (dtos.length === 0) {
        return dtos;
      }

      await ctx.db.delete(table).where(where);
      this.raise(ctx, 'deleted', dtos);
      return dtos;
    });
  }

  async readAllByStationIdWithProfiles(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<ChargingStationNetworkProfileDto[]> {
    const stationId = await this.findStationId(tenantId, ocppConnectionName, this.db);
    if (stationId === undefined) {
      return [];
    }

    const table = this.getTable(tenantId);
    return this.selectWithProfiles(
      tenantId,
      and(eq(table.stationId, stationId), this.tenantFilter(table, tenantId)),
      this.db,
    );
  }

  async readByConfigurationSlot(
    tenantId: number,
    ocppConnectionName: string,
    configurationSlot: number,
  ): Promise<ChargingStationNetworkProfileDto | undefined> {
    const stationId = await this.findStationId(tenantId, ocppConnectionName, this.db);
    if (stationId === undefined) {
      return undefined;
    }

    const table = this.getTable(tenantId);
    const dtos = await this.selectWithProfiles(
      tenantId,
      and(
        eq(table.stationId, stationId),
        eq(table.configurationSlot, configurationSlot),
        this.tenantFilter(table, tenantId),
      ),
      this.db,
    );
    return dtos[0];
  }

  // Select-then-write rather than onConflictDoUpdate: only migration-built schemas
  // carry the (stationId, configurationSlot) unique a conflict target needs.
  async upsertByConfigurationSlot(
    tenantId: number,
    stationId: number,
    configurationSlot: number,
    setNetworkProfileId: number,
    websocketServerConfigId: string,
  ): Promise<ChargingStationNetworkProfileDto> {
    return this.withAtomicWrite(async (ctx) => {
      const table = this.getTable(tenantId);
      const where = and(
        eq(table.stationId, stationId),
        eq(table.configurationSlot, configurationSlot),
        this.tenantFilter(table, tenantId),
      );

      const existing = await ctx.db.select().from(table).where(where).limit(1);
      if (existing.length > 0) {
        await ctx.db
          .update(table)
          .set({ setNetworkProfileId, websocketServerConfigId, updatedAt: new Date() })
          .where(where);
      } else {
        await ctx.db.insert(table).values({
          stationId,
          configurationSlot,
          setNetworkProfileId,
          websocketServerConfigId,
          tenantId,
        });
      }

      const [dto] = await this.selectWithProfiles(tenantId, where, ctx.db);
      this.raise(ctx, existing.length > 0 ? 'updated' : 'created', [dto]);
      return dto;
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async findStationId(
    tenantId: number,
    ocppConnectionName: string,
    db: DrizzleExecutor,
  ): Promise<number | undefined> {
    const stations = this.useTenantSchema
      ? tenantChargingStationTable(tenantId)
      : chargingStationTable;
    const rows = await db
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

  private async selectWithProfiles(
    tenantId: number,
    where: SQL | undefined,
    db: DrizzleExecutor,
  ): Promise<ChargingStationNetworkProfileDto[]> {
    const table = this.getTable(tenantId);
    const setProfiles = this.useTenantSchema
      ? tenantSetNetworkProfileTable(tenantId)
      : setNetworkProfileTable;
    const serverProfiles = this.useTenantSchema
      ? tenantServerNetworkProfileTable(tenantId)
      : serverNetworkProfileTable;

    const rows = await db
      .select({ profile: table, setNetworkProfile: setProfiles, server: serverProfiles })
      .from(table)
      .innerJoin(
        setProfiles,
        and(
          eq(table.setNetworkProfileId, setProfiles.id),
          this.tenantFilter(setProfiles, tenantId),
        ),
      )
      .leftJoin(serverProfiles, eq(table.websocketServerConfigId, serverProfiles.id))
      .where(where);

    return rows.map(({ profile, setNetworkProfile, server }) =>
      toChargingStationNetworkProfileDto(profile, setNetworkProfile, server),
    );
  }
}

export default DrizzleChargingStationNetworkProfileRepository;
