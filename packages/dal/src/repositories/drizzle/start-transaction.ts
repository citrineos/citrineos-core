// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { StartTransactionDto } from '@citrineos/types';
import {
  type StartTransactionEntity,
  startTransactionTable,
  tenantStartTransactionTable,
} from '../../db/drizzle/schema/start-transaction.js';
import { type Explicit } from '../../db/drizzle/types.js';
import { DrizzleRepository } from './base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external StartTransactionDto contract.
export function toStartTransactionDto(entity: StartTransactionEntity): StartTransactionDto {
  const dto: Explicit<StartTransactionDto> = {
    id: entity.id,
    ocppConnectionName: entity.ocppConnectionName,
    meterStart: entity.meterStart,
    // Drizzle returns timestamp as JS Date (mode: 'date'); DTO contract is ISO string.
    timestamp: entity.timestamp.toISOString(),
    reservationId: entity.reservationId ?? null,
    transactionDatabaseId: entity.transactionDatabaseId,
    connectorDatabaseId: entity.connectorDatabaseId,
    // Relation not present as a scalar column.
    connector: undefined,
    tenantId: entity.tenantId,
    tenant: undefined,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
  return dto;
}

export class DrizzleStartTransactionRepository extends DrizzleRepository<
  typeof startTransactionTable,
  StartTransactionDto
> {
  protected getTable(tenantId: number): typeof startTransactionTable {
    return this.useTenantSchema ? tenantStartTransactionTable(tenantId) : startTransactionTable;
  }

  protected toDto(row: StartTransactionEntity): StartTransactionDto {
    return toStartTransactionDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
