// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, OCPPMessageDto } from '@citrineos/types';
import { and, eq, isNull, sql } from 'drizzle-orm';
import {
  type OCPPMessageEntity,
  ocppMessageTable,
  tenantOCPPMessageTable,
} from '../../db/drizzle/schema/ocpp-message.js';
import { type Explicit } from '../../db/drizzle/types.js';
import type { IOCPPMessageRepository } from '../repositories.js';
import { DrizzleRepository } from './base.js';
import { resolveStationId, resolveStationIdOrThrow } from './resolve-station-id.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external OCPPMessageDto contract.
export function toOCPPMessageDto(entity: OCPPMessageEntity): OCPPMessageDto {
  const dto: Explicit<OCPPMessageDto> = {
    id: entity.id,
    stationId: entity.stationId ?? undefined,
    correlationId: entity.correlationId ?? undefined,
    origin: entity.origin as OCPPMessageDto['origin'],
    type: entity.type as OCPPMessageDto['type'],
    // Deprecated mirror of `type`. Stored as text, so the numeric enum has to be cast back.
    state: entity.state as unknown as OCPPMessageDto['state'],
    protocol: entity.protocol as OCPPMessageDto['protocol'],
    action: entity.action ?? undefined,
    payload: entity.payload ?? undefined,
    raw: entity.raw,
    // Deprecated mirror of `payload` + `raw`.
    message: entity.message ?? undefined,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp.toISOString(),
    requestMessageId: entity.requestMessageId ?? undefined,
    requestMessage: undefined,
    responseMessages: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleOCPPMessageRepository
  extends DrizzleRepository<typeof ocppMessageTable, OCPPMessageDto>
  implements IOCPPMessageRepository
{
  protected getTable(tenantId: number): typeof ocppMessageTable {
    return this.useTenantSchema ? tenantOCPPMessageTable(tenantId) : ocppMessageTable;
  }

  protected toDto(row: OCPPMessageEntity): OCPPMessageDto {
    return toOCPPMessageDto(row);
  }

  async createOCPPMessage(
    tenantId: number,
    ocppConnectionName: string,
    message: Omit<OCPPMessageDto, 'stationId'>,
  ): Promise<OCPPMessageDto> {
    const stationId = await resolveStationIdOrThrow(
      this.db,
      tenantId,
      ocppConnectionName,
      'persist an OCPP message',
      this.useTenantSchema,
    );
    const { timestamp, ...rest } = message;
    return this.insert(tenantId, {
      ...rest,
      stationId,
      // The DTO carries an ISO string; the column is mode: 'date'.
      timestamp: new Date(timestamp),
    });
  }

  async getRequestByCorrelationId(
    tenantId: number,
    correlationId: string,
  ): Promise<OCPPMessageDto | undefined> {
    const table = this.getTable(tenantId);
    const rows = (await this.db
      .select()
      .from(table)
      .where(
        and(
          eq(table.correlationId, correlationId),
          isNull(table.requestMessageId),
          this.tenantFilter(table, tenantId),
        ),
      )
      .limit(1)) as OCPPMessageEntity[];
    return rows[0] ? toOCPPMessageDto(rows[0]) : undefined;
  }

  async hasMessageWithPayloadRequestId(
    tenantId: number,
    ocppConnectionName: string,
    action: CallAction,
    requestId: number,
  ): Promise<boolean> {
    const stationId = await resolveStationId(
      this.db,
      tenantId,
      ocppConnectionName,
      this.useTenantSchema,
    );
    if (stationId === undefined) {
      return false;
    }

    const table = this.getTable(tenantId);
    const rows = await this.db
      .select({ id: table.id })
      .from(table)
      .where(
        and(
          eq(table.stationId, stationId),
          eq(table.action, action),
          sql`${table.payload} @> ${JSON.stringify({ requestId })}::jsonb`,
          this.tenantFilter(table, tenantId),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }
}
