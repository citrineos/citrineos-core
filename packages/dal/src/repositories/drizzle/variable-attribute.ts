// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  OCPP2_0_1,
  type ComponentDto,
  type OCPP2_common_types,
  type VariableAttributeDto,
  type VariableDto,
} from '@citrineos/types';
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
import { DrizzleComponentRepository, instanceFilter, toComponentDto } from './component.js';
import { toVariableDto } from './variable.js';
import { toEvseTypeDto } from './evse-type.js';
import { toVariableCharacteristicsDto } from './variable-characteristics.js';
import { toVariableStatusDto } from './variable-status.js';
import type { IVariableAttributeRepository } from '@dal/repositories/repositories.js';
import {
  DrizzleRepository,
  type DrizzleRepositoryDependencies,
  type DrizzleWriteContext,
} from './base.js';
import type { VariableAttributeQuerystring } from '@dal/interfaces/queries/variable-attribute.js';
import { and, desc, eq, exists, inArray, isNull, sql, type SQL } from 'drizzle-orm';

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
  private _componentRepository: DrizzleComponentRepository;

  constructor({
    config,
    logger,
    drizzleInstance,
    componentRepository,
  }: DrizzleRepositoryDependencies & {
    componentRepository: DrizzleComponentRepository;
  }) {
    super({ config, logger, drizzleInstance });

    this._componentRepository = componentRepository;
  }

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

  private async componentEvseFilter(
    tenantId: number,
    evseType: OCPP2_common_types.EVSEType | undefined | null,
  ): Promise<SQL> {
    const t = this.graphTables(tenantId);
    if (!evseType) {
      return isNull(t.component.evseDatabaseId);
    }
    const rows = (await this.db
      .select()
      .from(t.evse)
      .where(
        and(
          eq(t.evse.id, evseType.id),
          evseType.connectorId
            ? eq(t.evse.connectorId, evseType.connectorId)
            : isNull(t.evse.connectorId),
          this.tenantFilter(t.evse, tenantId),
        ),
      )
      .limit(1)) as EvseTypeEntity[];

    return rows[0] ? eq(t.component.evseDatabaseId, rows[0].databaseId) : sql`false`;
  }

  private hydrateAttributeOnly(
    attribute: VariableAttributeEntity,
    statuses: VariableStatusEntity[],
  ): VariableAttributeDto {
    return {
      ...toVariableAttributeDto(attribute),
      statuses: statuses.map(toVariableStatusDto),
    } as VariableAttributeDto;
  }

  // VariableCharacteristics is keyed on variableId,
  // so the upsert is a lookup plus one write.
  private async upsertVariableCharacteristics(
    tenantId: number,
    variableId: number,
    characteristics: OCPP2_0_1.VariableCharacteristicsType,
    ctx: DrizzleWriteContext,
  ): Promise<void> {
    const t = this.graphTables(tenantId);
    const values = {
      tenantId,
      unit: characteristics.unit ?? null,
      dataType: characteristics.dataType,
      minLimit: characteristics.minLimit != null ? String(characteristics.minLimit) : null,
      maxLimit: characteristics.maxLimit != null ? String(characteristics.maxLimit) : null,
      valuesList: characteristics.valuesList ?? null,
      supportsMonitoring: characteristics.supportsMonitoring,
      variableId,
    };

    const existing = (await ctx.db
      .select()
      .from(t.characteristics)
      .where(
        and(
          eq(t.characteristics.variableId, variableId),
          this.tenantFilter(t.characteristics, tenantId),
        ),
      )
      .limit(1)) as VariableCharacteristicsEntity[];

    if (existing[0]) {
      await ctx.db
        .update(t.characteristics)
        .set({ ...values, updatedAt: new Date() })
        .where(eq(t.characteristics.id, existing[0].id));
      return;
    }
    await ctx.db.insert(t.characteristics).values(values);
  }

  private async writeReportedAttribute(
    tenantId: number,
    stationId: number,
    component: ComponentDto,
    variable: VariableDto,
    dataType: OCPP2_0_1.DataEnumType | null,
    reported: OCPP2_common_types.VariableAttributeType,
    isoTimestamp: string,
    ctx: DrizzleWriteContext,
  ): Promise<VariableAttributeDto> {
    const table = this.getTable(tenantId);
    const type = reported.type ?? OCPP2_0_1.AttributeEnumType.Actual;
    const generatedAt = new Date(isoTimestamp);

    const existing = (await ctx.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.stationId, stationId),
          eq(table.variableId, variable.id!),
          eq(table.componentId, component.id!),
          eq(table.type, type),
          this.tenantFilter(table, tenantId),
        ),
      )
      .limit(1)) as VariableAttributeEntity[];

    if (!existing[0]) {
      return await this.insert(
        tenantId,
        {
          stationId,
          variableId: variable.id,
          componentId: component.id,
          evseDatabaseId: component.evseDatabaseId ?? null,
          type,
          dataType,
          value: reported.value ?? null,
          generatedAt,
          mutability: reported.mutability ?? OCPP2_0_1.MutabilityEnumType.ReadWrite,
          persistent: reported.persistent ?? false,
          constant: reported.constant ?? false,
        },
        ctx,
      );
    }

    const mutability = reported.mutability ?? existing[0].mutability;
    const updated = await this.updateById(
      tenantId,
      existing[0].id,
      {
        evseDatabaseId: component.evseDatabaseId ?? null,
        dataType: dataType ?? existing[0].dataType,
        type,
        // B08.FR.03: the station omits the value of WriteOnly variables, so the stored
        // one must survive rather than be overwritten with nothing.
        value:
          mutability === OCPP2_0_1.MutabilityEnumType.WriteOnly
            ? existing[0].value
            : (reported.value ?? null),
        mutability,
        persistent: reported.persistent ?? false,
        constant: reported.constant ?? false,
        generatedAt,
        updatedAt: new Date(),
      },
      ctx,
    );
    return updated ?? this.toDto(existing[0]);
  }

  private async insertStatus(
    tenantId: number,
    variableAttributeId: number,
    value: string | null | undefined,
    status: string,
    statusInfo: unknown,
    ctx: DrizzleWriteContext,
  ): Promise<void> {
    const t = this.graphTables(tenantId);
    await ctx.db.insert(t.status).values({
      tenantId,
      value: value ?? null,
      status,
      statusInfo: statusInfo as never,
      variableAttributeId,
    });
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

  async updateResultByStationId(
    tenantId: number,
    result: OCPP2_common_types.SetVariableResultType,
    ocppConnectionName: string,
    isoTimestamp: string,
    acceptedValue?: string,
  ): Promise<VariableAttributeDto | undefined> {
    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    const t = this.graphTables(tenantId);

    const found =
      stationId === undefined
        ? []
        : ((await this.db
            .select({ attribute: t.attribute })
            .from(t.attribute)
            .innerJoin(t.component, eq(t.attribute.componentId, t.component.id))
            .innerJoin(t.variable, eq(t.attribute.variableId, t.variable.id))
            .where(
              and(
                eq(t.attribute.stationId, stationId),
                eq(t.attribute.type, result.attributeType ?? OCPP2_0_1.AttributeEnumType.Actual),
                eq(t.component.name, result.component.name),
                instanceFilter(t.component.instance, result.component.instance),
                await this.componentEvseFilter(tenantId, result.component.evse),
                eq(t.variable.name, result.variable.name),
                instanceFilter(t.variable.instance, result.variable.instance),
                this.tenantFilter(t.attribute, tenantId),
              ),
            )
            .limit(1)) as { attribute: VariableAttributeEntity }[]);

    if (!found[0]) {
      throw new Error('Unable to update variable attribute status...');
    }
    const attribute = found[0].attribute;
    const accepted = result.attributeStatus === OCPP2_0_1.SetVariableStatusEnumType.Accepted;

    return await this.withAtomicWrite(async (ctx) => {
      const recordedValue =
        accepted && acceptedValue !== undefined ? acceptedValue : attribute.value;
      await ctx.db.insert(t.status).values({
        tenantId,
        value: recordedValue,
        status: result.attributeStatus,
        statusInfo: result.attributeStatusInfo,
        variableAttributeId: attribute.id,
      });

      let value = recordedValue;
      if (!accepted) {
        const lastAccepted = (await ctx.db
          .select()
          .from(t.status)
          .where(
            and(
              eq(t.status.variableAttributeId, attribute.id),
              eq(t.status.status, OCPP2_0_1.SetVariableStatusEnumType.Accepted),
              this.tenantFilter(t.status, tenantId),
            ),
          )
          .orderBy(desc(t.status.createdAt))
          .limit(1)) as VariableStatusEntity[];
        value = lastAccepted[0]?.value ?? null;
      }

      await this.updateById(
        tenantId,
        attribute.id,
        { value, generatedAt: new Date(isoTimestamp), updatedAt: new Date() },
        ctx,
      );

      const statuses = await this.readStatusesByAttributeId(tenantId, [attribute.id]);
      return this.hydrateAttributeOnly(
        { ...attribute, value, generatedAt: new Date(isoTimestamp) },
        statuses.get(attribute.id) ?? [],
      );
    });
  }

  async createOrUpdateDeviceModelByStationId(
    tenantId: number,
    value: OCPP2_common_types.ReportDataType,
    ocppConnectionName: string,
    isoTimestamp: string,
  ): Promise<VariableAttributeDto[]> {
    // Checked before anything is written, so an invalid report creates no rows.
    const types = value.variableAttribute.map(
      (attribute) => attribute.type ?? OCPP2_0_1.AttributeEnumType.Actual,
    );
    if (types.length !== new Set(types).size) {
      throw new Error('All variable attributes in ReportData must have different types.');
    }

    const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
    if (stationId === undefined) {
      throw new Error(
        `Cannot record device model data: no charging station named ` +
          `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
      );
    }

    // Outside the transaction below, matching the sequelize twin: the component and
    // variable are resolved by their own repository and committed independently.
    const [component, variable] =
      await this._componentRepository.findOrCreateEvseAndComponentAndVariable(
        tenantId,
        value.component,
        value.variable,
        ocppConnectionName,
      );

    const dataType = value.variableCharacteristics?.dataType ?? null;

    const saved = await this.withAtomicWrite(async (ctx) => {
      if (value.variableCharacteristics) {
        await this.upsertVariableCharacteristics(
          tenantId,
          variable.id!,
          value.variableCharacteristics,
          ctx,
        );
      }

      const written: VariableAttributeDto[] = [];
      for (const reported of value.variableAttribute) {
        written.push(
          await this.writeReportedAttribute(
            tenantId,
            stationId,
            component,
            variable,
            dataType,
            reported,
            isoTimestamp,
            ctx,
          ),
        );
      }
      return written;
    });

    // Hydrated so callers get the resolved relations without a reload.
    return saved.map((dto) => ({ ...dto, component, variable }) as VariableAttributeDto);
  }

  async createOrUpdateByGetVariablesResultAndStationId(
    tenantId: number,
    getVariablesResult: OCPP2_common_types.GetVariableResultType[],
    ocppConnectionName: string,
    isoTimestamp: string,
  ): Promise<VariableAttributeDto[]> {
    const saved: VariableAttributeDto[] = [];

    for (const result of getVariablesResult) {
      const accepted = result.attributeStatus === OCPP2_0_1.GetVariableStatusEnumType.Accepted;

      if (accepted) {
        const attribute = (
          await this.createOrUpdateDeviceModelByStationId(
            tenantId,
            {
              component: { ...result.component },
              variable: { ...result.variable },
              variableAttribute: [{ type: result.attributeType, value: result.attributeValue }],
            },
            ocppConnectionName,
            isoTimestamp,
          )
        )[0];

        await this.withAtomicWrite((ctx) =>
          this.insertStatus(
            tenantId,
            attribute.id!,
            result.attributeValue,
            result.attributeStatus,
            result.attributeStatusInfo,
            ctx,
          ),
        );
        saved.push(attribute);
        continue;
      }

      const stationId = await this.resolveStationId(tenantId, ocppConnectionName);
      if (stationId === undefined) {
        throw new Error(
          `Cannot record variable result: no charging station named ` +
            `'${ocppConnectionName}' exists in tenant ${tenantId}.`,
        );
      }
      const [component, variable] =
        await this._componentRepository.findOrCreateEvseAndComponentAndVariable(
          tenantId,
          result.component,
          result.variable,
          ocppConnectionName,
        );

      await this.withAtomicWrite(async (ctx) => {
        const attribute = await this.writeReportedAttribute(
          tenantId,
          stationId,
          component,
          variable,
          null,
          { type: result.attributeType, value: null },
          isoTimestamp,
          ctx,
        );
        await this.insertStatus(
          tenantId,
          attribute.id!,
          result.attributeValue,
          result.attributeStatus,
          result.attributeStatusInfo,
          ctx,
        );
      });
    }

    return saved;
  }

  async createOrUpdateBySetVariablesDataAndStationId(
    tenantId: number,
    setVariablesData: OCPP2_common_types.SetVariableDataType[],
    ocppConnectionName: string,
    isoTimestamp: string,
  ): Promise<VariableAttributeDto[]> {
    const saved: VariableAttributeDto[] = [];

    for (const data of setVariablesData) {
      const attribute = (
        await this.createOrUpdateDeviceModelByStationId(
          tenantId,
          {
            component: { ...data.component },
            variable: { ...data.variable },
            variableAttribute: [{ type: data.attributeType, value: data.attributeValue }],
          },
          ocppConnectionName,
          isoTimestamp,
        )
      )[0];
      saved.push(attribute);
    }

    return saved;
  }
}
