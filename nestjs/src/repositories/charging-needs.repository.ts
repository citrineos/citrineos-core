// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.module';
import { chargingNeeds, type NewChargingNeeds } from '@entities/charging-needs.entity';

/**
 * Charging-needs persistence (write-only). Each NotifyEVChargingNeeds
 * inserts a fresh row; we don't update prior rows because subsequent
 * announcements typically reflect a renegotiation rather than a delta.
 */
@Injectable()
export class ChargingNeedsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insert(data: NewChargingNeeds): Promise<void> {
    await this.db.insert(chargingNeeds).values(data);
  }
}
