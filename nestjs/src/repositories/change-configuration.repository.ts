// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.module';
import {
  changeConfigurations,
  type NewChangeConfiguration,
} from '@entities/change-configuration.entity';

/**
 * OCPP 1.6 ChangeConfiguration history. Upsert-keyed by
 * `(stationId, key, tenantId)` so the live row always reflects the
 * charger's most-recent value for that key.
 */
@Injectable()
export class ChangeConfigurationRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async upsert(data: NewChangeConfiguration): Promise<void> {
    await this.db
      .insert(changeConfigurations)
      .values(data)
      .onConflictDoUpdate({
        target: [
          changeConfigurations.stationId,
          changeConfigurations.key,
          changeConfigurations.tenantId,
        ],
        set: { value: data.value, readonly: data.readonly, updatedAt: new Date() },
      });
  }

  async findByStationKey(tenantId: number, stationId: string, key: string) {
    return this.db.query.changeConfigurations.findFirst({
      where: and(
        eq(changeConfigurations.tenantId, tenantId),
        eq(changeConfigurations.stationId, stationId),
        eq(changeConfigurations.key, key),
      ),
    });
  }
}
