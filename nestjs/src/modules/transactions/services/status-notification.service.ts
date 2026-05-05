// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { StatusNotification16Request } from '@dto/transactions/status-notification-16.request';
import { StatusNotificationRequest } from '@dto/transactions/status-notification.request';
import { ConnectorRepository } from '@repositories/connector.repository';
import { LatestStatusNotificationRepository } from '@repositories/latest-status-notification.repository';
import { StatusNotificationRepository } from '@repositories/status-notification.repository';
import { StatusMapper } from '@mappers/transactions/status.mapper';

/**
 * StatusNotification orchestration.
 *
 * Replaces the inline write block from
 * `core/src/modules/Transactions/src/module/module.ts:_handleStatusNotification`.
 * Always writes three rows:
 *   1. `StatusNotifications` — append-only history.
 *   2. `Connectors` — upsert current per-(station, evse, connector) state.
 *   3. `LatestStatusNotifications` — upsert most-recent-by-tuple lookup.
 *
 * The service is shared by the 2.0.1 and 1.6 handlers; the 1.6 handler
 * passes its payload through the mapper's downgrade path before recording.
 */
@Injectable()
export class StatusNotificationService {
  private readonly logger = new Logger(StatusNotificationService.name);

  constructor(
    private readonly statusNotifications: StatusNotificationRepository,
    private readonly connectors: ConnectorRepository,
    private readonly latest: LatestStatusNotificationRepository,
  ) {}

  async record201(
    tenantId: number,
    stationId: string,
    payload: StatusNotificationRequest,
  ): Promise<void> {
    // OCPP 2.0.1 carries no per-connector metadata on StatusNotification.
    const history = StatusMapper.historyRowFrom201(stationId, tenantId, payload);
    await this.persist(history, stationId, {});
  }

  async record16(
    tenantId: number,
    stationId: string,
    payload: StatusNotification16Request,
  ): Promise<void> {
    const history = StatusMapper.historyRowFrom16(stationId, tenantId, payload);
    await this.persist(history, stationId, StatusMapper.extras16(payload));
  }

  private async persist(
    history: ReturnType<typeof StatusMapper.historyRowFrom201>,
    stationId: string,
    extras: Parameters<typeof StatusMapper.connectorRowFrom>[1],
  ): Promise<void> {
    try {
      // History first so we can write the FK on the latest-row pointer.
      const inserted = await this.statusNotifications.insert(history);
      await Promise.all([
        this.connectors.upsertStatus(StatusMapper.connectorRowFrom(history, extras)),
        this.latest.upsert(StatusMapper.latestRowFrom(history, inserted.id)),
      ]);
    } catch (err) {
      this.logger.error(
        `Failed to persist StatusNotification for ${stationId}: ${(err as Error).message}`,
      );
    }
  }
}
