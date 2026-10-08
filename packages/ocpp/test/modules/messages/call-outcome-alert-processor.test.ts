// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CallEventOutcome, MessageOrigin, OCPP_CallAction } from '@citrineos/types';
import { CallOutcomeAlertProcessor } from '@modules/messages/processors/call-outcome-alert-processor.js';
import { aCallEvent, STATION_ID, TENANT_ID } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

const STATION_DB_ID = 17;
const TIMESTAMP = '2026-03-04T05:06:07.000Z';

describe('CallOutcomeAlertProcessor', () => {
  const { container } = createTestContainer();
  let networkAlertService: { recordCallFailure: Mock };
  let chargingStationRepository: { readChargingStationByOcppConnectionName: Mock };
  let ocppMessageRepository: { getRequestByCorrelationId: Mock };
  let processor: CallOutcomeAlertProcessor;

  beforeEach(() => {
    networkAlertService = { recordCallFailure: vi.fn().mockResolvedValue(undefined) };
    chargingStationRepository = {
      readChargingStationByOcppConnectionName: vi.fn().mockResolvedValue({ id: STATION_DB_ID }),
    };
    ocppMessageRepository = {
      getRequestByCorrelationId: vi.fn().mockResolvedValue({ id: 321 }),
    };
    processor = getTestInstance(container, CallOutcomeAlertProcessor, {
      networkAlertService,
      chargingStationRepository,
      ocppMessageRepository,
    });
  });

  it('should be critical, because it is the only processor on its queue', () => {
    expect(processor.critical).toBe(true);
    expect(processor.name).toBe('call-outcome-alert');
  });

  it('should record a timed-out Call against its station and the Call frame', async () => {
    await processor.process(
      aCallEvent({
        outcome: CallEventOutcome.Timeout,
        correlationId: 'corr-1',
        action: OCPP_CallAction.GetBaseReport,
        timestamp: TIMESTAMP,
      }),
      {},
    );

    expect(
      chargingStationRepository.readChargingStationByOcppConnectionName,
    ).toHaveBeenCalledExactlyOnceWith(TENANT_ID, STATION_ID);
    expect(ocppMessageRepository.getRequestByCorrelationId).toHaveBeenCalledExactlyOnceWith(
      TENANT_ID,
      'corr-1',
    );
    expect(networkAlertService.recordCallFailure).toHaveBeenCalledExactlyOnceWith({
      tenantId: TENANT_ID,
      stationId: STATION_DB_ID,
      reason: 'Timeout',
      origin: MessageOrigin.ChargingStationManagementSystem,
      action: OCPP_CallAction.GetBaseReport,
      correlationId: 'corr-1',
      occurredAt: TIMESTAMP,
      ocppMessageId: 321,
    });
  });

  it('should record a timed-out Call without a frame reference when the Call row is missing', async () => {
    ocppMessageRepository.getRequestByCorrelationId.mockResolvedValue(undefined);

    await processor.process(aCallEvent({ outcome: CallEventOutcome.Timeout }), {});

    expect(networkAlertService.recordCallFailure).toHaveBeenCalledWith(
      expect.objectContaining({ reason: 'Timeout', ocppMessageId: undefined }),
    );
  });

  it('should record a Call that failed to send without looking for a frame it never left', async () => {
    await processor.process(
      aCallEvent({
        outcome: CallEventOutcome.SendFailed,
        correlationId: 'corr-2',
        action: OCPP_CallAction.Reset,
        timestamp: TIMESTAMP,
      }),
      {},
    );

    expect(ocppMessageRepository.getRequestByCorrelationId).not.toHaveBeenCalled();
    expect(networkAlertService.recordCallFailure).toHaveBeenCalledExactlyOnceWith({
      tenantId: TENANT_ID,
      stationId: STATION_DB_ID,
      reason: 'SendFailed',
      origin: MessageOrigin.ChargingStationManagementSystem,
      action: OCPP_CallAction.Reset,
      correlationId: 'corr-2',
      occurredAt: TIMESTAMP,
      ocppMessageId: undefined,
    });
  });

  it.each([undefined, {}])('should record nothing for an unknown station (%o)', async (station) => {
    chargingStationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(station);

    await processor.process(aCallEvent(), {});

    expect(ocppMessageRepository.getRequestByCorrelationId).not.toHaveBeenCalled();
    expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
  });

  it('should propagate a failure to record, so the event is retried', async () => {
    networkAlertService.recordCallFailure.mockRejectedValue(new Error('lock timeout'));

    await expect(processor.process(aCallEvent(), {})).rejects.toThrow('lock timeout');
  });
});
