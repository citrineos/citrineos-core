// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { UNKNOWN_ACTION } from '@/transport/metrics.js';
import { childLogger } from '@citrineos/base';
import type {
  INetworkAlertRepository,
  NetworkAlertStationState,
  NetworkAlertSubject,
  OpenNetworkAlert,
} from '@citrineos/dal';
import type { SystemConfig } from '@citrineos/types';
import type { ILogObj, Logger } from 'tslog';
import type { NetworkAlertConfigResolver } from './network-alert-config-resolver.js';
import { isAlertOfType, type NetworkAlertService } from './network-alert-service.js';
import { isMoreSevere } from './severity.js';

/**
 * Applies the alert rules that are judged over time rather than on a single event: a station
 * offline too long, a station that went silent without a close, stations answering slowly, and
 * episodes that have gone quiet.
 *
 * Every instance runs the timer; one at a time does the work, under a database lock.
 */
export class NetworkAlertSweeper {
  private readonly _repository: INetworkAlertRepository;
  private readonly _service: NetworkAlertService;
  private readonly _configResolver: NetworkAlertConfigResolver;
  private readonly _intervalMs: number;
  private readonly _defaultHeartbeatInterval: number;
  private readonly _logger: Logger<ILogObj>;

  private _timer?: ReturnType<typeof setInterval>;
  private _running = false;

  constructor({
    config,
    networkAlertRepository,
    networkAlertService,
    networkAlertConfigResolver,
    logger,
  }: {
    config: SystemConfig;
    networkAlertRepository: INetworkAlertRepository;
    networkAlertService: NetworkAlertService;
    networkAlertConfigResolver: NetworkAlertConfigResolver;
    logger?: Logger<ILogObj>;
  }) {
    this._repository = networkAlertRepository;
    this._service = networkAlertService;
    this._configResolver = networkAlertConfigResolver;
    this._intervalMs = config.networkAlerts.sweepIntervalSeconds * 1000;
    this._defaultHeartbeatInterval = config.ocpp.heartbeatInterval;
    this._logger = childLogger(logger, this.constructor.name);
  }

  start(): void {
    if (this._timer) {
      return;
    }
    this._timer = setInterval(() => void this.sweep(), this._intervalMs);
    this._timer.unref();
  }

  stop(): void {
    clearInterval(this._timer);
    this._timer = undefined;
  }

  async sweep(now: Date = new Date()): Promise<void> {
    if (this._running) {
      return;
    }
    this._running = true;
    try {
      await this._repository.withSweepLock(async () => {
        await this._sweepSilentStations(now);
        await this._sweepConnectivity(now);
        await this._sweepSlowResponses(now);
        await this._sweepCallFailures(now);
      });
    } catch (error) {
      this._logger.error('Network alert sweep failed', error);
    } finally {
      this._running = false;
    }
  }

  /** Stations still marked online that have missed their heartbeats are treated as disconnected. */
  private async _sweepSilentStations(now: Date): Promise<void> {
    for (const tenantId of await this._repository.readTenantIds()) {
      try {
        const { StationConnectivity: config } = await this._configResolver.resolve(tenantId);
        if (!config.enabled) {
          continue;
        }
        const stations = await this._repository.readSilentStations(
          tenantId,
          now.toISOString(),
          this._defaultHeartbeatInterval,
          config.rules.missedHeartbeats,
        );
        for (const station of stations) {
          try {
            await this._service.recordSilentStation({
              tenantId,
              stationId: station.stationId,
              lastHeardAt: station.latestOcppMessageTimestamp,
              severity: config.rules.disconnectSeverity,
            });
          } catch (error) {
            this._logger.error(`Failed to sweep silent station ${station.stationId}`, error);
          }
        }
      } catch (error) {
        this._logger.error(`Failed to sweep silent stations for tenant ${tenantId}`, error);
      }
    }
  }

  private async _sweepConnectivity(now: Date): Promise<void> {
    for (const open of await this._repository.readOpenByType('StationConnectivity')) {
      await this._each(open, async (subject) => {
        const { alert, station } = open;
        if (!isAlertOfType(alert, 'StationConnectivity')) {
          return;
        }
        const { StationConnectivity: config } = await this._configResolver.resolve(
          subject.tenantId,
        );
        const { offlineTooLong, frequentDisconnects, missedHeartbeats } = config.rules;

        if (!station || !this._isReachable(station, missedHeartbeats, now)) {
          const offlineSince = alert.details.offlineSince;
          if (
            config.enabled &&
            offlineSince &&
            now.getTime() - Date.parse(offlineSince) >= offlineTooLong.seconds * 1000 &&
            isMoreSevere(offlineTooLong.severity, alert.severity)
          ) {
            await this._service.escalate(subject, offlineTooLong.severity);
          }
          return;
        }

        // A station can come back without an Open the transport saw, e.g. after being found
        // silent; its own traffic is then the evidence that it reconnected.
        if (
          alert.details.offlineSince &&
          station.latestOcppMessageTimestamp &&
          Date.parse(station.latestOcppMessageTimestamp) > Date.parse(alert.details.offlineSince)
        ) {
          await this._service.recordReconnect({
            tenantId: subject.tenantId,
            stationId: subject.stationId,
            occurredAt: station.latestOcppMessageTimestamp,
          });
        }
        if (
          now.getTime() - Date.parse(alert.lastSeenAt) >=
          frequentDisconnects.windowSeconds * 1000
        ) {
          await this._service.resolve(subject, 'Automatic', now.toISOString());
        }
      });
    }
  }

  /**
   * Averages each station's latest responses, per responding side, over the tenant's quiet period:
   * a station quiet for that long has no recent responses to judge.
   */
  private async _sweepSlowResponses(now: Date): Promise<void> {
    for (const tenantId of await this._repository.readTenantIds()) {
      try {
        const { OcppCallFailures: config } = await this._configResolver.resolve(tenantId);
        if (!config.enabled) {
          continue;
        }
        const { quietPeriodSeconds, slowSampleSize, slowThresholdMs } = config.rules;
        const samples = await this._repository.readSlowResponseSamples(
          tenantId,
          new Date(now.getTime() - quietPeriodSeconds * 1000).toISOString(),
          slowSampleSize,
          slowThresholdMs,
        );
        for (const sample of samples) {
          await this._service.recordSlowResponses({
            tenantId,
            stationId: sample.stationId,
            origin: sample.origin,
            averageMs: sample.averageMs,
            sampleSize: sample.sampleSize,
            earliestAt: sample.earliestTimestamp,
            latestAt: sample.latestTimestamp,
            action: sample.latestAction ?? UNKNOWN_ACTION,
            correlationId: sample.latestCorrelationId,
            ocppMessageId: sample.latestMessageId,
          });
        }
      } catch (error) {
        this._logger.error(`Failed to sweep slow responses for tenant ${tenantId}`, error);
      }
    }
  }

  private async _sweepCallFailures(now: Date): Promise<void> {
    for (const open of await this._repository.readOpenByType('OcppCallFailures')) {
      await this._each(open, async (subject) => {
        const { OcppCallFailures: config } = await this._configResolver.resolve(subject.tenantId);
        const quietMs = config.rules.quietPeriodSeconds * 1000;
        if (now.getTime() - Date.parse(open.alert.lastSeenAt) >= quietMs) {
          await this._service.resolve(subject, 'Automatic', now.toISOString());
        }
      });
    }
  }

  private _isReachable(
    station: NetworkAlertStationState,
    missedHeartbeats: number,
    now: Date,
  ): boolean {
    if (!station.isOnline) {
      return false;
    }
    if (station.latestOcppMessageTimestamp === null) {
      return true;
    }
    const heartbeatMs = (station.heartbeatInterval ?? this._defaultHeartbeatInterval) * 1000;
    return (
      now.getTime() - Date.parse(station.latestOcppMessageTimestamp) <=
      missedHeartbeats * heartbeatMs
    );
  }

  /** One alert's failure is logged and skipped, so it cannot stall the rest of the sweep. */
  private async _each(
    open: OpenNetworkAlert,
    fn: (subject: NetworkAlertSubject) => Promise<void>,
  ): Promise<void> {
    const { alert } = open;
    if (alert.tenantId == null || alert.stationId == null) {
      return;
    }
    try {
      await fn({
        tenantId: alert.tenantId,
        type: alert.type,
        stationId: alert.stationId,
        connectorId: alert.connectorId,
      });
    } catch (error) {
      this._logger.error(`Failed to sweep network alert ${alert.id}`, error);
    }
  }
}
