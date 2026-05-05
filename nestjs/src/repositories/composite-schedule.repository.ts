// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.module';
import { compositeSchedules, type NewCompositeSchedule } from '@entities/composite-schedule.entity';

/**
 * Append-only persistence for composite charging schedules. The CSMS
 * insert one row per accepted GetCompositeSchedule response; each row
 * is a snapshot of what the charger reported at that moment, so we
 * never update — newer requests just produce newer rows.
 */
@Injectable()
export class CompositeScheduleRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insert(data: NewCompositeSchedule): Promise<void> {
    await this.db.insert(compositeSchedules).values(data);
  }
}
