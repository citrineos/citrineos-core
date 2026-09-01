// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ISecurityEventRepository } from '@dal/repositories/repositories.js';
import { type SecurityEventDto, OCPP2_0_1 } from '@citrineos/types';
import { and, between, eq, gte, lte } from 'drizzle-orm';
import {
  type SecurityEventEntity,
  securityEventTable,
  tenantSecurityEventTable,
} from '../../db/drizzle/schema/SecurityEvent.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row, validated by SecurityEventEntitySchema) to the
// external SecurityEventDto contract. This keeps the ORM type contained to the
// DAL layer while letting the rest of the system work against stable DTOs.
//
// Explicit<SecurityEventDto> is used so TypeScript errors if any field — including
// optional ones — is forgotten. The value may still be undefined, but it must be
// consciously declared. See ../types.ts for the full rationale.
export function toSecurityEventDto(entity: SecurityEventEntity): SecurityEventDto {
  const dto: Explicit<SecurityEventDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    type: entity.type ?? '',
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp.toISOString(),
    techInfo: entity.techInfo ?? null,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleSecurityEventRepository
  extends DrizzleRepository<typeof securityEventTable, SecurityEventDto>
  implements ISecurityEventRepository
{
  protected getTable(tenantId: number): typeof securityEventTable {
    return this.useTenantSchema ? tenantSecurityEventTable(tenantId) : securityEventTable;
  }

  protected toDto(row: SecurityEventEntity): SecurityEventDto {
    return toSecurityEventDto(row);
  }

  // ─── ISecurityEventRepository methods ────────────────────────────────────

  async createByStationId(
    tenantId: number,
    value: OCPP2_0_1.SecurityEventNotificationRequest,
    ocppConnectionName: string,
  ): Promise<SecurityEventDto> {
    // Delegates to base.insert() which handles tenantId injection and event emission.
    // OCPP delivers timestamp as ISO string; Postgres expects a Date for timestamptz.
    return this.insert(tenantId, {
      ocppConnectionName,
      type: value.type,
      timestamp: new Date(value.timestamp),
      techInfo: value.techInfo ?? null,
    });
  }

  async readByStationIdAndTimestamps(
    tenantId: number,
    ocppConnectionName: string,
    from?: Date,
    to?: Date,
  ): Promise<SecurityEventDto[]> {
    const table = this.getTable(tenantId);

    const conditions = [eq(table.ocppConnectionName, ocppConnectionName)];

    if (!this.useTenantSchema) {
      conditions.push(eq(table.tenantId, tenantId));
    }

    if (from && to) {
      conditions.push(between(table.timestamp, from, to));
    } else if (from) {
      conditions.push(gte(table.timestamp, from));
    } else if (to) {
      conditions.push(lte(table.timestamp, to));
    }

    const rows = await this.db
      .select()
      .from(table)
      .where(and(...conditions));
    return rows.map((row) => this.toDto(row as SecurityEventEntity));
  }

  async deleteByKey(tenantId: number, key: string): Promise<SecurityEventDto | undefined> {
    return this.deleteById(tenantId, Number(key));
  }
}
