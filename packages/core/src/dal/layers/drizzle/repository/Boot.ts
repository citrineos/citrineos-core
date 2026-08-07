// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootDto, RegistrationStatusEnumType } from '@citrineos/types';
import { type BootEntity, bootTable, tenantBootTable } from '../schema/Boot.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';
import type { IBootRepository } from '@/dal/index.js';
import { and, eq } from 'drizzle-orm';
import type { BootConfig, OCPP2_common_types } from '@citrineos/base';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external BootDto contract.
export function toBootDto(entity: BootEntity): BootDto {
  const dto: Explicit<BootDto> = {
    id: entity.id,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    lastBootTime: entity.lastBootTime ? entity.lastBootTime.toISOString() : null,
    heartbeatInterval: entity.heartbeatInterval ?? null,
    bootRetryInterval: entity.bootRetryInterval ?? null,
    status: entity.status ?? undefined,
    statusInfo: (entity.statusInfo as Record<string, any> | null) ?? null,
    getBaseReportOnPending: entity.getBaseReportOnPending ?? null,
    pendingBootSetVariables: undefined,
    variablesRejectedOnLastBoot:
      (entity.variablesRejectedOnLastBoot as Record<string, any>[] | null) ?? null,
    bootWithRejectedVariables: entity.bootWithRejectedVariables ?? null,
    changeConfigurationsOnPending: entity.changeConfigurationsOnPending ?? null,
    getConfigurationsOnPending: entity.getConfigurationsOnPending ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleBootRepository
  extends DrizzleRepository<typeof bootTable, BootDto>
  implements IBootRepository
{
  protected getTable(tenantId: number): typeof bootTable {
    return this.useTenantSchema ? tenantBootTable(tenantId) : bootTable;
  }

  protected toDto(row: BootEntity): BootDto {
    return toBootDto(row);
  }

  async _updateBootByKey(
    tenantId: number,
    value: object,
    key: string,
    emitEvent = true,
  ): Promise<BootDto | undefined> {
    const rows = (await this.db
      .update(bootTable)
      .set(value)
      .where(and(eq(bootTable.tenantId, tenantId), eq(bootTable.id, key)))
      .returning()) as BootEntity[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);
    if (emitEvent) {
      this.emit('updated', [dto]);
    }
    return dto;
  }

  // ─── IBootRepository methods ────────────────────────────────────
  // Note that for many of the methods below, we purposely DO NOT use the equivalent Drizzle methods
  // because they only accept key as a number, but Boot stores id as a string value equivalent to the
  // ocppConnectionName of the relevant station.

  async createOrUpdateByKey(
    tenantId: number,
    value: BootConfig,
    key: string,
  ): Promise<BootDto | undefined> {
    const bootExists = await this.existsByKey(tenantId, key);
    let savedBoot: BootDto | undefined;

    if (bootExists) {
      savedBoot = await this._updateBootByKey(tenantId, value, key, false);
    } else {
      const rows = (await this.db
        .insert(bootTable)
        .values({ ...value, tenantId } as BootEntity)
        .returning()) as BootEntity[];

      savedBoot = this.toDto(rows[0]);
    }

    if (savedBoot) {
      if (value.pendingBootSetVariableIds) {
        // TODO setup variable attributes repo
      }

      this.emit(bootExists ? 'updated' : 'created', [savedBoot]);
    }

    return savedBoot;
  }

  async deleteByKey(tenantId: number, key: string): Promise<BootDto | undefined> {
    const rows = (await this.db
      .delete(bootTable)
      .where(and(eq(bootTable.tenantId, tenantId), eq(bootTable.id, key)))
      .returning()) as BootEntity[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);
    this.emit('deleted', [dto]);
    return dto;
  }

  async existsByKey(tenantId: number, key: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: bootTable.id })
      .from(bootTable)
      .where(and(eq(bootTable.tenantId, tenantId), eq(bootTable.id, key)))
      .limit(1);

    return rows.length > 0;
  }

  async readByKey(tenantId: number, key: string): Promise<BootDto | undefined> {
    const rows = await this.db
      .select()
      .from(bootTable)
      .where(and(eq(bootTable.tenantId, tenantId), eq(bootTable.id, key)))
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  updateLastBootTimeByKey(
    tenantId: number,
    lastBootTime: string,
    key: string,
  ): Promise<BootDto | undefined> {
    return this._updateBootByKey(tenantId, { lastBootTime }, key);
  }

  updateStatusByKey(
    tenantId: number,
    status: RegistrationStatusEnumType,
    statusInfo: OCPP2_common_types.StatusInfoType | undefined,
    key: string,
  ): Promise<BootDto | undefined> {
    return this._updateBootByKey(tenantId, { status, statusInfo }, key);
  }
}
