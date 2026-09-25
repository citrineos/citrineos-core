// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IChargingStationRepository } from '@citrineos/dal';
import { FrameDirection, MessageOrigin } from '@citrineos/types';
import { LatestOcppMessageTimestampProcessor } from '@modules/messages/processors/latest-ocpp-message-timestamp-processor.js';
import { aFrameEvent } from '@test/providers/messages-event-provider.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('LatestOcppMessageTimestampProcessor', () => {
  let updateChargingStationTimestamp: ReturnType<
    typeof vi.fn<IChargingStationRepository['updateChargingStationTimestamp']>
  >;
  let processor: LatestOcppMessageTimestampProcessor;

  beforeEach(() => {
    updateChargingStationTimestamp = vi
      .fn<IChargingStationRepository['updateChargingStationTimestamp']>()
      .mockResolvedValue(undefined);
    processor = new LatestOcppMessageTimestampProcessor({
      chargingStationRepository: { updateChargingStationTimestamp },
    });
  });

  it('should be best-effort, so a failed stamp cannot requeue the event and re-run the persist insert', () => {
    expect(processor.critical).toBe(false);
    expect(processor.name).toBe('latest-ocpp-message-timestamp');
  });

  it('should stamp the station with the time the inbound frame was received', async () => {
    await processor.process(
      aFrameEvent({
        tenantId: 3,
        ocppConnectionName: 'CS009',
        timestamp: '2026-09-24T10:00:00.000Z',
      }),
      {},
    );

    expect(updateChargingStationTimestamp).toHaveBeenCalledWith(
      3,
      'CS009',
      '2026-09-24T10:00:00.000Z',
    );
  });

  it('should stamp unparsed inbound frames too, since the station still communicated', async () => {
    await processor.process(
      aFrameEvent({ parsed: false, payload: undefined, frame: undefined }),
      {},
    );

    expect(updateChargingStationTimestamp).toHaveBeenCalledTimes(1);
  });

  it('should ignore outbound frames, which say nothing about whether the station is reachable', async () => {
    await processor.process(
      aFrameEvent({
        direction: FrameDirection.Outbound,
        origin: MessageOrigin.ChargingStationManagementSystem,
      }),
      {},
    );

    expect(updateChargingStationTimestamp).not.toHaveBeenCalled();
  });

  it('should surface a repository failure to the pipeline', async () => {
    updateChargingStationTimestamp.mockRejectedValue(new Error('db error'));

    await expect(processor.process(aFrameEvent(), {})).rejects.toThrow('db error');
  });
});
