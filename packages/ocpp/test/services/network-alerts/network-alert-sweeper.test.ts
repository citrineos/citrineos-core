// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessageOrigin, type NetworkAlertConfigDto } from '@citrineos/types';
import {
  NetworkAlertConfigResolver,
  NetworkAlertService,
  NetworkAlertSweeper,
} from '@services/network-alerts/index.js';
import { aSystemConfig } from '@test/providers/system-config.js';
import { createTestContainer } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeNetworkAlertRepository } from './fake-network-alert-repository.js';

const TENANT = 1;
const STATION = 10;
const T0 = Date.parse('2026-10-07T12:00:00.000Z');

function at(secondsAfterT0: number): string {
  return new Date(T0 + secondsAfterT0 * 1000).toISOString();
}

function now(secondsAfterT0: number): Date {
  return new Date(T0 + secondsAfterT0 * 1000);
}

describe('NetworkAlertSweeper', () => {
  const { logger } = createTestContainer();
  let repository: FakeNetworkAlertRepository;
  let configRows: NetworkAlertConfigDto[];
  let service: NetworkAlertService;
  let sweeper: NetworkAlertSweeper;

  function station(
    isOnline: boolean,
    latestOcppMessageTimestamp: string | null,
    heartbeatInterval: number | null = null,
    lastConnectedAt: string | null = null,
  ): void {
    repository.stations = [
      {
        tenantId: TENANT,
        stationId: STATION,
        isOnline,
        latestOcppMessageTimestamp,
        lastConnectedAt,
        heartbeatInterval,
      },
    ];
  }

  beforeEach(() => {
    repository = new FakeNetworkAlertRepository();
    configRows = [];
    const config = aSystemConfig({
      networkAlerts: { sweepIntervalSeconds: 30 },
      ocpp: { heartbeatInterval: 60 },
    });
    const networkAlertConfigResolver = new NetworkAlertConfigResolver({
      config,
      networkAlertConfigRepository: { readByTenant: vi.fn(async () => configRows) },
    });
    service = new NetworkAlertService({
      networkAlertRepository: repository,
      networkAlertConfigResolver,
    });
    sweeper = new NetworkAlertSweeper({
      config,
      networkAlertRepository: repository,
      networkAlertService: service,
      networkAlertConfigResolver,
      logger,
    });
  });

  afterEach(() => {
    sweeper.stop();
    vi.useRealTimers();
  });

  describe('station connectivity', () => {
    beforeEach(async () => {
      await service.recordDisconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(0) });
    });

    it('should escalate a station offline longer than the threshold', async () => {
      station(false, at(-5));

      await sweeper.sweep(now(900));

      expect(repository.alerts[0]).toMatchObject({ severity: 'Critical', status: 'Active' });
    });

    it('should leave a station offline for less than the threshold', async () => {
      station(false, at(-5));

      await sweeper.sweep(now(899));

      expect(repository.alerts[0].severity).toBe('Info');
    });

    it('should not escalate a station that is back online', async () => {
      station(true, at(1000));

      await sweeper.sweep(now(1000));

      expect(repository.alerts[0].severity).toBe('Info');
    });

    it('should resolve the episode once the station has been online and quiet for the window', async () => {
      await service.recordReconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(10) });
      station(true, at(3590));

      await sweeper.sweep(now(3599));
      expect(repository.alerts[0].status).toBe('Active');

      await sweeper.sweep(now(3600));
      expect(repository.alerts[0]).toMatchObject({ status: 'Resolved', resolvedBy: 'Automatic' });
    });

    it('should not resolve the episode of a station that is online but silent', async () => {
      await service.recordReconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(10) });
      station(true, at(10));

      await sweeper.sweep(now(3600));

      expect(repository.alerts[0].status).toBe('Active');
    });

    it("should take a reachable station's traffic as its reconnect when no open was seen", async () => {
      station(true, at(120));

      await sweeper.sweep(now(150));

      expect(repository.alerts[0].details).toEqual({ offlineSince: null });
      expect(repository.occurrences[0].details).toEqual({ durationSeconds: 120 });
    });

    it('should count a station that has just reconnected as reachable before it sends anything', async () => {
      station(true, at(-5), null, at(1000));

      await sweeper.sweep(now(1001));

      expect(repository.alerts[0].severity).toBe('Info');
    });

    it("should take a reachable station's connect as its reconnect when no open was seen", async () => {
      station(true, at(-5), null, at(120));

      await sweeper.sweep(now(150));

      expect(repository.alerts[0].details).toEqual({ offlineSince: null });
      expect(repository.occurrences[0].details).toEqual({ durationSeconds: 120 });
    });

    it('should do nothing while another instance holds the sweep lock', async () => {
      station(false, at(-5));
      repository.sweepLocked = true;

      await sweeper.sweep(now(900));

      expect(repository.alerts[0].severity).toBe('Info');
    });
  });

  describe('silent stations', () => {
    it('should treat a station that missed two default heartbeats as disconnected since its last message', async () => {
      station(true, at(0));

      await sweeper.sweep(now(121));

      expect(repository.alertsOf('StationConnectivity')).toEqual([
        expect.objectContaining({ severity: 'Info', details: { offlineSince: at(0) } }),
      ]);
    });

    it('should not call a station silent that reconnected after its last message', async () => {
      station(true, at(-86400), null, at(0));

      await sweeper.sweep(now(5));

      expect(repository.alerts).toEqual([]);
    });

    it('should treat a station silent since it connected as disconnected since its connect', async () => {
      station(true, null, null, at(0));

      await sweeper.sweep(now(121));

      expect(repository.alertsOf('StationConnectivity')).toEqual([
        expect.objectContaining({ details: { offlineSince: at(0) } }),
      ]);
    });

    it('should not call a station silent before it has missed two heartbeats', async () => {
      station(true, at(0));

      await sweeper.sweep(now(120));

      expect(repository.alerts).toEqual([]);
    });

    it("should use the tenant's missedHeartbeats rule", async () => {
      configRows = [
        { type: 'StationConnectivity', tenantId: TENANT, rules: { missedHeartbeats: 5 } },
      ];
      station(true, at(0));

      await sweeper.sweep(now(300));
      expect(repository.alerts).toEqual([]);

      await sweeper.sweep(now(301));
      expect(repository.alertsOf('StationConnectivity')).toHaveLength(1);
    });

    it("should use the heartbeat interval from the station's Boot record", async () => {
      station(true, at(0), 600);

      await sweeper.sweep(now(900));
      expect(repository.alerts).toEqual([]);

      await sweeper.sweep(now(1201));
      expect(repository.alertsOf('StationConnectivity')).toHaveLength(1);
    });

    it('should not take a silent station as reconnected when it has sent nothing since', async () => {
      station(true, at(0));
      await sweeper.sweep(now(121));

      station(true, at(0), 600);
      await sweeper.sweep(now(150));

      expect(repository.alerts[0].details).toEqual({ offlineSince: at(0) });
    });

    it('should escalate a station silent past offlineTooLong in the same sweep that finds it', async () => {
      station(true, at(0));

      await sweeper.sweep(now(900));

      expect(repository.alerts[0]).toMatchObject({
        severity: 'Critical',
        details: { offlineSince: at(0) },
      });
    });

    it('should count a station as reachable within its own heartbeat interval', async () => {
      await service.recordDisconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(0) });
      await service.recordReconnect({ tenantId: TENANT, stationId: STATION, occurredAt: at(10) });
      station(true, at(10), 3600);

      await sweeper.sweep(now(3600));

      expect(repository.alerts[0].status).toBe('Resolved');
    });

    it('should leave silent stations alone when the tenant disabled the type', async () => {
      configRows = [{ type: 'StationConnectivity', tenantId: TENANT, enabled: false }];
      station(true, at(0));

      await sweeper.sweep(now(900));

      expect(repository.alerts).toEqual([]);
    });
  });

  describe('slow responses', () => {
    function aSlowSample(earliestSecondsAfterT0: number, latestSecondsAfterT0: number) {
      return {
        tenantId: TENANT,
        stationId: STATION,
        origin: MessageOrigin.ChargingStation,
        sampleSize: 10,
        averageMs: 8000,
        earliestTimestamp: at(earliestSecondsAfterT0),
        latestMessageId: 99,
        latestCorrelationId: 'corr-9',
        latestAction: 'Heartbeat',
        latestTimestamp: at(latestSecondsAfterT0),
      };
    }

    it("should record a slow sample of the tenant's responses within the quiet period", async () => {
      const read = vi.spyOn(repository, 'readSlowResponseSamples');
      repository.slowSamples = [aSlowSample(1000, 1700)];

      await sweeper.sweep(now(1800));

      expect(read).toHaveBeenCalledWith(TENANT, at(0), 10, 5000);
      expect(repository.alertsOf('OcppCallFailures')).toEqual([
        expect.objectContaining({ status: 'Active', lastSeenAt: at(1700) }),
      ]);
      expect(repository.occurrences[0].details).toMatchObject({
        reason: 'Slow',
        durationMs: 8000,
        sampleSize: 10,
      });
    });

    it('should record a station that stays slow once per sample, not once per sweep', async () => {
      repository.slowSamples = [aSlowSample(1000, 1700)];
      await sweeper.sweep(now(1800));

      repository.slowSamples = [aSlowSample(1100, 1750)];
      await sweeper.sweep(now(1830));

      expect(repository.occurrences).toHaveLength(1);
    });

    it("should name the action unknown when the newest response's was not resolved", async () => {
      repository.slowSamples = [{ ...aSlowSample(1000, 1700), latestAction: null }];

      await sweeper.sweep(now(1800));

      expect(repository.occurrences[0].details).toMatchObject({ action: 'unknown' });
    });

    it('should skip a tenant that disabled the type', async () => {
      configRows = [{ type: 'OcppCallFailures', tenantId: TENANT, enabled: false }];
      repository.slowSamples = [aSlowSample(1000, 1700)];

      await sweeper.sweep(now(1800));

      expect(repository.alerts).toEqual([]);
    });
  });

  describe('call failures', () => {
    beforeEach(async () => {
      await service.recordCallFailure({
        tenantId: TENANT,
        stationId: STATION,
        reason: 'CallError',
        origin: MessageOrigin.ChargingStation,
        action: 'Reset',
        correlationId: 'corr-1',
        occurredAt: at(0),
      });
    });

    it('should resolve an episode that has been quiet for the quiet period', async () => {
      await sweeper.sweep(now(1799));
      expect(repository.alerts[0].status).toBe('Active');

      await sweeper.sweep(now(1800));
      expect(repository.alerts[0]).toMatchObject({ status: 'Resolved', resolvedAt: at(1800) });
    });
  });

  describe('start', () => {
    it('should sweep on every interval until stopped', async () => {
      vi.useFakeTimers();
      const sweep = vi.spyOn(sweeper, 'sweep').mockResolvedValue();

      sweeper.start();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(sweep).toHaveBeenCalledTimes(2);

      sweeper.stop();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(sweep).toHaveBeenCalledTimes(2);
    });
  });
});
