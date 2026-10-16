// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { WebsocketEventCreate, WebsocketEventDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import { chargingStationTable } from '../../db/drizzle/schema/charging-station.js';
import {
  type WebsocketEventEntity,
  websocketEventTable,
} from '../../db/drizzle/schema/websocket-event.js';
import { type Explicit } from '../../db/drizzle/types.js';
import type { IWebsocketEventRepository } from '../repositories.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external WebsocketEventDto contract.
export function toWebsocketEventDto(entity: WebsocketEventEntity): WebsocketEventDto {
  const dto: Explicit<WebsocketEventDto> = {
    id: entity.id,
    stationId: entity.stationId,
    serverId: entity.serverId,
    host: entity.host,
    remoteAddress: entity.remoteAddress,
    uri: entity.uri,
    type: entity.type,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp.toISOString(),
    subprotocol: entity.subprotocol,
    httpStatus: entity.httpStatus,
    wsCloseCode: entity.wsCloseCode,
    sentCode: entity.sentCode,
    closeReason: entity.closeReason,
    initiator: entity.initiator,
    source: entity.source,
    details: entity.details,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleWebsocketEventRepository
  extends DrizzleRepository<typeof websocketEventTable, WebsocketEventDto>
  implements IWebsocketEventRepository
{
  // No schema-per-tenant variant: like the network alert tables, this one is row-level only.
  protected getTable(_tenantId: number): typeof websocketEventTable {
    return websocketEventTable;
  }

  protected toDto(row: WebsocketEventEntity): WebsocketEventDto {
    return toWebsocketEventDto(row);
  }

  async createWebsocketEvent(
    tenantId: number,
    ocppConnectionName: string | undefined,
    event: Omit<WebsocketEventCreate, 'stationId' | 'tenantId'>,
  ): Promise<WebsocketEventDto> {
    const stationId = ocppConnectionName
      ? await this._resolveStationId(tenantId, ocppConnectionName)
      : undefined;
    return this.insert(tenantId, {
      ...event,
      stationId: stationId ?? null,
      timestamp: new Date(event.timestamp),
    });
  }

  private async _resolveStationId(
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
}
