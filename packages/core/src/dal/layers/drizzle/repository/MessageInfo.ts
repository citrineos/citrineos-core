// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, MessageInfoDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type MessageInfoEntity,
  messageInfoTable,
  tenantMessageInfoTable,
} from '../schema/MessageInfo.js';
import { DrizzleRepository } from './Base.js';

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

export class DrizzleMessageInfoRepository extends DrizzleRepository<
  typeof messageInfoTable,
  MessageInfoDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof messageInfoTable {
    return this.useTenantSchema ? tenantMessageInfoTable(tenantId) : messageInfoTable;
  }

  protected toDto(row: MessageInfoEntity): MessageInfoDto {
    return toMessageInfoDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
