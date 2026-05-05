import { Inject, Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { chargingProfiles, NewChargingProfile } from '@entities/charging-profile.entity';

/**
 * Drizzle-backed repository for the ChargingProfile entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class ChargingProfileRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insert(data: NewChargingProfile) {
    const [row] = await this.db.insert(chargingProfiles).values(data).returning();
    return row;
  }

  /**
   * Upsert keyed on the OCPP natural key
   * `(tenantId, stationId, evseId, id, stackLevel)` where `id` is the
   * wire-level chargingProfileId. Mirrors legacy
   * `createOrUpdateChargingProfile` so re-reported profiles update the
   * existing row instead of accumulating duplicates.
   */
  async upsertByOcppKey(data: NewChargingProfile) {
    const existing = await this.db.query.chargingProfiles.findFirst({
      where: and(
        eq(chargingProfiles.tenantId, data.tenantId ?? 1),
        data.stationId
          ? eq(chargingProfiles.stationId, data.stationId)
          : isNull(chargingProfiles.stationId),
        data.evseId === null || data.evseId === undefined
          ? isNull(chargingProfiles.evseId)
          : eq(chargingProfiles.evseId, data.evseId),
        data.id === null || data.id === undefined
          ? isNull(chargingProfiles.id)
          : eq(chargingProfiles.id, data.id),
        data.stackLevel === null || data.stackLevel === undefined
          ? isNull(chargingProfiles.stackLevel)
          : eq(chargingProfiles.stackLevel, data.stackLevel),
      ),
    });
    if (existing) {
      const [row] = await this.db
        .update(chargingProfiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(chargingProfiles.databaseId, existing.databaseId))
        .returning();
      return row;
    }
    return this.insert(data);
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(chargingProfiles)
      .where(
        and(eq(chargingProfiles.stationId, stationId), eq(chargingProfiles.tenantId, tenantId)),
      );
  }

  async deactivateByStation(tenantId: number, stationId: string) {
    await this.db
      .update(chargingProfiles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(eq(chargingProfiles.stationId, stationId), eq(chargingProfiles.tenantId, tenantId)),
      );
  }
}
