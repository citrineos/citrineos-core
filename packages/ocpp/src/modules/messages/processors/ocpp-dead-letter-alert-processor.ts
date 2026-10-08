// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DeadLetterReason } from '@/transport/metrics.js';
import type {
  IOcppDeadLetterProcessor,
  OcppDeadLetterReport,
} from '@/transport/queue/rabbit-mq/messages/ocpp-dead-letter-consumer.js';
import type { IChargingStationRepository } from '@citrineos/dal';
import { MessageOrigin } from '@citrineos/types';
import type { NetworkAlertService } from '@services/network-alerts/index.js';

/**
 * Reasons a message the CSMS meant for a station never reached it. The others are not about the
 * station: a poison body names no reliable station, and a handler error is a failure on our side
 * processing what the station sent.
 */
const UNDELIVERED_REASONS: ReadonlySet<string> = new Set([
  DeadLetterReason.Stale,
  DeadLetterReason.Expired,
  DeadLetterReason.Unroutable,
  DeadLetterReason.Overflow,
  DeadLetterReason.Shutdown, // The router with the pending message shut down before it could send it.
]);

/**
 * Records each message the CSMS gave up delivering to a station as a SendFailed occurrence.
 * Note: not a IMessagesEventProcessor because the dead-letter queue is separate.
 */
export class OcppDeadLetterAlertProcessor implements IOcppDeadLetterProcessor {
  readonly name = 'ocpp-dead-letter-alert';

  private readonly _networkAlertService: NetworkAlertService;
  private readonly _chargingStationRepository: Pick<
    IChargingStationRepository,
    'readChargingStationByOcppConnectionName'
  >;

  constructor({
    networkAlertService,
    chargingStationRepository,
  }: {
    networkAlertService: NetworkAlertService;
    chargingStationRepository: Pick<
      IChargingStationRepository,
      'readChargingStationByOcppConnectionName'
    >;
  }) {
    this._networkAlertService = networkAlertService;
    this._chargingStationRepository = chargingStationRepository;
  }

  async process(report: OcppDeadLetterReport): Promise<void> {
    if (
      !UNDELIVERED_REASONS.has(report.reason) ||
      report.origin !== MessageOrigin.ChargingStationManagementSystem
    ) {
      return;
    }
    const { ocppConnectionName, correlationId } = report;

    const tenantId = report.tenantId ? Number(report.tenantId) : NaN;
    if (!Number.isInteger(tenantId) || !ocppConnectionName || !correlationId) {
      return;
    }
    const station = await this._chargingStationRepository.readChargingStationByOcppConnectionName(
      tenantId,
      ocppConnectionName,
    );
    if (station?.id === undefined) {
      return;
    }

    await this._networkAlertService.recordCallFailure({
      tenantId,
      stationId: station.id,
      reason: 'SendFailed',
      origin: MessageOrigin.ChargingStationManagementSystem,
      action: report.action,
      correlationId,
      occurredAt: new Date().toISOString(),
    });
  }
}
