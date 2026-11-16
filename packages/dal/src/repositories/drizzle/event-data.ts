// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { EventDataDto, OCPP2_common_types } from '@citrineos/types';
import {
  type EventDataEntity,
  eventDataTable,
  tenantEventDataTable,
} from '../../db/drizzle/schema/event-data.js';
import type { IEventDataRepository } from '../repositories.js';
import { DrizzleRepository } from './base.js';
import { resolveStationIdOrThrow } from './resolve-station-id.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external EventDataDto contract.
// EventDataDto requires nested `variable` (VariableDto) and `component` (ComponentDto)
// relations that cannot be reconstructed from a flat DB row, so scalar columns are
// mapped and the result is cast. Relations are hydrated by a higher layer.
export function toEventDataDto(entity: EventDataEntity): EventDataDto {
  // TODO: map relations (variable, component)
  return {
    id: entity.id,
    stationId: entity.stationId,
    eventId: entity.eventId,
    trigger: entity.trigger,
    cause: entity.cause,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp ? entity.timestamp.toISOString() : undefined,
    actualValue: entity.actualValue,
    techCode: entity.techCode,
    techInfo: entity.techInfo,
    cleared: entity.cleared,
    transactionId: entity.transactionId,
    variableMonitoringId: entity.variableMonitoringId,
    eventNotificationType: entity.eventNotificationType,
    variableId: entity.variableId ?? undefined,
    componentId: entity.componentId ?? undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  } as EventDataDto;
}

export class DrizzleEventDataRepository
  extends DrizzleRepository<typeof eventDataTable, EventDataDto>
  implements IEventDataRepository
{
  protected getTable(tenantId: number): typeof eventDataTable {
    return this.useTenantSchema ? tenantEventDataTable(tenantId) : eventDataTable;
  }

  protected toDto(row: EventDataEntity): EventDataDto {
    return toEventDataDto(row);
  }

  async createEventDatumByComponentIdAndVariableIdAndStationId(
    tenantId: number,
    event: OCPP2_common_types.EventDataType,
    ocppConnectionName: string,
    componentId?: number,
    variableId?: number,
  ): Promise<EventDataDto> {
    const stationId = await resolveStationIdOrThrow(
      this.db,
      tenantId,
      ocppConnectionName,
      'record event data',
      this.useTenantSchema,
    );

    return await this.insert(tenantId, {
      stationId,
      variableId: variableId ?? null,
      componentId: componentId ?? null,
      eventId: event.eventId,
      trigger: event.trigger,
      cause: event.cause ?? null,
      timestamp: new Date(event.timestamp),
      actualValue: event.actualValue,
      techCode: event.techCode ?? null,
      techInfo: event.techInfo ?? null,
      cleared: event.cleared ?? null,
      transactionId: event.transactionId ?? null,
      variableMonitoringId: event.variableMonitoringId ?? null,
      eventNotificationType: event.eventNotificationType,
    });
  }
}
