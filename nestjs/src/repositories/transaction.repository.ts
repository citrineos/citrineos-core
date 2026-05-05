import { Inject, Injectable } from '@nestjs/common';
import { and, eq, ne, sql } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { transactions, NewTransaction } from '@entities/transaction.entity';
import { transactionEvents, NewTransactionEventRow } from '@entities/transaction-event.entity';

/**
 * Drizzle-backed repository for the Transaction entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class TransactionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findActive(tenantId: number, stationId: string, transactionId: string) {
    return this.db.query.transactions.findFirst({
      where: and(
        eq(transactions.stationId, stationId),
        eq(transactions.transactionId, transactionId),
        eq(transactions.tenantId, tenantId),
      ),
    });
  }

  /**
   * Locate the currently-active transaction on a (station, evseId). Used
   * by the standalone MeterValues path when the wire frame omits
   * `transactionId` but carries `evseId` — we need to attribute the
   * samples to whichever transaction is live on that EVSE.
   * Mirrors legacy `getActiveTransactionByStationIdAndEvseId`.
   */
  async findActiveByEvse(tenantId: number, stationId: string, evseId: number) {
    return this.db.query.transactions.findFirst({
      where: and(
        eq(transactions.stationId, stationId),
        eq(transactions.tenantId, tenantId),
        eq(transactions.evseId, evseId),
        eq(transactions.isActive, true),
      ),
    });
  }

  async upsert(data: NewTransaction) {
    const [row] = await this.db
      .insert(transactions)
      .values(data)
      .onConflictDoUpdate({
        target: [transactions.stationPkId, transactions.transactionId],
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row;
  }

  async end(tenantId: number, stationId: string, transactionId: string, stoppedReason: string) {
    await this.db
      .update(transactions)
      .set({ isActive: false, endTime: new Date(), stoppedReason, updatedAt: new Date() })
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.transactionId, transactionId),
          eq(transactions.tenantId, tenantId),
        ),
      );
  }

  async addEvent(data: NewTransactionEventRow) {
    await this.db.insert(transactionEvents).values(data);
  }

  async setTotalKwh(tenantId: number, stationId: string, transactionId: string, totalKwh: string) {
    await this.db
      .update(transactions)
      .set({ totalKwh, updatedAt: new Date() })
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.transactionId, transactionId),
          eq(transactions.tenantId, tenantId),
        ),
      );
  }

  async setTotalCost(
    tenantId: number,
    stationId: string,
    transactionId: string,
    totalCost: string,
  ) {
    await this.db
      .update(transactions)
      .set({ totalCost, updatedAt: new Date() })
      .where(
        and(
          eq(transactions.stationId, stationId),
          eq(transactions.transactionId, transactionId),
          eq(transactions.tenantId, tenantId),
        ),
      );
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(transactions)
      .where(and(eq(transactions.stationId, stationId), eq(transactions.tenantId, tenantId)));
  }

  async findAll(tenantId: number) {
    return this.db.select().from(transactions).where(eq(transactions.tenantId, tenantId));
  }

  /**
   * Mark every other active Transaction on this (station, evseId) as
   * stopped. Excludes `transactionId` so the just-Started row stays
   * active. Mirrors legacy "_deactivateOtherActiveTransactions" logic.
   *
   * `evseId` defaults to `IS NULL` matching when omitted (OCPP 1.6 path).
   */
  async deactivateStaleOnEvse(
    tenantId: number,
    stationId: string,
    evseId: number | null,
    keepTransactionId: string,
    stoppedReason: string,
  ): Promise<void> {
    const evseFilter =
      evseId === null ? sql`${transactions.evseId} IS NULL` : eq(transactions.evseId, evseId);
    await this.db
      .update(transactions)
      .set({
        isActive: false,
        endTime: new Date(),
        stoppedReason,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transactions.tenantId, tenantId),
          eq(transactions.stationId, stationId),
          eq(transactions.isActive, true),
          ne(transactions.transactionId, keepTransactionId),
          evseFilter,
        ),
      );
  }
}
