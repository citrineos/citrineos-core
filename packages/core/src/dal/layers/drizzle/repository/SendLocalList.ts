// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, SendLocalListDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type SendLocalListEntity,
  sendLocalListTable,
  tenantSendLocalListTable,
} from '../schema/SendLocalList.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external SendLocalListDto contract.
export function toSendLocalListDto(entity: SendLocalListEntity): SendLocalListDto {
  const dto: Explicit<SendLocalListDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    correlationId: entity.correlationId ?? '',
    versionNumber: entity.versionNumber ?? 0,
    updateType: entity.updateType ?? '',
    // Relation, not a scalar column.
    localAuthorizationList: undefined,
    // customData is not persisted as a column.
    customData: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleSendLocalListRepository extends DrizzleRepository<
  typeof sendLocalListTable,
  SendLocalListDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof sendLocalListTable {
    return this.useTenantSchema ? tenantSendLocalListTable(tenantId) : sendLocalListTable;
  }

  protected toDto(row: SendLocalListEntity): SendLocalListDto {
    return toSendLocalListDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
