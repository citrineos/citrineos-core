// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessageOrigin, type NetworkAlertConfigDto } from '@citrineos/types';
import {
  type CallFailureInput,
  NetworkAlertConfigResolver,
  NetworkAlertService,
  type SlowResponsesInput,
} from '@services/network-alerts/index.js';
import { aSystemConfig } from '@test/providers/system-config.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeNetworkAlertRepository } from './fake-network-alert-repository.js';

const TENANT = 1;
const STATION = 10;
const T0 = Date.parse('2026-10-07T12:00:00.000Z');

function at(secondsAfterT0: number): string {
  return new Date(T0 + secondsAfterT0 * 1000).toISOString();
}

describe('NetworkAlertService', () => {
  let repository: FakeNetworkAlertRepository;
  let configRows: NetworkAlertConfigDto[];
  let service: NetworkAlertService;

  beforeEach(() => {
    repository = new FakeNetworkAlertRepository();
    configRows = [];
    const resolver = new NetworkAlertConfigResolver({
      config: aSystemConfig(),
      networkAlertConfigRepository: { readByTenant: vi.fn(async () => configRows) },
    });
    service = new NetworkAlertService({
      networkAlertRepository: repository,
      networkAlertConfigResolver: resolver,
    });
  });

  describe('recordDisconnect', () => {
    function disconnect(secondsAfterT0: number, websocketEventId?: number): Promise<void> {
      return service.recordDisconnect({
        tenantId: TENANT,
        stationId: STATION,
        occurredAt: at(secondsAfterT0),
        websocketEventId,
      });
    }

    it('should open an Info episode marked offline since the close', async () => {
      await disconnect(0, 77);

      const [alert] = repository.alertsOf('StationConnectivity');
      expect(alert).toMatchObject({
        severity: 'Info',
        status: 'Active',
        stationId: STATION,
        tenantId: TENANT,
        occurrenceCount: 1,
        firstSeenAt: at(0),
        lastSeenAt: at(0),
        details: { offlineSince: at(0) },
      });
      expect(repository.occurrencesOf(alert.id)).toEqual([
        expect.objectContaining({
          severity: 'Info',
          websocketEventId: 77,
          occurredAt: at(0),
          details: { durationSeconds: null },
        }),
      ]);
    });

    it('should extend the open episode instead of opening another', async () => {
      await disconnect(0);
      await disconnect(60);

      expect(repository.alertsOf('StationConnectivity')).toEqual([
        expect.objectContaining({ occurrenceCount: 2, firstSeenAt: at(0), lastSeenAt: at(60) }),
      ]);
    });

    it('should escalate on the disconnect that reaches the frequent-disconnect count', async () => {
      for (let i = 0; i < 4; i++) {
        await disconnect(i * 60);
      }
      expect(repository.alertsOf('StationConnectivity')[0].severity).toBe('Info');

      await disconnect(240);

      const [alert] = repository.alertsOf('StationConnectivity');
      expect(alert.severity).toBe('Warning');
      expect(repository.occurrencesOf(alert.id).map((o) => o.severity)).toEqual([
        'Info',
        'Info',
        'Info',
        'Info',
        'Warning',
      ]);
    });

    it('should only count disconnects inside the window', async () => {
      for (let i = 0; i < 4; i++) {
        await disconnect(i);
      }

      await disconnect(3600 + 10);

      expect(repository.alertsOf('StationConnectivity')[0].severity).toBe('Info');
    });

    it("should apply a tenant's override of the frequent-disconnect count", async () => {
      configRows = [
        {
          type: 'StationConnectivity',
          tenantId: TENANT,
          rules: { frequentDisconnects: { count: 2, windowSeconds: 600, severity: 'Critical' } },
        },
      ];

      await disconnect(0);
      await disconnect(30);

      expect(repository.alertsOf('StationConnectivity')[0].severity).toBe('Critical');
    });

    it('should record nothing when the tenant disabled the type', async () => {
      configRows = [{ type: 'StationConnectivity', tenantId: TENANT, enabled: false }];

      await disconnect(0);

      expect(repository.alerts).toEqual([]);
    });

    it('should keep an acknowledged episode acknowledged until it becomes more severe', async () => {
      await disconnect(0);
      repository.alerts[0] = { ...repository.alerts[0], status: 'Acknowledged' };

      await disconnect(10);
      expect(repository.alerts[0].status).toBe('Acknowledged');

      await disconnect(20);
      await disconnect(30);
      await disconnect(40);
      expect(repository.alerts[0]).toMatchObject({ status: 'Active', severity: 'Warning' });
    });

    it('should keep one episode when disconnects for a station are processed concurrently', async () => {
      await Promise.all([disconnect(0), disconnect(1), disconnect(2)]);

      expect(repository.alertsOf('StationConnectivity')).toEqual([
        expect.objectContaining({ occurrenceCount: 3 }),
      ]);
    });

    it('should keep the earliest offlineSince when closes arrive out of order', async () => {
      await disconnect(60);
      await disconnect(0);

      expect(repository.alerts[0]).toMatchObject({
        firstSeenAt: at(0),
        lastSeenAt: at(60),
        details: { offlineSince: at(0) },
      });
    });
  });

  describe('recordReconnect', () => {
    it('should clear offlineSince and record how long the disconnect lasted', async () => {
      await service.recordDisconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(0) });

      await service.recordReconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(95) });

      const [alert] = repository.alerts;
      expect(alert.details).toEqual({ offlineSince: null });
      expect(repository.occurrencesOf(alert.id)[0].details).toEqual({ durationSeconds: 95 });
    });

    it('should ignore an open that happened before the disconnect it would end', async () => {
      await service.recordDisconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(60) });

      await service.recordReconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(0) });

      expect(repository.alerts[0].details).toEqual({ offlineSince: at(60) });
    });

    it('should do nothing for a station with no open episode', async () => {
      await service.recordReconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(0) });

      expect(repository.alerts).toEqual([]);
    });
  });

  describe('recordSilentStation', () => {
    it('should open an episode offline since the station was last heard from', async () => {
      await service.recordSilentStation({
        tenantId: TENANT,
        stationId: STATION,
        lastHeardAt: at(0),
        severity: 'Critical',
      });

      expect(repository.alerts).toEqual([
        expect.objectContaining({ severity: 'Critical', details: { offlineSince: at(0) } }),
      ]);
      expect(repository.occurrences).toHaveLength(1);
    });

    it('should leave an episode that already knows the station is offline', async () => {
      await service.recordDisconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(0) });

      await service.recordSilentStation({
        tenantId: TENANT,
        stationId: STATION,
        lastHeardAt: at(-30),
        severity: 'Critical',
      });

      expect(repository.alerts[0]).toMatchObject({ severity: 'Info', occurrenceCount: 1 });
    });
  });

  describe('recordConnectorStatus', () => {
    function status(
      connectorStatus: 'Faulted' | 'Unavailable' | 'Available',
      secondsAfterT0: number,
      connectorId = 5,
    ): Promise<void> {
      return service.recordConnectorStatus({
        tenantId: TENANT,
        stationId: STATION,
        evseId: 3,
        connectorId,
        status: connectorStatus,
        errorCode: connectorStatus === 'Faulted' ? 'GroundFailure' : 'NoError',
        vendorErrorCode: connectorStatus === 'Faulted' ? 'E42' : null,
        occurredAt: at(secondsAfterT0),
        statusNotificationId: 900 + secondsAfterT0,
      });
    }

    it('should open a Critical episode on the connector for Faulted', async () => {
      await status('Faulted', 0);

      const [alert] = repository.alertsOf('ConnectorStatus');
      expect(alert).toMatchObject({
        severity: 'Critical',
        stationId: STATION,
        evseId: 3,
        connectorId: 5,
        details: { status: 'Faulted', errorCode: 'GroundFailure' },
      });
      expect(repository.occurrencesOf(alert.id)).toEqual([
        expect.objectContaining({
          statusNotificationId: 900,
          details: { status: 'Faulted', errorCode: 'GroundFailure', vendorErrorCode: 'E42' },
        }),
      ]);
    });

    it('should escalate an Unavailable episode when the connector faults', async () => {
      await status('Unavailable', 0);
      await status('Faulted', 10);

      expect(repository.alertsOf('ConnectorStatus')).toEqual([
        expect.objectContaining({
          severity: 'Critical',
          occurrenceCount: 2,
          details: { status: 'Faulted', errorCode: 'GroundFailure' },
        }),
      ]);
    });

    it('should resolve the episode when the connector reports a status that does not alert', async () => {
      await status('Faulted', 0);
      await status('Available', 10);

      expect(repository.alerts[0]).toMatchObject({
        status: 'Resolved',
        resolvedBy: 'Automatic',
        resolvedAt: at(10),
      });
    });

    it('should not let a status older than the episode resolve it', async () => {
      await status('Faulted', 10);
      await status('Available', 0);

      expect(repository.alerts[0].status).toBe('Active');
    });

    it('should keep the newest status in the details when an older one arrives late', async () => {
      await status('Faulted', 10);
      await status('Unavailable', 0);

      expect(repository.alerts[0].details).toEqual({
        status: 'Faulted',
        errorCode: 'GroundFailure',
      });
    });

    it('should keep one episode per connector', async () => {
      await status('Faulted', 0, 5);
      await status('Faulted', 0, 6);

      expect(repository.alertsOf('ConnectorStatus').map((a) => a.connectorId)).toEqual([5, 6]);
    });

    it('should record nothing for a status that does not alert and no open episode', async () => {
      await status('Available', 0);

      expect(repository.alerts).toEqual([]);
    });
  });

  describe('recordCallFailure', () => {
    function failure(override: Partial<CallFailureInput>): Promise<void> {
      return service.recordCallFailure({
        tenantId: TENANT,
        stationId: STATION,
        reason: 'CallError',
        origin: MessageOrigin.ChargingStation,
        action: 'Reset',
        correlationId: 'corr-1',
        occurredAt: at(0),
        ...override,
      });
    }

    it('should record a CallError at the severity configured for the reason', async () => {
      await failure({ errorCode: 'NotSupported', ocppMessageId: 31 });

      const [alert] = repository.alertsOf('OcppCallFailures');
      expect(alert).toMatchObject({
        severity: 'Warning',
        details: { reasons: ['CallError'], actions: ['Reset'] },
      });
      expect(repository.occurrencesOf(alert.id)).toEqual([
        expect.objectContaining({
          ocppMessageId: 31,
          details: {
            reason: 'CallError',
            origin: MessageOrigin.ChargingStation,
            action: 'Reset',
            correlationId: 'corr-1',
            errorCode: 'NotSupported',
          },
        }),
      ]);
    });

    it('should make any failure of a critical action Critical', async () => {
      await failure({ reason: 'SendFailed', action: 'TransactionEvent' });

      expect(repository.alerts[0].severity).toBe('Critical');
    });

    it("should gather a station's failures into one episode listing every reason and action", async () => {
      await failure({});
      await failure({ reason: 'Timeout', action: 'GetVariables', occurredAt: at(5) });
      await failure({ occurredAt: at(10) });

      expect(repository.alertsOf('OcppCallFailures')).toEqual([
        expect.objectContaining({
          occurrenceCount: 3,
          details: { reasons: ['CallError', 'Timeout'], actions: ['Reset', 'GetVariables'] },
        }),
      ]);
    });

    it('should record nothing when the tenant disabled the type', async () => {
      configRows = [{ type: 'OcppCallFailures', tenantId: TENANT, enabled: false }];

      await failure({});

      expect(repository.alerts).toEqual([]);
    });
  });

  describe('recordSlowResponses', () => {
    function sample(override: Partial<SlowResponsesInput>): Promise<void> {
      return service.recordSlowResponses({
        tenantId: TENANT,
        stationId: STATION,
        origin: MessageOrigin.ChargingStation,
        averageMs: 7000,
        sampleSize: 10,
        earliestAt: at(0),
        latestAt: at(60),
        action: 'TransactionEvent',
        correlationId: 'corr-9',
        ocppMessageId: 99,
        ...override,
      });
    }

    it('should record a slow sample against its newest response', async () => {
      await sample({});

      expect(repository.alerts).toEqual([
        expect.objectContaining({
          severity: 'Warning',
          lastSeenAt: at(60),
          details: { reasons: ['Slow'], actions: ['TransactionEvent'] },
        }),
      ]);
      expect(repository.occurrences).toEqual([
        expect.objectContaining({
          occurredAt: at(60),
          ocppMessageId: 99,
          details: {
            reason: 'Slow',
            origin: MessageOrigin.ChargingStation,
            action: 'TransactionEvent',
            correlationId: 'corr-9',
            durationMs: 7000,
            sampleSize: 10,
          },
        }),
      ]);
    });

    it('should not treat a slow critical action as a failed one', async () => {
      await sample({ action: 'TransactionEvent' });

      expect(repository.alerts[0].severity).toBe('Warning');
    });

    it('should ignore a sample whose average is within the threshold', async () => {
      await sample({ averageMs: 5000 });

      expect(repository.alerts).toEqual([]);
    });

    it('should skip a sample overlapping the last one recorded from the same side', async () => {
      await sample({});
      await sample({ earliestAt: at(30), latestAt: at(90) });

      expect(repository.occurrences).toHaveLength(1);
    });

    it('should record the next sample once it holds only newer responses', async () => {
      await sample({});
      await sample({ earliestAt: at(61), latestAt: at(120) });

      expect(repository.occurrences).toHaveLength(2);
      expect(repository.alerts[0]).toMatchObject({ occurrenceCount: 2, lastSeenAt: at(120) });
    });

    it("should judge each side's samples apart", async () => {
      await sample({});
      await sample({
        origin: MessageOrigin.ChargingStationManagementSystem,
        earliestAt: at(30),
        latestAt: at(90),
      });

      expect(repository.occurrences).toHaveLength(2);
    });

    it('should record nothing when the tenant disabled the type', async () => {
      configRows = [{ type: 'OcppCallFailures', tenantId: TENANT, enabled: false }];

      await sample({});

      expect(repository.alerts).toEqual([]);
    });
  });

  describe('escalate', () => {
    it('should raise the open episode and make it active again', async () => {
      await service.recordDisconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(0) });
      repository.alerts[0] = { ...repository.alerts[0], status: 'Acknowledged' };

      await service.escalate(
        { tenantId: TENANT, type: 'StationConnectivity', stationId: STATION },
        'Critical',
      );

      expect(repository.alerts[0]).toMatchObject({ severity: 'Critical', status: 'Active' });
    });

    it('should never lower an episode', async () => {
      await service.recordConnectorStatus({
        tenantId: TENANT,
        stationId: STATION,
        connectorId: 5,
        status: 'Faulted',
        occurredAt: at(0),
      });

      await service.escalate(
        { tenantId: TENANT, type: 'ConnectorStatus', stationId: STATION, connectorId: 5 },
        'Info',
      );

      expect(repository.alerts[0].severity).toBe('Critical');
    });
  });
});
