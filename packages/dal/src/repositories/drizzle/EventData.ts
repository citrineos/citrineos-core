// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { EventDataDto } from '@citrineos/types';
import {
  type EventDataEntity,
  eventDataTable,
  tenantEventDataTable,
} from '../../db/drizzle/schema/EventData.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external EventDataDto contract.
// EventDataDto requires nested `variable` (VariableDto) and `component` (ComponentDto)
// relations that cannot be reconstructed from a flat DB row, so scalar columns are
// mapped and the result is cast. Relations are hydrated by a higher layer.
export function toEventDataDto(entity: EventDataEntity): EventDataDto {
  // TODO: map relations (variable, component)
  return {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
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

export class DrizzleEventDataRepository extends DrizzleRepository<
  typeof eventDataTable,
  EventDataDto
> {
  protected getTable(tenantId: number): typeof eventDataTable {
    return this.useTenantSchema ? tenantEventDataTable(tenantId) : eventDataTable;
  }

  protected toDto(row: EventDataEntity): EventDataDto {
    return toEventDataDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
