// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type FrameEvent,
  FrameDirection,
  type IFrameEventProcessor,
  type MessagesEventContext,
} from '@citrineos/types';
import type { IChargingStationRepository } from '@citrineos/dal';

/**
 * Stamps `ChargingStations.latestOcppMessageTimestamp` with the time an inbound frame was received.
 */
export class LatestOcppMessageTimestampProcessor implements IFrameEventProcessor {
  readonly name = 'latest-ocpp-message-timestamp';
  // A critical failure requeues the event and re-runs every processor, including the persist insert.
  readonly critical = false;

  private readonly _chargingStationRepository: Pick<
    IChargingStationRepository,
    'updateChargingStationTimestamp'
  >;

  constructor({
    chargingStationRepository,
  }: {
    chargingStationRepository: Pick<IChargingStationRepository, 'updateChargingStationTimestamp'>;
  }) {
    this._chargingStationRepository = chargingStationRepository;
  }

  async process(event: FrameEvent, _context: MessagesEventContext): Promise<void> {
    if (event.direction !== FrameDirection.Inbound) {
      return;
    }
    await this._chargingStationRepository.updateChargingStationTimestamp(
      event.tenantId,
      event.ocppConnectionName,
      event.timestamp,
    );
  }
}
