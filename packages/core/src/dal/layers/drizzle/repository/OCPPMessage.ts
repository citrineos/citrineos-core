// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, OCPPMessageDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type OCPPMessageEntity,
  ocppMessageTable,
  tenantOCPPMessageTable,
} from '../schema/OCPPMessage.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external OCPPMessageDto contract.
export function toOCPPMessageDto(entity: OCPPMessageEntity): OCPPMessageDto {
  const dto: Explicit<OCPPMessageDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName ?? '',
    stationId: entity.stationId ?? undefined,
    correlationId: entity.correlationId ?? undefined,
    origin: entity.origin as OCPPMessageDto['origin'],
    state: entity.state as unknown as OCPPMessageDto['state'],
    protocol: entity.protocol as OCPPMessageDto['protocol'],
    action: entity.action ?? '',
    message: entity.message,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp ? entity.timestamp.toISOString() : '',
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

export class DrizzleOCPPMessageRepository extends DrizzleRepository<
  typeof ocppMessageTable,
  OCPPMessageDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof ocppMessageTable {
    return this.useTenantSchema ? tenantOCPPMessageTable(tenantId) : ocppMessageTable;
  }

  protected toDto(row: OCPPMessageEntity): OCPPMessageDto {
    return toOCPPMessageDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
