import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { chargingStations, NewChargingStation } from '@entities/charging-station.entity';

/**
 * Drizzle-backed repository for the ChargingStation entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class ChargingStationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findById(tenantId: number, stationId: string) {
    return this.db.query.chargingStations.findFirst({
      where: and(eq(chargingStations.id, stationId), eq(chargingStations.tenantId, tenantId)),
    });
  }

  /**
   * Create a minimal `ChargingStations` row keyed by `(stationId, tenantId)`
   * if one doesn't exist yet. Used by the websocket router on connect so
   * that the `populate_station_pk_id` trigger can resolve `stationPkId`
   * for any frame that arrives before BootNotification finishes its full
   * upsert. Mirrors legacy behaviour of materialising the row on connect
   * when `allowUnknownChargingStations` is true.
   */
  async ensureExists(tenantId: number, stationId: string, isOnline = true): Promise<void> {
    await this.db
      .insert(chargingStations)
      .values({ id: stationId, tenantId, isOnline })
      .onConflictDoNothing({
        target: [chargingStations.id, chargingStations.tenantId],
      });
  }

  async upsert(data: NewChargingStation) {
    return this.db
      .insert(chargingStations)
      .values(data)
      .onConflictDoUpdate({
        target: [chargingStations.id, chargingStations.tenantId],
        set: data,
      })
      .returning();
  }

  async setOnline(stationId: string, isOnline: boolean) {
    await this.db
      .update(chargingStations)
      .set({ isOnline, updatedAt: new Date() })
      .where(eq(chargingStations.id, stationId));
  }

  /**
   * Bump the per-station liveness timestamp. Called on every Heartbeat /
   * BootNotification — gives REST consumers a reliable "last seen" without
   * having to scan OcppMessages.
   */
  async touch(tenantId: number, stationId: string, now: Date = new Date()): Promise<void> {
    await this.db
      .update(chargingStations)
      .set({ isOnline: true, latestOcppMessageTimestamp: now, updatedAt: now })
      .where(and(eq(chargingStations.id, stationId), eq(chargingStations.tenantId, tenantId)));
  }

  /**
   * Assign or clear the station's `locationId`. Pass `null` to unlink.
   */
  async setLocationId(
    tenantId: number,
    stationId: string,
    locationId: number | null,
  ): Promise<void> {
    await this.db
      .update(chargingStations)
      .set({ locationId, updatedAt: new Date() })
      .where(and(eq(chargingStations.id, stationId), eq(chargingStations.tenantId, tenantId)));
  }
}
