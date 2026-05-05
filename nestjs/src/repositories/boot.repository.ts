// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DrizzleDb, DRIZZLE } from '@db/drizzle.module';
import { boots, NewBoot } from '@entities/boot.entity';

/**
 * Drizzle-backed repository for the Boot entity.
 * Centralises every read/write path for this table so handlers and
 * services don’t reach for the Drizzle client directly.
 */
@Injectable()
export class BootRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findByStationId(tenantId: number, stationId: string) {
    return this.db.query.boots.findFirst({
      where: and(eq(boots.id, stationId), eq(boots.tenantId, tenantId)),
    });
  }

  async upsert(data: NewBoot) {
    return this.db
      .insert(boots)
      .values(data)
      .onConflictDoUpdate({ target: boots.id, set: data })
      .returning();
  }

  /**
   * Clear the `getBaseReportOnPending` flag once we've ingested a
   * response NotifyReport. Mirrors the legacy "advance Boot Pending sub-state"
   * write-back.
   */
  async setGetBaseReportOnPending(
    tenantId: number,
    stationId: string,
    value: boolean,
  ): Promise<void> {
    await this.db
      .update(boots)
      .set({ getBaseReportOnPending: value, updatedAt: new Date() })
      .where(and(eq(boots.id, stationId), eq(boots.tenantId, tenantId)));
  }

  /**
   * Replace `variablesRejectedOnLastBoot` with the set the charger
   * rejected on the most recent SetVariables follow-up. Empty array
   * means "no rejections; the next BootNotification can promote to
   * Accepted".
   */
  async setVariablesRejectedOnLastBoot(
    tenantId: number,
    stationId: string,
    rejected: unknown[],
  ): Promise<void> {
    await this.db
      .update(boots)
      .set({ variablesRejectedOnLastBoot: rejected, updatedAt: new Date() })
      .where(and(eq(boots.id, stationId), eq(boots.tenantId, tenantId)));
  }
}
