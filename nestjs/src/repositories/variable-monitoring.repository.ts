// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.tokens';
import { variableMonitorings, NewVariableMonitoring } from '@entities/variable-monitoring.entity';

/**
 * Persists configured monitor rules reported by NotifyMonitoringReport.
 *
 * One row per OCPP `VariableMonitoringType` entry. The OCPP `id` field
 * isn't stored in our schema yet — duplicate inserts on re-arrival just
 * append; reconciliation is tracked in the parity roadmap.
 *
 * Promoted to the global RepositoriesModule because `SetMonitoringBase`
 * (monitoring module) and `NotifyMonitoringReport` (reporting module)
 * both need to read/write these rows.
 */
@Injectable()
export class VariableMonitoringRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insert(data: NewVariableMonitoring): Promise<void> {
    await this.db.insert(variableMonitorings).values(data);
  }

  async findByStation(tenantId: number, stationId: string) {
    return this.db
      .select()
      .from(variableMonitorings)
      .where(
        and(
          eq(variableMonitorings.tenantId, tenantId),
          eq(variableMonitorings.stationId, stationId),
        ),
      );
  }
}
