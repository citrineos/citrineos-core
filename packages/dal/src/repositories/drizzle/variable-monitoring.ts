// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type CallAction,
  type OCPP2_common_types,
  type VariableMonitoringDto,
  OCPP2_0_1,
  OCPP_CallAction,
  SetMonitoringStatusEnum,
} from '@citrineos/types';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { type AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  type VariableMonitoringEntity,
  variableMonitoringTable,
  tenantVariableMonitoringTable,
} from '../../db/drizzle/schema/variable-monitoring.js';
import { componentTable, tenantComponentTable } from '../../db/drizzle/schema/component.js';
import { tenantVariableTable, variableTable } from '../../db/drizzle/schema/variable.js';
import type { IVariableMonitoringRepository } from '../repositories.js';
import { DrizzleRepository, type DrizzleRepositoryDependencies } from './base.js';
import { resolveStationId, resolveStationIdOrThrow } from './resolve-station-id.js';
import { DrizzleVariableMonitoringStatusRepository } from './variable-monitoring-status.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external VariableMonitoringDto contract.
// VariableMonitoringDto requires nested `variable` (VariableDto) and `component`
// (ComponentDto) relations that cannot be reconstructed from a flat DB row, so scalar
// columns are mapped and the result is cast. Relations are hydrated by a higher layer.
export function toVariableMonitoringDto(entity: VariableMonitoringEntity): VariableMonitoringDto {
  // TODO: map relations (variable, component)
  return {
    databaseId: entity.databaseId,
    id: entity.id,
    stationId: entity.stationId,
    transaction: entity.transaction,
    value: entity.value == null ? entity.value : Number(entity.value),
    type: entity.type,
    severity: entity.severity,
    eventNotificationType: entity.eventNotificationType,
    variableId: entity.variableId,
    componentId: entity.componentId,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  } as VariableMonitoringDto;
}

// `eventNotificationType` exists only on the OCPP 2.1 arm of the union.
function eventNotificationTypeOf(
  value: OCPP2_common_types.VariableMonitoringType,
): string | undefined {
  return 'eventNotificationType' in value ? value.eventNotificationType : undefined;
}

export class DrizzleVariableMonitoringRepository
  extends DrizzleRepository<typeof variableMonitoringTable, VariableMonitoringDto>
  implements IVariableMonitoringRepository
{
  private readonly variableMonitoringStatus: DrizzleVariableMonitoringStatusRepository;

  constructor(dependencies: DrizzleRepositoryDependencies) {
    super(dependencies);
    this.variableMonitoringStatus = new DrizzleVariableMonitoringStatusRepository(dependencies);
  }

  protected getTable(tenantId: number): typeof variableMonitoringTable {
    return this.useTenantSchema ? tenantVariableMonitoringTable(tenantId) : variableMonitoringTable;
  }

  protected toDto(row: VariableMonitoringEntity): VariableMonitoringDto {
    return toVariableMonitoringDto(row);
  }

  private getComponentTable(tenantId: number): typeof componentTable {
    return this.useTenantSchema ? tenantComponentTable(tenantId) : componentTable;
  }

  private getVariableTable(tenantId: number): typeof variableTable {
    return this.useTenantSchema ? tenantVariableTable(tenantId) : variableTable;
  }

  private async readByDatabaseId(
    tenantId: number,
    databaseId: number,
  ): Promise<VariableMonitoringDto | undefined> {
    const monitorings = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(monitorings)
      .where(and(eq(monitorings.databaseId, databaseId), this.tenantFilter(monitorings, tenantId)))
      .limit(1)) as VariableMonitoringEntity[];
    return rows[0] ? toVariableMonitoringDto(rows[0]) : undefined;
  }

  // Matches the monitoring the station is reporting on by its component and variable
  // names rather than by id, because the id is assigned only once the station accepts.
  private async findByResultIdentity(
    tenantId: number,
    stationId: number,
    result: OCPP2_common_types.SetMonitoringResultType,
  ): Promise<VariableMonitoringEntity | undefined> {
    const monitorings = this.getTable(tenantId);
    const components = this.getComponentTable(tenantId);
    const variables = this.getVariableTable(tenantId);

    const rows = (await this.db
      .select({ monitoring: monitorings })
      .from(monitorings)
      .innerJoin(
        components,
        and(
          eq(monitorings.componentId, components.id),
          eq(components.name, result.component.name),
          instanceFilter(components.instance, result.component.instance),
          this.tenantFilter(components, tenantId),
        ),
      )
      .innerJoin(
        variables,
        and(
          eq(monitorings.variableId, variables.id),
          eq(variables.name, result.variable.name),
          instanceFilter(variables.instance, result.variable.instance),
          this.tenantFilter(variables, tenantId),
        ),
      )
      .where(
        and(
          eq(monitorings.stationId, stationId),
          eq(monitorings.type, result.type),
          eq(monitorings.severity, result.severity),
          this.tenantFilter(monitorings, tenantId),
        ),
      )
      .orderBy(sql`${monitorings.id} asc nulls first`)) as {
      monitoring: VariableMonitoringEntity;
    }[];

    // TODO: Make sure this uniqueness constraint is actually enforced.
    return rows[0]?.monitoring;
  }

  private async upsertByStationIdAndMonitoringId(
    tenantId: number,
    stationId: number,
    value: OCPP2_common_types.VariableMonitoringType,
    componentId?: number,
    variableId?: number,
  ): Promise<VariableMonitoringDto> {
    return await this.withAtomicWrite(async (ctx) => {
      const monitorings = this.getTable(tenantId);
      const existing = (await ctx.db
        .select()
        .from(monitorings)
        .where(
          and(
            eq(monitorings.stationId, stationId),
            eq(monitorings.id, value.id),
            this.tenantFilter(monitorings, tenantId),
          ),
        )
        .limit(1)) as VariableMonitoringEntity[];

      const columns = {
        id: value.id,
        transaction: value.transaction,
        value: value.value.toString(),
        type: value.type,
        severity: value.severity,
        eventNotificationType: eventNotificationTypeOf(value),
      };

      if (!existing[0]) {
        const rows = (await ctx.db
          .insert(monitorings)
          .values({
            ...columns,
            tenantId,
            stationId,
            variableId: variableId ?? null,
            componentId: componentId ?? null,
          })
          .returning()) as VariableMonitoringEntity[];
        const dto = toVariableMonitoringDto(rows[0]);
        this.raise(ctx, 'created', [dto]);
        return dto;
      }

      const rows = (await ctx.db
        .update(monitorings)
        .set({ ...columns, updatedAt: new Date() })
        .where(
          and(
            eq(monitorings.databaseId, existing[0].databaseId),
            this.tenantFilter(monitorings, tenantId),
          ),
        )
        .returning()) as VariableMonitoringEntity[];
      const dto = toVariableMonitoringDto(rows[0]);
      this.raise(ctx, 'updated', [dto]);
      return dto;
    });
  }

  private async rejectByStationId(
    tenantId: number,
    action: CallAction,
    ocppConnectionName: string,
    id?: number,
  ): Promise<void> {
    const stationId = await resolveStationId(
      this.db,
      tenantId,
      ocppConnectionName,
      this.useTenantSchema,
    );
    // An unknown connection name matches no station, and so no monitorings.
    if (stationId === undefined) {
      return;
    }

    const monitorings = this.getTable(tenantId);
    const rows = (await this.db
      .select({ databaseId: monitorings.databaseId })
      .from(monitorings)
      .where(
        and(
          eq(monitorings.stationId, stationId),
          id === undefined ? undefined : eq(monitorings.id, id),
          this.tenantFilter(monitorings, tenantId),
        ),
      )) as { databaseId: number }[];

    for (const row of rows) {
      await this.variableMonitoringStatus.createVariableMonitoringStatus(
        tenantId,
        OCPP2_0_1.SetMonitoringStatusEnumType.Rejected,
        action,
        row.databaseId,
      );
    }
  }

  async createOrUpdateByMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_common_types.MonitoringDataType,
    ocppConnectionName: string,
    componentId?: number,
    variableId?: number,
  ): Promise<VariableMonitoringDto[]> {
    const stationId = await resolveStationIdOrThrow(
      this.db,
      tenantId,
      ocppConnectionName,
      'record variable monitoring',
      this.useTenantSchema,
    );

    return await Promise.all(
      value.variableMonitoring.map(
        async (variableMonitoring: OCPP2_common_types.VariableMonitoringType) => {
          const saved = await this.upsertByStationIdAndMonitoringId(
            tenantId,
            stationId,
            variableMonitoring,
            componentId,
            variableId,
          );
          await this.variableMonitoringStatus.createVariableMonitoringStatus(
            tenantId,
            SetMonitoringStatusEnum.Accepted,
            OCPP_CallAction.NotifyMonitoringReport,
            saved.databaseId,
          );
          return saved;
        },
      ),
    );
  }

  async createOrUpdateBySetMonitoringDataTypeAndStationId(
    tenantId: number,
    value: OCPP2_common_types.SetMonitoringDataType,
    ocppConnectionName: string,
    componentId?: number,
    variableId?: number,
  ): Promise<VariableMonitoringDto> {
    const stationId = await resolveStationIdOrThrow(
      this.db,
      tenantId,
      ocppConnectionName,
      'record variable monitoring',
      this.useTenantSchema,
    );

    return await this.withAtomicWrite(async (ctx) => {
      const monitorings = this.getTable(tenantId);
      const existing =
        value.id != null
          ? ((await ctx.db
              .select()
              .from(monitorings)
              .where(
                and(
                  eq(monitorings.stationId, stationId),
                  eq(monitorings.id, value.id),
                  this.tenantFilter(monitorings, tenantId),
                ),
              )
              .limit(1)) as VariableMonitoringEntity[])
          : [];

      const columns = {
        id: value.id ?? null,
        transaction: value.transaction ?? null,
        value: value.value.toString(),
        type: value.type,
        severity: value.severity,
      };

      if (!existing[0]) {
        const rows = (await ctx.db
          .insert(monitorings)
          .values({
            ...columns,
            tenantId,
            stationId,
            variableId: variableId ?? null,
            componentId: componentId ?? null,
          })
          .returning()) as VariableMonitoringEntity[];
        const dto = toVariableMonitoringDto(rows[0]);
        this.raise(ctx, 'created', [dto]);
        return dto;
      }

      const rows = (await ctx.db
        .update(monitorings)
        .set({ ...columns, updatedAt: new Date() })
        .where(
          and(
            eq(monitorings.databaseId, existing[0].databaseId),
            this.tenantFilter(monitorings, tenantId),
          ),
        )
        .returning()) as VariableMonitoringEntity[];
      const dto = toVariableMonitoringDto(rows[0]);
      this.raise(ctx, 'updated', [dto]);
      return dto;
    });
  }

  async rejectAllVariableMonitoringsByStationId(
    tenantId: number,
    action: CallAction,
    ocppConnectionName: string,
  ): Promise<void> {
    await this.rejectByStationId(tenantId, action, ocppConnectionName);
  }

  async rejectVariableMonitoringByIdAndStationId(
    tenantId: number,
    action: CallAction,
    id: number,
    ocppConnectionName: string,
  ): Promise<void> {
    await this.rejectByStationId(tenantId, action, ocppConnectionName, id);
  }

  async updateResultByStationId(
    tenantId: number,
    result: OCPP2_common_types.SetMonitoringResultType,
    ocppConnectionName: string,
  ): Promise<VariableMonitoringDto> {
    const stationId = await resolveStationId(
      this.db,
      tenantId,
      ocppConnectionName,
      this.useTenantSchema,
    );
    const saved =
      stationId === undefined
        ? undefined
        : await this.findByResultIdentity(tenantId, stationId, result);

    if (!saved) {
      throw new Error(`Unable to update set monitoring result: ${result}`);
    }

    // The Id is only returned from Charging Station when status is accepted.
    if (result.status === OCPP2_0_1.SetMonitoringStatusEnumType.Accepted && result.id) {
      const monitorings = this.getTable(tenantId);
      await this.db
        .update(monitorings)
        .set({ id: result.id, updatedAt: new Date() })
        .where(
          and(
            eq(monitorings.databaseId, saved.databaseId),
            this.tenantFilter(monitorings, tenantId),
          ),
        );
    }

    // Carries the station's own reason code, so it does not go through
    // createVariableMonitoringStatus.
    await this.variableMonitoringStatus.createStatus(tenantId, {
      status: result.status,
      statusInfo: result.statusInfo,
      variableMonitoringId: saved.databaseId,
    });

    const reloaded = await this.readByDatabaseId(tenantId, saved.databaseId);
    if (!reloaded) {
      throw new Error(`Unable to update set monitoring result: ${result}`);
    }
    return reloaded;
  }
}

// Sequelize matches an absent instance against NULL, so an empty string and a
// missing value both have to find the rows stored with no instance.
function instanceFilter(column: AnyPgColumn, instance?: string | null) {
  return instance ? eq(column, instance) : isNull(column);
}
