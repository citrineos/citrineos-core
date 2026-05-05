// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import { evses, NewEvse } from '@entities/evse.entity';

/**
 * Per-(stationId, evseId) row. Bridge between ChargingStations and the
 * per-connector rows in `Connectors`. Populated on BootNotification and
 * by REST onboarding flows.
 */
@Injectable()
export class EvseRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async upsert(data: NewEvse): Promise<void> {
    await this.db
      .insert(evses)
      .values(data)
      .onConflictDoUpdate({
        target: [evses.stationId, evses.evseId],
        set: {
          physicalReference: data.physicalReference ?? null,
          updatedAt: new Date(),
        },
      });
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(evses)
      .where(and(eq(evses.tenantId, tenantId), eq(evses.stationId, stationId)));
  }
}
