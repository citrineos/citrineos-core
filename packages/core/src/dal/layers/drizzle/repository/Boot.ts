// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootDto, VariableAttributeDto } from '@citrineos/types';
import { type BootEntity, bootTable, tenantBootTable } from '../schema/Boot.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository, type DrizzleRepositoryDependencies } from './Base.js';
import { type IBootRepository } from '@/dal/index.js';
import { and, eq } from 'drizzle-orm';
import type { BootConfig } from '@citrineos/base';
import type { DrizzleVariableAttributeRepository } from '@dal/layers/drizzle/repository/VariableAttribute.js';

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

// Required to convert lastBootTime back into Date
function toBootEntity(value: object): object {
  const v = value as { lastBootTime?: unknown };
  if (typeof v.lastBootTime === 'string') {
    return { ...value, lastBootTime: new Date(v.lastBootTime) };
  }
  return value;
}

export class DrizzleBootRepository
  extends DrizzleRepository<typeof bootTable, BootDto>
  implements IBootRepository
{
  private _variableAttributeRepository: DrizzleVariableAttributeRepository;

  constructor({
    config,
    logger,
    variableAttributeRepository,
  }: DrizzleRepositoryDependencies & {
    variableAttributeRepository: DrizzleVariableAttributeRepository;
  }) {
    super({ config, logger });

    this._variableAttributeRepository = variableAttributeRepository;
  }

  protected getTable(tenantId: number): typeof bootTable {
    return this.useTenantSchema ? tenantBootTable(tenantId) : bootTable;
  }

  protected toDto(row: BootEntity): BootDto {
    return toBootDto(row);
  }

  // ──────────── IBootRepository methods ─────────────────────────────
  // Note that for many of the methods below, we purposely DO NOT use the equivalent Drizzle methods
  // because they only accept key as a number, but Boot stores id as a string equal to the
  // ocppConnectionName of the relevant station.

  async updateByKey(tenantId: number, value: object, key: string): Promise<BootDto | undefined> {
    const rows = (await this.db
      .update(bootTable)
      .set(toBootEntity(value))
      .where(and(eq(bootTable.tenantId, tenantId), eq(bootTable.id, key)))
      .returning()) as BootEntity[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);

    this.emit('updated', [dto]);

    return dto;
  }

  async createOrUpdateByKey(
    tenantId: number,
    value: BootConfig,
    key: string,
  ): Promise<BootDto | undefined> {
    // Wrapping in a transaction to match the Sequelize repo and "just in case" - unfortunately
    // means the db logic has to be repeated to use the transaction over the db
    let savedBoot: BootDto | undefined;
    let bootExists = false;

    await this.db.transaction(async (tx) => {
      const existingBoots = await tx
        .select({ id: bootTable.id })
        .from(bootTable)
        .where(and(eq(bootTable.tenantId, tenantId), eq(bootTable.id, key)))
        .limit(1);

      bootExists = existingBoots.length > 0;

      if (bootExists) {
        const bootSavedResult = (await tx
          .update(bootTable)
          .set(toBootEntity(value))
          .where(and(eq(bootTable.tenantId, tenantId), eq(bootTable.id, key)))
          .returning()) as BootEntity[];

        if (!bootSavedResult[0]) return undefined;
        savedBoot = this.toDto(bootSavedResult[0]);
      } else {
        const rows = (await tx
          .insert(bootTable)
          .values({ ...toBootEntity(value), tenantId } as BootEntity)
          .returning()) as BootEntity[];

        savedBoot = this.toDto(rows[0]);
      }
    });

    if (savedBoot) {
      if (value.pendingBootSetVariableIds) {
        savedBoot.pendingBootSetVariables = await this.manageSetVariables(
          tenantId,
          value.pendingBootSetVariableIds,
          key,
          savedBoot.id,
        );
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

  private async manageSetVariables(
    tenantId: number,
    setVariableIds: number[],
    ocppConnectionName: string,
    bootConfigId: string,
  ) {
    const managedSetVariables: VariableAttributeDto[] = [];

    await this._variableAttributeRepository.updateAllByQueryString(
      {
        tenantId,
        ocppConnectionName,
      },
      { bootConfigId: null },
    );

    // Assigns variables, or throws an error if variable with id does not exist
    for (const setVariableId of setVariableIds) {
      const setVariable: VariableAttributeDto | undefined =
        await this._variableAttributeRepository.updateById(tenantId, setVariableId, {
          bootConfigId,
        });

      if (!setVariable) {
        // When this is called from createOrUpdateByKey, this code should be impossible to reach
        // Since the boot object would have already been upserted with the pendingBootSetVariableIds as foreign keys
        // And if they were not valid foreign keys, it would have thrown an error
        throw new Error(
          'Error while setting variables on Boot: SetVariableId does not exist ' + setVariableId,
        );
      } else {
        managedSetVariables.push(setVariable);
      }
    }

    return managedSetVariables;
  }
}
