// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IChargingStationRepository, IOCPPMessageRepository } from '@citrineos/dal';
import {
  type CallEvent,
  CallEventOutcome,
  type ICallEventProcessor,
  MessageOrigin,
  type MessagesEventContext,
  type OcppCallFailureReason,
} from '@citrineos/types';
import type { NetworkAlertService } from '@services/network-alerts/index.js';

const REASON_BY_OUTCOME: Record<CallEventOutcome, Exclude<OcppCallFailureReason, 'Slow'>> = {
  [CallEventOutcome.Timeout]: 'Timeout',
  [CallEventOutcome.SendFailed]: 'SendFailed',
};

export class CallOutcomeAlertProcessor implements ICallEventProcessor {
  readonly name = 'call-outcome-alert';

  readonly critical = true;

  private readonly _networkAlertService: NetworkAlertService;
  private readonly _chargingStationRepository: Pick<
    IChargingStationRepository,
    'readChargingStationByOcppConnectionName'
  >;
  private readonly _ocppMessageRepository: Pick<
    IOCPPMessageRepository,
    'getRequestByCorrelationId'
  >;

  constructor({
    networkAlertService,
    chargingStationRepository,
    ocppMessageRepository,
  }: {
    networkAlertService: NetworkAlertService;
    chargingStationRepository: Pick<
      IChargingStationRepository,
      'readChargingStationByOcppConnectionName'
    >;
    ocppMessageRepository: Pick<IOCPPMessageRepository, 'getRequestByCorrelationId'>;
  }) {
    this._networkAlertService = networkAlertService;
    this._chargingStationRepository = chargingStationRepository;
    this._ocppMessageRepository = ocppMessageRepository;
  }

  async process(event: CallEvent, _context: MessagesEventContext): Promise<void> {
    const station = await this._chargingStationRepository.readChargingStationByOcppConnectionName(
      event.tenantId,
      event.ocppConnectionName,
    );
    if (station?.id === undefined) {
      return;
    }
    // A Call that was never sent left no frame behind to reference.
    const call =
      event.outcome === CallEventOutcome.Timeout
        ? await this._ocppMessageRepository.getRequestByCorrelationId(
            event.tenantId,
            event.correlationId,
          )
        : undefined;

    await this._networkAlertService.recordCallFailure({
      tenantId: event.tenantId,
      stationId: station.id,
      reason: REASON_BY_OUTCOME[event.outcome],
      origin: MessageOrigin.ChargingStationManagementSystem,
      action: event.action,
      correlationId: event.correlationId,
      occurredAt: event.timestamp,
      ocppMessageId: call?.id,
    });
  }
}
