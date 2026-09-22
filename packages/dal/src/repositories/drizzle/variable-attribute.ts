// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { VariableAttributeDto } from '@citrineos/types';
import {
  tenantVariableAttributeTable,
  type VariableAttributeEntity,
  variableAttributeTable,
} from '../../db/drizzle/schema/variable-attribute.js';
import { chargingStationTable } from '../../db/drizzle/schema/charging-station.js';
import {
  type ComponentEntity,
  componentTable,
  tenantComponentTable,
} from '../../db/drizzle/schema/component.js';
import {
  tenantVariableTable,
  type VariableEntity,
  variableTable,
} from '../../db/drizzle/schema/variable.js';
import {
  type EvseTypeEntity,
  evseTypeTable,
  tenantEvseTypeTable,
} from '../../db/drizzle/schema/evse-type.js';
import {
  tenantVariableCharacteristicsTable,
  type VariableCharacteristicsEntity,
  variableCharacteristicsTable,
} from '../../db/drizzle/schema/variable-characteristics.js';
import {
  tenantVariableStatusTable,
  type VariableStatusEntity,
  variableStatusTable,
} from '../../db/drizzle/schema/variable-status.js';
import { toComponentDto } from './component.js';
import { toVariableDto } from './variable.js';
import { toEvseTypeDto } from './evse-type.js';
import { toVariableCharacteristicsDto } from './variable-characteristics.js';
import { toVariableStatusDto } from './variable-status.js';
import type { IVariableAttributeRepository } from '@dal/repositories/repositories.js';
import { DrizzleRepository } from './base.js';
import type { VariableAttributeQuerystring } from '@dal/interfaces/queries/variable-attribute.js';
import { and, eq, exists, inArray, isNull, sql, type SQL } from 'drizzle-orm';

// A row of the hydrated read graph.
interface GraphRow {
  attribute: VariableAttributeEntity;
  component: ComponentEntity;
  variable: VariableEntity;
  evse: EvseTypeEntity | null;
  characteristics: VariableCharacteristicsEntity | null;
}

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external VariableAttributeDto contract.
// The DTO requires nested relation objects (chargingStation, variable, component)
// that cannot be produced from a flat row, so scalar columns are mapped and the
// result is returned with a pragmatic cast.
export function toVariableAttributeDto(entity: VariableAttributeEntity): VariableAttributeDto {
  return {
    id: entity.id,
    stationId: entity.stationId,
    type: entity.type ?? null,
    dataType: entity.dataType,
    value: entity.value ?? null,
    mutability: entity.mutability ?? null,
    persistent: entity.persistent ?? false,
    constant: entity.constant ?? false,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    generatedAt: entity.generatedAt?.toISOString(),
    variableId: entity.variableId ?? null,
    componentId: entity.componentId ?? null,
    evseDatabaseId: entity.evseDatabaseId ?? null,
    bootConfigId: entity.bootConfigId ?? null,
    tenantId: entity.tenantId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    // TODO: map relations (chargingStation, variable, component, evse, statuses, bootConfig)
  } as VariableAttributeDto;
}

export class DrizzleVariableAttributeRepository
  extends DrizzleRepository<typeof variableAttributeTable, VariableAttributeDto>
  implements IVariableAttributeRepository
{
  protected getTable(tenantId: number): typeof variableAttributeTable {
    return this.useTenantSchema ? tenantVariableAttributeTable(tenantId) : variableAttributeTable;
  }

  protected toDto(row: VariableAttributeEntity): VariableAttributeDto {
    return toVariableAttributeDto(row);
  }

  private async createVariableAttributeConditions(query: VariableAttributeQuerystring) {
    const conditions = [];

    if (query.ocppConnectionName) {
      conditions.push(
        await this.stationFilter(variableAttributeTable, query.tenantId, query.ocppConnectionName),
      );
    }

    if (query.tenantId) {
      conditions.push(eq(variableAttributeTable.tenantId, query.tenantId));
    }

    // TODO implement remaining conditions as needed

    return conditions;
  }

  private async stationFilter(
    table: typeof variableAttributeTable,
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<SQL> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    return stationId === undefined ? sql`false` : eq(table.stationId, stationId);
  }

  private async resolveStationId(
    tenantId: number,
    ocppConnectionName: string,
  ): Promise<number | undefined> {
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

  private graphTables(tenantId: number) {
    return {
      attribute: this.getTable(tenantId),
      component: this.useTenantSchema ? tenantComponentTable(tenantId) : componentTable,
      variable: this.useTenantSchema ? tenantVariableTable(tenantId) : variableTable,
      evse: this.useTenantSchema ? tenantEvseTypeTable(tenantId) : evseTypeTable,
      characteristics: this.useTenantSchema
        ? tenantVariableCharacteristicsTable(tenantId)
        : variableCharacteristicsTable,
      status: this.useTenantSchema ? tenantVariableStatusTable(tenantId) : variableStatusTable,
    };
  }

  private async selectGraph(
    tenantId: number,
    query: VariableAttributeQuerystring,
  ): Promise<GraphRow[]> {
    const t = this.graphTables(tenantId);

    // The EvseType join is filtered only when the caller supplies an evse filter;
    // otherwise it is a plain LEFT JOIN, matching the conditional `evseInclude`.
    const evseFilters: SQL[] = [];
    if (query.component_evse_id) {
      evseFilters.push(eq(t.evse.id, query.component_evse_id));
    }
    if (query.component_evse_connectorId) {
      evseFilters.push(eq(t.evse.connectorId, query.component_evse_connectorId));
    }

    const where: (SQL | undefined)[] = [this.tenantFilter(t.attribute, tenantId)];

    if (query.ocppConnectionName) {
      where.push(await this.stationFilter(t.attribute, tenantId, query.ocppConnectionName));
    }
    if (query.type !== undefined) {
      where.push(
        String(query.type).toUpperCase() === 'NULL'
          ? isNull(t.attribute.type)
          : eq(t.attribute.type, query.type),
      );
    }
    if (query.value) {
      where.push(eq(t.attribute.value, query.value));
    }
    if (query.status !== undefined) {
      where.push(
        exists(
          this.db
            .select({ one: sql`1` })
            .from(t.status)
            .where(
              and(
                eq(t.status.variableAttributeId, t.attribute.id),
                eq(t.status.status, query.status),
                this.tenantFilter(t.status, tenantId),
              ),
            ),
        ),
      );
    }
    if (query.component_name) {
      where.push(eq(t.component.name, query.component_name));
    }
    if (query.component_instance) {
      where.push(eq(t.component.instance, query.component_instance));
    }
    if (query.variable_name) {
      where.push(eq(t.variable.name, query.variable_name));
    }
    if (query.variable_instance) {
      where.push(eq(t.variable.instance, query.variable_instance));
    }

    const selection = {
      attribute: t.attribute,
      component: t.component,
      variable: t.variable,
      evse: t.evse,
      characteristics: t.characteristics,
    };

    const base = this.db
      .select(selection)
      .from(t.attribute)
      .innerJoin(t.component, eq(t.attribute.componentId, t.component.id))
      .innerJoin(t.variable, eq(t.attribute.variableId, t.variable.id));

    const joined =
      evseFilters.length > 0
        ? base.innerJoin(
            t.evse,
            and(eq(t.component.evseDatabaseId, t.evse.databaseId), ...evseFilters),
          )
        : base.leftJoin(t.evse, eq(t.component.evseDatabaseId, t.evse.databaseId));

    return (await joined
      .leftJoin(t.characteristics, eq(t.characteristics.variableId, t.variable.id))
      .where(and(...where))) as GraphRow[];
  }

  private hydrate(row: GraphRow, statuses: VariableStatusEntity[]): VariableAttributeDto {
    const evse = row.evse ? toEvseTypeDto(row.evse) : undefined;
    return {
      ...toVariableAttributeDto(row.attribute),
      component: { ...toComponentDto(row.component), evse },
      variable: {
        ...toVariableDto(row.variable),
        variableCharacteristics: row.characteristics
          ? toVariableCharacteristicsDto(row.characteristics)
          : undefined,
      },
      evse,
      statuses: statuses.map(toVariableStatusDto),
    } as VariableAttributeDto;
  }

  private async readStatusesByAttributeId(
    tenantId: number,
    attributeIds: number[],
  ): Promise<Map<number, VariableStatusEntity[]>> {
    const byAttribute = new Map<number, VariableStatusEntity[]>();
    if (attributeIds.length === 0) {
      return byAttribute;
    }

    const t = this.graphTables(tenantId);
    const rows = (await this.db
      .select()
      .from(t.status)
      .where(
        and(
          inArray(t.status.variableAttributeId, attributeIds),
          this.tenantFilter(t.status, tenantId),
        ),
      )) as VariableStatusEntity[];

    for (const row of rows) {
      const key = row.variableAttributeId;
      if (key == null) continue;
      const bucket = byAttribute.get(key);
      if (bucket) bucket.push(row);
      else byAttribute.set(key, [row]);
    }
    return byAttribute;
  }

  async updateAllByQueryString(
    query: VariableAttributeQuerystring,
    value: object,
  ): Promise<VariableAttributeDto[]> {
    const rows = (await this.db
      .update(variableAttributeTable)
      .set(value)
      .where(and(...(await this.createVariableAttributeConditions(query))))
      .returning()) as VariableAttributeEntity[];

    const dtos = rows.map((row) => this.toDto(row));

    this.emit('updated', dtos);

    return dtos;
  }

  // ─── IVariableAttributeRepository methods ────────────────────────────────

  async readAllByQuerystring(
    tenantId: number,
    query: VariableAttributeQuerystring,
  ): Promise<VariableAttributeDto[]> {
    const rows = await this.selectGraph(tenantId, query);

    const statuses = await this.readStatusesByAttributeId(
      tenantId,
      rows.map((row) => row.attribute.id),
    );

    return rows.map((row) => this.hydrate(row, statuses.get(row.attribute.id) ?? []));
  }

  async deleteAllByQuerystring(
    tenantId: number,
    query: VariableAttributeQuerystring,
  ): Promise<VariableAttributeDto[]> {
    const rows = await this.selectGraph(tenantId, query);
    if (rows.length === 0) {
      return [];
    }

    const table = this.getTable(tenantId);
    const ids = rows.map((row) => row.attribute.id);
    await this.db
      .delete(table)
      .where(and(inArray(table.id, ids), this.tenantFilter(table, tenantId)));

    const dtos = rows.map((row) => this.hydrate(row, []));
    this.emit('deleted', dtos);
    return dtos;
  }
}
