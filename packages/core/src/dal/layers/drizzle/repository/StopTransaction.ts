// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, StopTransactionDto } from '@citrineos/base';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  type StopTransactionEntity,
  stopTransactionTable,
  tenantStopTransactionTable,
} from '../schema/StopTransaction.js';
import { type Explicit } from '../types.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external StopTransactionDto contract.
export function toStopTransactionDto(entity: StopTransactionEntity): StopTransactionDto {
  const dto: Explicit<StopTransactionDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    transactionDatabaseId: entity.transactionDatabaseId,
    meterStop: entity.meterStop,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp.toISOString(),
    reason: entity.reason ?? undefined,
    // Relation not present as a scalar column.
    meterValues: undefined,
    idTokenValue: entity.idTokenValue ?? undefined,
    idTokenType: entity.idTokenType ?? undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleStopTransactionRepository extends DrizzleRepository<
  typeof stopTransactionTable,
  StopTransactionDto
> {
  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    db?: NodePgDatabase,
    useTenantSchema = false,
  ) {
    super(config, logger, db, useTenantSchema);
  }

  protected getTable(tenantId: number): typeof stopTransactionTable {
    return this.useTenantSchema ? tenantStopTransactionTable(tenantId) : stopTransactionTable;
  }

  protected toDto(row: StopTransactionEntity): StopTransactionDto {
    return toStopTransactionDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
