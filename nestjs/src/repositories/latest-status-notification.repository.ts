// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDb } from '@db/drizzle.module';
import {
  latestStatusNotifications,
  NewLatestStatusNotification,
} from '@entities/latest-status-notification.entity';

/**
 * Per-station pointer to the most-recent `StatusNotifications` row.
 * Mirrors `core/src/dal/repository/Location/LatestStatusNotification`.
 *
 * Legacy carries no unique constraint on stationId; we replicate that
 * by find-then-update / insert rather than `onConflictDoUpdate`.
 */
@Injectable()
export class LatestStatusNotificationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async upsert(data: NewLatestStatusNotification): Promise<void> {
    const stationId = data.stationId;
    const tenantId = data.tenantId;
    if (!stationId || tenantId === undefined) {
      await this.db.insert(latestStatusNotifications).values(data);
      return;
    }
    const existing = await this.db.query.latestStatusNotifications.findFirst({
      where: and(
        eq(latestStatusNotifications.tenantId, tenantId),
        eq(latestStatusNotifications.stationId, stationId),
      ),
    });
    if (existing) {
      await this.db
        .update(latestStatusNotifications)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(latestStatusNotifications.id, existing.id));
    } else {
      await this.db.insert(latestStatusNotifications).values(data);
    }
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(latestStatusNotifications)
      .where(
        and(
          eq(latestStatusNotifications.tenantId, tenantId),
          eq(latestStatusNotifications.stationId, stationId),
        ),
      );
  }
}
