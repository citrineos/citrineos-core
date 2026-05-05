// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { EventDataType } from '@dto/shared/event-data.dto';
import { NewEventData } from '@entities/event-data.entity';

/**
 * Maps a single OCPP `EventDataType` envelope from a NotifyEvent request
 * into a row for the EventData table.
 *
 * Mirrors `core/src/dal/layers/sequelize/model/VariableMonitoring/EventData.ts`.
 *
 * `componentId` and `variableId` are intentionally NOT resolved here — the
 * wire payload carries Component/Variable *names*, but EventData stores
 * FKs to the canonical component/variable rows. Callers that want the FK
 * set must do that lookup before this mapper (typically inside the
 * monitoring service); leaving them null keeps NotifyEvent persistence
 * non-blocking even when the device-model rows don't exist yet.
 */
export class EventDataMapper {
  static fromEventDataType(
    stationId: string,
    tenantId: number,
    ev: EventDataType,
    refs: { componentId?: number | null; variableId?: number | null } = {},
  ): NewEventData {
    return {
      stationId,
      tenantId,
      eventId: ev.eventId,
      timestamp: new Date(ev.timestamp),
      trigger: ev.trigger,
      cause: ev.cause ?? null,
      actualValue: ev.actualValue ?? null,
      techCode: ev.techCode ?? null,
      techInfo: ev.techInfo ?? null,
      cleared: ev.cleared ?? false,
      variableMonitoringId: ev.variableMonitoringId ?? null,
      eventNotificationType: ev.eventNotificationType,
      componentId: refs.componentId ?? null,
      variableId: refs.variableId ?? null,
    };
  }

  static fromEventDataTypes(
    stationId: string,
    tenantId: number,
    events: EventDataType[],
  ): NewEventData[] {
    return events.map((ev) => EventDataMapper.fromEventDataType(stationId, tenantId, ev));
  }
}
