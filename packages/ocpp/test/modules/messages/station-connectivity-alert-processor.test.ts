// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { StationConnectivityAlertProcessor } from '@modules/messages/processors/station-connectivity-alert-processor.js';
import { aWebsocketLifecycleEvent, TENANT_ID } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

const STATION_DB_ID = 17;
const TIMESTAMP = '2026-03-04T05:06:07.000Z';

describe('StationConnectivityAlertProcessor', () => {
  const { container } = createTestContainer();
  let networkAlertService: { recordDisconnect: Mock; recordReconnect: Mock };
  let processor: StationConnectivityAlertProcessor;

  beforeEach(() => {
    networkAlertService = {
      recordDisconnect: vi.fn().mockResolvedValue(undefined),
      recordReconnect: vi.fn().mockResolvedValue(undefined),
    };
    processor = getTestInstance(container, StationConnectivityAlertProcessor, {
      networkAlertService,
    });
  });

  it('should not be critical, so a failure does not re-run the persist insert', () => {
    expect(processor.critical).toBe(false);
    expect(processor.name).toBe('station-connectivity-alert');
  });

  it.each([undefined, 'pong_timeout', 'frame_error'])(
    'should record a disconnect for a close with source %s',
    async (source) => {
      await processor.process(
        aWebsocketLifecycleEvent({ type: 'Close', source, timestamp: TIMESTAMP }),
        { stationId: STATION_DB_ID, persistedId: 99 },
      );

      expect(networkAlertService.recordDisconnect).toHaveBeenCalledExactlyOnceWith({
        tenantId: TENANT_ID,
        stationId: STATION_DB_ID,
        occurredAt: TIMESTAMP,
        websocketEventId: 99,
      });
      expect(networkAlertService.recordReconnect).not.toHaveBeenCalled();
    },
  );

  it.each(['replaced_by_new_connection', 'admin_disconnect', 'server_shutdown'])(
    'should record nothing for an expected close with source %s',
    async (source) => {
      await processor.process(aWebsocketLifecycleEvent({ type: 'Close', source }), {
        stationId: STATION_DB_ID,
        persistedId: 99,
      });

      expect(networkAlertService.recordDisconnect).not.toHaveBeenCalled();
      expect(networkAlertService.recordReconnect).not.toHaveBeenCalled();
    },
  );

  it('should record a reconnect for an open', async () => {
    await processor.process(aWebsocketLifecycleEvent({ type: 'Open', timestamp: TIMESTAMP }), {
      stationId: STATION_DB_ID,
      persistedId: 99,
    });

    expect(networkAlertService.recordReconnect).toHaveBeenCalledExactlyOnceWith({
      tenantId: TENANT_ID,
      stationId: STATION_DB_ID,
      occurredAt: TIMESTAMP,
    });
    expect(networkAlertService.recordDisconnect).not.toHaveBeenCalled();
  });

  it.each(['Open', 'Close'] as const)(
    'should record nothing for a %s the persisted row linked to no station',
    async (type) => {
      await processor.process(aWebsocketLifecycleEvent({ type, source: 'pong_timeout' }), {
        persistedId: 99,
      });

      expect(networkAlertService.recordDisconnect).not.toHaveBeenCalled();
      expect(networkAlertService.recordReconnect).not.toHaveBeenCalled();
    },
  );

  it.each(['UpgradeRejected', 'ConnectionRejected'] as const)(
    'should record nothing for a %s event',
    async (type) => {
      await processor.process(aWebsocketLifecycleEvent({ type, source: 'unknown_station' }), {
        stationId: STATION_DB_ID,
        persistedId: 99,
      });

      expect(networkAlertService.recordDisconnect).not.toHaveBeenCalled();
      expect(networkAlertService.recordReconnect).not.toHaveBeenCalled();
    },
  );

  it('should propagate a failure to record, for the pipeline to log', async () => {
    networkAlertService.recordDisconnect.mockRejectedValue(new Error('lock timeout'));

    await expect(
      processor.process(aWebsocketLifecycleEvent({ type: 'Close' }), { stationId: STATION_DB_ID }),
    ).rejects.toThrow('lock timeout');
  });
});
