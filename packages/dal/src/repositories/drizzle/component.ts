// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ComponentDto, VariableDto } from '@citrineos/types';
import { OCPP2_0_1, type OCPP2_common_types } from '@citrineos/types';
import { and, eq, isNull, sql, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import {
  chargingStationTable,
  tenantChargingStationTable,
} from '../../db/drizzle/schema/charging-station.js';
import {
  type ComponentEntity,
  componentTable,
  tenantComponentTable,
} from '../../db/drizzle/schema/component.js';
import {
  componentVariableTable,
  tenantComponentVariableTable,
} from '../../db/drizzle/schema/component-variable.js';
import {
  type EvseTypeEntity,
  evseTypeTable,
  tenantEvseTypeTable,
} from '../../db/drizzle/schema/evse-type.js';
import {
  tenantVariableTable,
  type VariableEntity,
  variableTable,
} from '../../db/drizzle/schema/variable.js';
import {
  tenantVariableAttributeTable,
  variableAttributeTable,
} from '../../db/drizzle/schema/variable-attribute.js';
import {
  tenantVariableCharacteristicsTable,
  type VariableCharacteristicsEntity,
  variableCharacteristicsTable,
} from '../../db/drizzle/schema/variable-characteristics.js';
import { type Explicit } from '../../db/drizzle/types.js';
import type { VariableWithCharacteristics } from '@dal/interfaces/projections/variable-with-characteristics.js';
import type { IComponentRepository } from '@dal/repositories/repositories.js';
import { DrizzleRepository, type DrizzleWriteContext } from './base.js';
import { toEvseTypeDto } from './evse-type.js';
import { toVariableDto } from './variable.js';
import { toVariableCharacteristicsDto } from './variable-characteristics.js';

// Seeded against every newly created component that arrives at a live connection.
const DEFAULT_COMPONENT_VARIABLE_NAMES = ['Present', 'Available', 'Enabled'];

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external ComponentDto contract.
export function toComponentDto(entity: ComponentEntity): ComponentDto {
  const dto: Explicit<ComponentDto> = {
    id: entity.id,
    name: entity.name ?? '',
    instance: entity.instance ?? null,
    evseDatabaseId: entity.evseDatabaseId ?? null,
    // Relation fields are not present as scalar columns.
    evse: undefined,
    variables: undefined,
    customData: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

function instanceFilter(column: PgColumn, instance?: string | null): SQL {
  return instance ? eq(column, instance) : isNull(column);
}

export class DrizzleComponentRepository
  extends DrizzleRepository<typeof componentTable, ComponentDto>
  implements IComponentRepository
{
  protected getTable(tenantId: number): typeof componentTable {
    return this.useTenantSchema ? tenantComponentTable(tenantId) : componentTable;
  }

  protected toDto(row: ComponentEntity): ComponentDto {
    return toComponentDto(row);
  }

  private getVariableTable(tenantId: number): typeof variableTable {
    return this.useTenantSchema ? tenantVariableTable(tenantId) : variableTable;
  }

  private getEvseTypeTable(tenantId: number): typeof evseTypeTable {
    return this.useTenantSchema ? tenantEvseTypeTable(tenantId) : evseTypeTable;
  }

  private getComponentVariableTable(tenantId: number): typeof componentVariableTable {
    return this.useTenantSchema ? tenantComponentVariableTable(tenantId) : componentVariableTable;
  }

  private getVariableAttributeTable(tenantId: number): typeof variableAttributeTable {
    return this.useTenantSchema ? tenantVariableAttributeTable(tenantId) : variableAttributeTable;
  }

  private getVariableCharacteristicsTable(tenantId: number): typeof variableCharacteristicsTable {
    return this.useTenantSchema
      ? tenantVariableCharacteristicsTable(tenantId)
      : variableCharacteristicsTable;
  }

  private getChargingStationTable(tenantId: number): typeof chargingStationTable {
    return this.useTenantSchema ? tenantChargingStationTable(tenantId) : chargingStationTable;
  }

  private async resolveStationIdOrThrow(
    tenantId: number,
    ocppConnectionName: string,
    ctx: DrizzleWriteContext,
  ): Promise<number> {
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

    const stationId = rows[0]?.id;
    if (stationId === undefined) {
      throw new Error(
        `Cannot create variable attribute: no charging station named ` +
          `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
      );
    }
    return stationId;
  }

  private async findOrCreateEvseType(
    tenantId: number,
    evseType: OCPP2_common_types.EVSEType,
    ctx: DrizzleWriteContext,
  ): Promise<EvseTypeEntity> {
    const table = this.getEvseTypeTable(tenantId);
    const match = and(
      eq(table.id, evseType.id),
      evseType.connectorId
        ? eq(table.connectorId, evseType.connectorId)
        : isNull(table.connectorId),
      this.tenantFilter(table, tenantId),
    );

    const existing = (await ctx.db.select().from(table).where(match).limit(1)) as EvseTypeEntity[];
    if (existing[0]) {
      return existing[0];
    }

    const inserted = (await ctx.db
      .insert(table)
      .values({ tenantId, id: evseType.id, connectorId: evseType.connectorId ?? null })
      .onConflictDoNothing()
      .returning()) as EvseTypeEntity[];
    if (inserted[0]) {
      return inserted[0];
    }

    const raced = (await ctx.db.select().from(table).where(match).limit(1)) as EvseTypeEntity[];
    if (!raced[0]) {
      throw new Error(
        `Failed to find or create EVSE type ${evseType.id}/${evseType.connectorId ?? 'null'} ` +
          `in tenant ${tenantId}.`,
      );
    }
    return raced[0];
  }

  private async findOrCreateVariable(
    tenantId: number,
    variableType: OCPP2_common_types.VariableType,
    ctx: DrizzleWriteContext,
  ): Promise<VariableEntity> {
    const table = this.getVariableTable(tenantId);
    const match = and(
      eq(table.name, variableType.name),
      instanceFilter(table.instance, variableType.instance),
      this.tenantFilter(table, tenantId),
    );

    const existing = (await ctx.db.select().from(table).where(match).limit(1)) as VariableEntity[];
    if (existing[0]) {
      return existing[0];
    }

    const inserted = (await ctx.db
      .insert(table)
      .values({ tenantId, name: variableType.name, instance: variableType.instance ?? null })
      .onConflictDoNothing()
      .returning()) as VariableEntity[];
    if (inserted[0]) {
      return inserted[0];
    }

    const raced = (await ctx.db.select().from(table).where(match).limit(1)) as VariableEntity[];
    if (!raced[0]) {
      throw new Error(
        `Failed to find or create variable '${variableType.name}' in tenant ${tenantId}.`,
      );
    }
    return raced[0];
  }

  private async linkComponentVariable(
    tenantId: number,
    componentId: number,
    variableId: number,
    ctx: DrizzleWriteContext,
  ): Promise<void> {
    // Primary key is (componentId, variableId), so a duplicate link is a no-op.
    await ctx.db
      .insert(this.getComponentVariableTable(tenantId))
      .values({ tenantId, componentId, variableId })
      .onConflictDoNothing();
  }

  private async seedDefaultVariableAttributes(
    tenantId: number,
    componentId: number,
    evseDatabaseId: number | null,
    ocppConnectionName: string,
    ctx: DrizzleWriteContext,
  ): Promise<void> {
    const stationId = await this.resolveStationIdOrThrow(tenantId, ocppConnectionName, ctx);
    const attributes = this.getVariableAttributeTable(tenantId);

    for (const name of DEFAULT_COMPONENT_VARIABLE_NAMES) {
      const variable = await this.findOrCreateVariable(tenantId, { name }, ctx);
      await this.linkComponentVariable(tenantId, componentId, variable.id, ctx);

      await ctx.db.insert(attributes).values({
        tenantId,
        stationId,
        variableId: variable.id,
        componentId,
        evseDatabaseId,
        dataType: OCPP2_0_1.DataEnumType.boolean,
        value: 'true',
        mutability: OCPP2_0_1.MutabilityEnumType.ReadOnly,
      });
    }
  }

  private async findOrCreateComponent(
    tenantId: number,
    componentType: OCPP2_common_types.ComponentType,
    ocppConnectionName: string | undefined,
    ctx: DrizzleWriteContext,
  ): Promise<ComponentDto> {
    const evse = componentType.evse
      ? await this.findOrCreateEvseType(tenantId, componentType.evse, ctx)
      : undefined;

    const table = this.getTable(tenantId);
    const match = and(
      eq(table.name, componentType.name),
      instanceFilter(table.instance, componentType.instance),
      evse ? eq(table.evseDatabaseId, evse.databaseId) : isNull(table.evseDatabaseId),
      this.tenantFilter(table, tenantId),
    );

    let created = false;
    let row: ComponentEntity | undefined = (
      (await ctx.db.select().from(table).where(match).limit(1)) as ComponentEntity[]
    )[0];

    if (!row) {
      const inserted = (await ctx.db
        .insert(table)
        .values({
          tenantId,
          name: componentType.name,
          instance: componentType.instance ?? null,
          evseDatabaseId: evse?.databaseId ?? null,
        })
        .onConflictDoNothing()
        .returning()) as ComponentEntity[];

      if (inserted[0]) {
        row = inserted[0];
        created = true;
      } else {
        row = ((await ctx.db.select().from(table).where(match).limit(1)) as ComponentEntity[])[0];
      }
    }

    if (!row) {
      throw new Error(
        `Failed to find or create component '${componentType.name}' in tenant ${tenantId}.`,
      );
    }

    if (created && ocppConnectionName) {
      await this.seedDefaultVariableAttributes(
        tenantId,
        row.id,
        evse?.databaseId ?? null,
        ocppConnectionName,
        ctx,
      );
    }

    return this.toDto(row);
  }

  private async evseFilter(
    tenantId: number,
    table: typeof componentTable,
    evseType: OCPP2_common_types.EVSEType | undefined | null,
  ): Promise<SQL> {
    if (!evseType) {
      return isNull(table.evseDatabaseId);
    }
    const evseTypes = this.getEvseTypeTable(tenantId);
    const rows = (await this.db
      .select()
      .from(evseTypes)
      .where(
        and(
          eq(evseTypes.id, evseType.id),
          evseType.connectorId
            ? eq(evseTypes.connectorId, evseType.connectorId)
            : isNull(evseTypes.connectorId),
          this.tenantFilter(evseTypes, tenantId),
        ),
      )
      .limit(1)) as EvseTypeEntity[];

    return rows[0] ? eq(table.evseDatabaseId, rows[0].databaseId) : sql`false`;
  }

  // ─── IComponentRepository methods ────────────────────────────────────────

  async findComponentAndVariable(
    tenantId: number,
    componentType: OCPP2_common_types.ComponentType,
    variableType: OCPP2_common_types.VariableType,
  ): Promise<[ComponentDto | undefined, VariableWithCharacteristics | undefined]> {
    const components = this.getTable(tenantId);
    const componentRows = (await this.db
      .select()
      .from(components)
      .where(
        and(
          eq(components.name, componentType.name),
          instanceFilter(components.instance, componentType.instance),
          await this.evseFilter(tenantId, components, componentType.evse),
          this.tenantFilter(components, tenantId),
        ),
      )
      .limit(1)) as ComponentEntity[];

    const variables = this.getVariableTable(tenantId);
    const variableRows = (await this.db
      .select()
      .from(variables)
      .where(
        and(
          eq(variables.name, variableType.name),
          instanceFilter(variables.instance, variableType.instance),
          this.tenantFilter(variables, tenantId),
        ),
      )
      .limit(1)) as VariableEntity[];

    const component = componentRows[0] ? this.toDto(componentRows[0]) : undefined;
    if (!variableRows[0]) {
      return [component, undefined];
    }

    const characteristics = this.getVariableCharacteristicsTable(tenantId);
    const characteristicsRows = (await this.db
      .select()
      .from(characteristics)
      .where(
        and(
          eq(characteristics.variableId, variableRows[0].id),
          this.tenantFilter(characteristics, tenantId),
        ),
      )
      .limit(1)) as VariableCharacteristicsEntity[];

    return [
      component,
      {
        ...toVariableDto(variableRows[0]),
        variableCharacteristics: characteristicsRows[0]
          ? toVariableCharacteristicsDto(characteristicsRows[0])
          : undefined,
      },
    ];
  }

  async findConnectorComponentsForAvailabilityState(
    tenantId: number,
    evseId: number,
    connectorId: number,
  ): Promise<ComponentDto[]> {
    const components = this.getTable(tenantId);
    const evseTypes = this.getEvseTypeTable(tenantId);
    const links = this.getComponentVariableTable(tenantId);
    const variables = this.getVariableTable(tenantId);

    // Every join is INNER: A component without a matching EVSE or
    // without the AvailabilityState variable must not appear.
    const rows = (await this.db
      .select({ component: components, evse: evseTypes, variable: variables })
      .from(components)
      .innerJoin(
        evseTypes,
        and(
          eq(components.evseDatabaseId, evseTypes.databaseId),
          eq(evseTypes.id, evseId),
          eq(evseTypes.connectorId, connectorId),
        ),
      )
      .innerJoin(links, eq(links.componentId, components.id))
      .innerJoin(
        variables,
        and(eq(links.variableId, variables.id), eq(variables.name, 'AvailabilityState')),
      )
      .where(
        and(eq(components.name, 'Connector'), this.tenantFilter(components, tenantId)),
      )) as Array<{
      component: ComponentEntity;
      evse: EvseTypeEntity;
      variable: VariableEntity;
    }>;

    const byComponentId = new Map<number, ComponentDto>();
    for (const row of rows) {
      const existing = byComponentId.get(row.component.id);
      if (existing) {
        existing.variables?.push(toVariableDto(row.variable));
        continue;
      }
      byComponentId.set(row.component.id, {
        ...this.toDto(row.component),
        evse: toEvseTypeDto(row.evse),
        variables: [toVariableDto(row.variable)],
      });
    }

    return [...byComponentId.values()];
  }

  async findOrCreateEvseAndComponent(
    tenantId: number,
    componentType: OCPP2_common_types.ComponentType,
    ocppConnectionName?: string,
  ): Promise<ComponentDto> {
    return await this.withAtomicWrite((ctx) =>
      this.findOrCreateComponent(tenantId, componentType, ocppConnectionName, ctx),
    );
  }

  async findOrCreateEvseAndComponentAndVariable(
    tenantId: number,
    componentType: OCPP2_common_types.ComponentType,
    variableType: OCPP2_common_types.VariableType,
    ocppConnectionName?: string,
  ): Promise<[ComponentDto, VariableDto]> {
    return await this.withAtomicWrite(async (ctx) => {
      const component = await this.findOrCreateComponent(
        tenantId,
        componentType,
        ocppConnectionName,
        ctx,
      );
      const variable = await this.findOrCreateVariable(tenantId, variableType, ctx);
      await this.linkComponentVariable(tenantId, component.id!, variable.id, ctx);

      return [component, toVariableDto(variable)];
    });
  }
}
