// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IMessageInfoRepository } from '@dal/repositories/repositories.js';
import { OCPP2_0_1, type MessageInfoDto } from '@citrineos/types';
import { and, eq } from 'drizzle-orm';
import {
  type MessageInfoEntity,
  messageInfoTable,
  tenantMessageInfoTable,
} from '../../db/drizzle/schema/message-info.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external MessageInfoDto contract.
// `display` is a required relation (ComponentDto) that cannot be produced from a
// flat row, so the scalar columns are cast to the DTO shape. See spec fallback.
export function toMessageInfoDto(entity: MessageInfoEntity): MessageInfoDto {
  return {
    databaseId: entity.databaseId,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    id: entity.id as number,
    priority: entity.priority as MessageInfoDto['priority'],
    state: (entity.state as MessageInfoDto['state']) ?? null,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    startDateTime: entity.startDateTime ? entity.startDateTime.toISOString() : null,
    endDateTime: entity.endDateTime ? entity.endDateTime.toISOString() : null,
    transactionId: entity.transactionId ?? null,
    message: entity.message,
    active: entity.active ?? false,
    displayComponentId: entity.displayComponentId ?? null,
    tenantId: entity.tenantId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    // TODO: map `display` relation (ComponentDto) in a later pass.
  } as MessageInfoDto;
}

export class DrizzleMessageInfoRepository
  extends DrizzleRepository<typeof messageInfoTable, MessageInfoDto>
  implements IMessageInfoRepository
{
  protected getTable(tenantId: number): typeof messageInfoTable {
    return this.useTenantSchema ? tenantMessageInfoTable(tenantId) : messageInfoTable;
  }

  protected toDto(row: MessageInfoEntity): MessageInfoDto {
    return toMessageInfoDto(row);
  }

  // ─── IMessageInfoRepository methods ──────────────────────────────────────

  async deactivateAllByStationId(tenantId: number, ocppConnectionName: string): Promise<void> {
    const table = this.getTable(tenantId);
    const conditions = [eq(table.ocppConnectionName, ocppConnectionName), eq(table.active, true)];
    if (!this.useTenantSchema) {
      conditions.push(eq(table.tenantId, tenantId));
    }
    await this.db
      .update(table)
      .set({ active: false })
      .where(and(...conditions));
  }

  async createOrUpdateByMessageInfoTypeAndStationId(
    tenantId: number,
    message: OCPP2_0_1.MessageInfoType,
    ocppConnectionName: string,
    componentId?: number,
  ): Promise<MessageInfoDto> {
    const table = this.getTable(tenantId);

    // Upsert key mirrors the unique index (ocppConnectionName, id, tenantId). The Sequelize
    // impl omits tenantId in its lookup; including it here is safer and matches the constraint.
    const conditions = [
      eq(table.ocppConnectionName, ocppConnectionName),
      eq(table.id, message.id),
    ];
    if (!this.useTenantSchema) {
      conditions.push(eq(table.tenantId, tenantId));
    }
    const existing = await this.db
      .select({ databaseId: table.databaseId })
      .from(table)
      .where(and(...conditions))
      .limit(1);

    const values = {
      ocppConnectionName,
      displayComponentId: componentId ?? null,
      id: message.id,
      priority: message.priority,
      state: message.state ?? null,
      // timestamptz mode:'date' expects Date; OCPP delivers ISO strings.
      startDateTime: message.startDateTime ? new Date(message.startDateTime) : null,
      endDateTime: message.endDateTime ? new Date(message.endDateTime) : null,
      transactionId: message.transactionId ?? null,
      message: message.message,
      active: true,
    };

    if (existing[0]) {
      return (await this.updateById(tenantId, existing[0].databaseId, values))!;
    }
    return this.insert(tenantId, values);
  }
}
