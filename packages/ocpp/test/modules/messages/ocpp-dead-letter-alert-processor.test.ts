// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessageOrigin, OCPP_CallAction } from '@citrineos/types';
import { OcppDeadLetterAlertProcessor } from '@modules/messages/processors/ocpp-dead-letter-alert-processor.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import type { OcppDeadLetterReport } from '@/transport/queue/rabbit-mq/messages/ocpp-dead-letter-consumer.js';

const STATION_DB_ID = 17;
const NOW = '2026-03-04T05:06:07.000Z';

function aReport(override?: Partial<OcppDeadLetterReport>): OcppDeadLetterReport {
  return {
    reason: 'stale',
    source: 'router',
    action: OCPP_CallAction.GetBaseReport,
    origin: MessageOrigin.ChargingStationManagementSystem,
    tenantId: '3',
    ocppConnectionName: 'CS-9',
    correlationId: 'corr-1',
    body: '{}',
    ...override,
  };
}

describe('OcppDeadLetterAlertProcessor', () => {
  const { container } = createTestContainer();
  let networkAlertService: { recordCallFailure: Mock };
  let chargingStationRepository: { readChargingStationByOcppConnectionName: Mock };
  let processor: OcppDeadLetterAlertProcessor;

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(NOW), toFake: ['Date'] });
    networkAlertService = { recordCallFailure: vi.fn().mockResolvedValue(undefined) };
    chargingStationRepository = {
      readChargingStationByOcppConnectionName: vi.fn().mockResolvedValue({ id: STATION_DB_ID }),
    };
    processor = getTestInstance(container, OcppDeadLetterAlertProcessor, {
      networkAlertService,
      chargingStationRepository,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(['stale', 'expired', 'unroutable', 'overflow', 'shutdown'])(
    'should record a Call the CSMS dead-lettered as %s as a send failure',
    async (reason) => {
      await processor.process(aReport({ reason }));

      expect(
        chargingStationRepository.readChargingStationByOcppConnectionName,
      ).toHaveBeenCalledExactlyOnceWith(3, 'CS-9');
      expect(networkAlertService.recordCallFailure).toHaveBeenCalledExactlyOnceWith({
        tenantId: 3,
        stationId: STATION_DB_ID,
        reason: 'SendFailed',
        origin: MessageOrigin.ChargingStationManagementSystem,
        action: OCPP_CallAction.GetBaseReport,
        correlationId: 'corr-1',
        occurredAt: NOW,
      });
    },
  );

  it.each(['handler_error', 'poison'])(
    'should record nothing for a dead letter with reason %s',
    async (reason) => {
      await processor.process(aReport({ reason }));

      expect(
        chargingStationRepository.readChargingStationByOcppConnectionName,
      ).not.toHaveBeenCalled();
      expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
    },
  );

  it.each([MessageOrigin.ChargingStation, undefined])(
    'should record nothing for a message with origin %s',
    async (origin) => {
      await processor.process(aReport({ origin }));

      expect(
        chargingStationRepository.readChargingStationByOcppConnectionName,
      ).not.toHaveBeenCalled();
      expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['a non-numeric tenantId', { tenantId: 'abc' }],
    ['a fractional tenantId', { tenantId: '1.5' }],
    ['an empty tenantId', { tenantId: '' }],
    ['no ocppConnectionName', { ocppConnectionName: undefined }],
    ['an empty ocppConnectionName', { ocppConnectionName: '' }],
    ['no correlationId', { correlationId: undefined }],
  ])('should record nothing for a report with %s', async (_label, override) => {
    await processor.process(aReport(override));

    expect(
      chargingStationRepository.readChargingStationByOcppConnectionName,
    ).not.toHaveBeenCalled();
    expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
  });

  it('should record nothing for a station that is not known', async () => {
    chargingStationRepository.readChargingStationByOcppConnectionName.mockResolvedValue(undefined);

    await processor.process(aReport());

    expect(networkAlertService.recordCallFailure).not.toHaveBeenCalled();
  });
});
