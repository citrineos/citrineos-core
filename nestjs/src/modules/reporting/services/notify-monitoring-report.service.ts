// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { MonitoringDataType } from '@dto/shared/monitoring-data.dto';
import { DeviceModelRepository } from '@repositories/device-model.repository';
import { VariableMonitoringRepository } from '@repositories/variable-monitoring.repository';

/**
 * Persist `NotifyMonitoringReport.monitor[]` into `VariableMonitorings`.
 * Mirrors the legacy `_handleNotifyMonitoringReport` ingest pass.
 *
 * Each top-level monitor entry resolves to one (component, variable)
 * pair. For each `variableMonitoring[]` entry under it, a row goes
 * into `VariableMonitorings`. The `variableAttributeId` FK points at
 * the canonical `Actual` attribute when one exists; otherwise it's
 * left null (matches the legacy fallback when the device-model row
 * hasn't landed yet).
 *
 * Components and variables are find-or-created so a monitoring report
 * arriving before NotifyReport doesn't drop on the floor.
 */
@Injectable()
export class NotifyMonitoringReportService {
  private readonly logger = new Logger(NotifyMonitoringReportService.name);

  constructor(
    private readonly deviceModel: DeviceModelRepository,
    private readonly monitorings: VariableMonitoringRepository,
  ) {}

  async ingest(tenantId: number, stationId: string, monitor: MonitoringDataType[]): Promise<void> {
    for (const entry of monitor) {
      try {
        await this.ingestEntry(tenantId, stationId, entry);
      } catch (err) {
        this.logger.warn(
          `NotifyMonitoringReport entry skipped for ${stationId}: ${(err as Error).message}`,
        );
      }
    }
  }

  private async ingestEntry(
    tenantId: number,
    stationId: string,
    entry: MonitoringDataType,
  ): Promise<void> {
    if (!entry.variableMonitoring || entry.variableMonitoring.length === 0) return;

    const { componentId } = await this.deviceModel.findOrCreateEvseAndComponent(
      tenantId,
      stationId,
      entry.component,
    );
    const variableId = await this.deviceModel.findOrCreateVariable({
      tenantId,
      name: entry.variable.name,
      instance: entry.variable.instance ?? null,
    });

    for (const m of entry.variableMonitoring) {
      await this.monitorings.insert({
        tenantId,
        stationId,
        componentId,
        variableId,
        id: typeof m.id === 'number' ? m.id : null,
        type: m.type,
        severity: m.severity,
        value: Number(m.value),
        transaction: m.transaction ?? false,
      });
    }
  }
}
