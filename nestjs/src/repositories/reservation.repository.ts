import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { reservations, NewReservation } from '@entities/reservation.entity';

/**
 * Drizzle-backed repository for the Reservation entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class ReservationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async upsert(data: NewReservation) {
    const [row] = await this.db
      .insert(reservations)
      .values(data)
      .onConflictDoUpdate({
        target: [reservations.id, reservations.stationId],
        set: { ...data, updatedAt: new Date() },
      })
      .returning();
    return row;
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(reservations)
      .where(and(eq(reservations.stationId, stationId), eq(reservations.tenantId, tenantId)));
  }

  async findByReservationId(tenantId: number, stationId: string, reservationId: number) {
    return this.db.query.reservations.findFirst({
      where: and(
        eq(reservations.tenantId, tenantId),
        eq(reservations.stationId, stationId),
        eq(reservations.id, reservationId),
      ),
    });
  }

  /**
   * Mark a reservation inactive — used by 1.6 StartTransaction when the
   * incoming `reservationId` is being consumed. Mirrors legacy
   * `TransactionService.deactivateReservation`: when `terminatedByTransaction`
   * is provided, the consuming transactionId is stamped on the row for
   * ops dashboards.
   */
  async deactivateById(
    tenantId: number,
    stationId: string,
    reservationId: number,
    terminatedByTransaction?: string,
  ): Promise<void> {
    await this.db
      .update(reservations)
      .set({
        isActive: false,
        ...(terminatedByTransaction ? { terminatedByTransaction } : {}),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(reservations.tenantId, tenantId),
          eq(reservations.stationId, stationId),
          eq(reservations.id, reservationId),
        ),
      );
  }
}
