// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TransactionDto } from '@citrineos/base';
import {
  type TransactionEntity,
  transactionTable,
  tenantTransactionTable,
} from '../schema/Transaction.js';
import { DrizzleRepository } from './Base.js';

// ─── Mapper ──────────────────────────────────────────────────────────────────
// Maps a Drizzle entity (DB row) to the external TransactionDto contract.
// TransactionDto declares a required `station` (and other) relation that cannot be
// produced from a flat DB row, so the scalar columns are mapped and the object is
// returned with a pragmatic cast. DECIMAL columns come back as strings and are
// converted to numbers here.
// TODO: map relations (station, location, evse, connector, authorization, tariff,
// transactionEvents, meterValues, startTransaction, stopTransaction).
export function toTransactionDto(entity: TransactionEntity): TransactionDto {
  return {
    id: entity.id,
    transactionId: entity.transactionId,
    ocppConnectionName: entity.ocppConnectionName,
    stationId: entity.stationId,
    isActive: entity.isActive,
    locationId: entity.locationId ?? undefined,
    evseId: entity.evseId ?? undefined,
    connectorId: entity.connectorId ?? undefined,
    authorizationId: entity.authorizationId ?? undefined,
    tariffId: entity.tariffId ?? undefined,
    chargingState: entity.chargingState ?? null,
    timeSpentCharging: entity.timeSpentCharging ?? null,
    transactionLimit: entity.transactionLimit ?? null,
    meterStart: entity.meterStart != null ? Number(entity.meterStart) : null,
    totalKwh: entity.totalKwh != null ? Number(entity.totalKwh) : null,
    stoppedReason: entity.stoppedReason ?? null,
    remoteStartId: entity.remoteStartId ?? null,
    totalCost: entity.totalCost != null ? Number(entity.totalCost) : undefined,
    // Drizzle returns timestamps as JS Date (mode: 'date'); DTO contract is ISO string.
    startTime: entity.startTime?.toISOString(),
    endTime: entity.endTime?.toISOString(),
    customData: entity.customData ?? null,
    tenantId: entity.tenantId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  } as TransactionDto;
}

export class DrizzleTransactionRepository extends DrizzleRepository<
  typeof transactionTable,
  TransactionDto
> {
  protected getTable(tenantId: number): typeof transactionTable {
    return this.useTenantSchema ? tenantTransactionTable(tenantId) : transactionTable;
  }

  protected toDto(row: TransactionEntity): TransactionDto {
    return toTransactionDto(row);
  }

  // Domain query/write methods intentionally omitted — stub outline only.
}
