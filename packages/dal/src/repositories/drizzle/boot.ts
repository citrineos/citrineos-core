// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IBootRepository } from '../../../index.js';
import type { BootCreate, BootDto, VariableAttributeDto } from '@citrineos/types';
import type { DrizzleVariableAttributeRepository } from '@dal/repositories/drizzle/variable-attribute.js';
import { and, eq } from 'drizzle-orm';
import { type BootEntity, bootTable, tenantBootTable } from '../../db/drizzle/schema/boot.js';
import { chargingStationTable } from '../../db/drizzle/schema/charging-station.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository, type DrizzleRepositoryDependencies } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external BootDto contract.
export function toBootDto(entity: BootEntity): BootDto {
  const dto: Explicit<BootDto> = {
    id: entity.id,
    stationId: entity.stationId,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    lastBootTime: entity.lastBootTime ? entity.lastBootTime.toISOString() : null,
    heartbeatInterval: entity.heartbeatInterval ?? null,
    bootRetryInterval: entity.bootRetryInterval ?? null,
    status: entity.status ?? undefined,
    statusInfo: (entity.statusInfo as Record<string, any> | null) ?? null,
    getBaseReportOnPending: entity.getBaseReportOnPending ?? null,
    pendingBootSetVariables: undefined,
    pendingBootSetVariableIds: undefined,
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
function toBootEntity(value: object): BootEntity {
  const v = value as { lastBootTime?: string | Date };
  if (typeof v.lastBootTime === 'string') {
    return { ...value, lastBootTime: new Date(v.lastBootTime) } as BootEntity;
  }
  return value as BootEntity;
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
  // Callers address a boot record by its station's ocppConnectionName, whereas the
  // record is keyed by stationId and its own `id` is an unrelated serial primary key.

  async updateByKey(tenantId: number, value: object, key: string): Promise<BootDto | undefined> {
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) return undefined;

    // Not allowed different tenants or stations in given value
    const { tenantId: _tenantId, stationId: _stationId, ...safeValue } = value as any;

    const rows = (await this.db
      .update(bootTable)
      .set(toBootEntity(safeValue))
      // stationId is a ChargingStations primary key, so it is unique across tenants
      .where(eq(bootTable.stationId, stationId))
      .returning()) as BootEntity[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);

    this.emit('updated', [dto]);

    return dto;
  }

  async createOrUpdateByKey(
    tenantId: number,
    value: BootCreate,
    key: string,
  ): Promise<BootDto | undefined> {
    // A boot record cannot exist without its station: stationId is a non-null FK.
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) {
      throw new Error(
        `Cannot store boot configuration: no charging station ${key} exists for tenant ${tenantId}`,
      );
    }

    // Wrapping in a transaction to match the Sequelize repo and "just in case" - unfortunately
    // means the db logic has to be repeated to use the transaction over the db
    let savedBoot: BootDto | undefined;
    let bootExists = false;

    await this.db.transaction(async (tx) => {
      const existingBoots = await tx
        .select({ id: bootTable.id })
        .from(bootTable)
        .where(eq(bootTable.stationId, stationId))
        .limit(1);

      bootExists = existingBoots.length > 0;

      const bootEntityToSave = toBootEntity({ ...value, tenantId, stationId });

      if (bootExists) {
        const savedBootsResult = (await tx
          .update(bootTable)
          .set(bootEntityToSave)
          .where(eq(bootTable.stationId, stationId))
          .returning()) as BootEntity[];

        if (!savedBootsResult[0]) return undefined;
        savedBoot = this.toDto(savedBootsResult[0]);
      } else {
        const rows = (await tx
          .insert(bootTable)
          .values(bootEntityToSave)
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
          savedBoot.id!,
        );
      }

      this.emit(bootExists ? 'updated' : 'created', [savedBoot]);
    }

    return savedBoot;
  }

  async deleteByKey(tenantId: number, key: string): Promise<BootDto | undefined> {
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) return undefined;

    const rows = (await this.db
      .delete(bootTable)
      .where(eq(bootTable.stationId, stationId))
      .returning()) as BootEntity[];

    if (!rows[0]) return undefined;
    const dto = this.toDto(rows[0]);
    this.emit('deleted', [dto]);
    return dto;
  }

  async existsByKey(tenantId: number, key: string): Promise<boolean> {
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) return false;

    const rows = await this.db
      .select({ id: bootTable.id })
      .from(bootTable)
      .where(eq(bootTable.stationId, stationId))
      .limit(1);

    return rows.length > 0;
  }

  async readByKey(tenantId: number, key: string): Promise<BootDto | undefined> {
    const stationId = await this.findStationId(tenantId, key);
    if (stationId === undefined) return undefined;

    const rows = await this.db
      .select()
      .from(bootTable)
      .where(eq(bootTable.stationId, stationId))
      .limit(1);

    return rows[0] ? this.toDto(rows[0]) : undefined;
  }

  // Resolves a tenant-scoped `ocppConnectionName` to a ChargingStation id.
  private async findStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | undefined> {
    const rows = await this.db
      .select({ id: chargingStationTable.id })
      .from(chargingStationTable)
      .where(
        and(
          eq(chargingStationTable.tenantId, tenantId),
          eq(chargingStationTable.ocppConnectionName, ocppConnectionName),
        ),
      )
      .limit(1);

    return rows[0]?.id;
  }

  private async manageSetVariables(
    tenantId: number,
    setVariableIds: number[],
    ocppConnectionName: string,
    bootConfigId: number,
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
