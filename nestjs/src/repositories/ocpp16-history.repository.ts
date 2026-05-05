// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.module';
import { startTransactions, type NewStartTransaction } from '@entities/start-transaction.entity';
import { stopTransactions, type NewStopTransaction } from '@entities/stop-transaction.entity';

/**
 * OCPP 1.6 transaction-history persistence. The OCPP 2.x flow lives in
 * `TransactionEvents`; OCPP 1.6 has its own start/stop wire shape and
 * legacy persists those into the dedicated `StartTransactions` /
 * `StopTransactions` tables.
 *
 * `transactionDatabaseId` FKs both rows back to the live `Transactions`
 * row so the totalKwh recompute (`meterStop - meterStart`) can be done
 * by joining StartTransactions ↔ StopTransactions ↔ Transactions.
 */
@Injectable()
export class Ocpp16HistoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insertStart(data: NewStartTransaction): Promise<void> {
    await this.db.insert(startTransactions).values(data);
  }

  async insertStop(data: NewStopTransaction): Promise<void> {
    await this.db.insert(stopTransactions).values(data);
  }

  async findStartByTransaction(tenantId: number, transactionDatabaseId: number) {
    return this.db.query.startTransactions.findFirst({
      where: and(
        eq(startTransactions.tenantId, tenantId),
        eq(startTransactions.transactionDatabaseId, transactionDatabaseId),
      ),
    });
  }
}
