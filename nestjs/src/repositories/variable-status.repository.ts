// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type DrizzleDb } from '@db/drizzle.module';
import { variableStatuses, type NewVariableStatus } from '@entities/variable-status.entity';
import {
  variableMonitoringStatuses,
  type NewVariableMonitoringStatus,
} from '@entities/variable-monitoring-status.entity';

/**
 * Append-only persistence for SetVariables / GetVariables /
 * SetVariableMonitoring / ClearVariableMonitoring responses. Each
 * charger-reported result becomes its own row so a query for the
 * latest status by `(variableAttributeId, createdAt DESC)` always
 * gives the freshest answer.
 */
@Injectable()
export class VariableStatusRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async insertStatus(data: NewVariableStatus): Promise<void> {
    await this.db.insert(variableStatuses).values(data);
  }

  async insertMonitoringStatus(data: NewVariableMonitoringStatus): Promise<void> {
    await this.db.insert(variableMonitoringStatuses).values(data);
  }
}
