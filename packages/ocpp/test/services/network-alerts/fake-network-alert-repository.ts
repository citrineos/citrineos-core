// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  INetworkAlertRepository,
  INetworkAlertSession,
  NetworkAlertSubject,
  OpenNetworkAlert,
  ResponseLatencySample,
  SilentStation,
} from '@citrineos/dal';
import {
  type NetworkAlertCreate,
  type NetworkAlertDto,
  type NetworkAlertOccurrenceCreate,
  type NetworkAlertOccurrenceDto,
  NetworkAlertOccurrenceSchema,
  NetworkAlertSchema,
  type NetworkAlertType,
  type NetworkAlertUpdate,
} from '@citrineos/types';

export interface FakeStation {
  tenantId: number;
  stationId: number;
  isOnline: boolean;
  latestOcppMessageTimestamp: string | null;
  heartbeatInterval?: number | null;
}

/**
 * INetworkAlertRepository in memory, with the same contract the ORMs keep: rows are parsed DTOs,
 * and withSubjectLock runs one callback per subject at a time.
 */
export class FakeNetworkAlertRepository implements INetworkAlertRepository {
  alerts: NetworkAlertDto[] = [];
  occurrences: NetworkAlertOccurrenceDto[] = [];
  stations: FakeStation[] = [];
  tenantIds: number[] = [1];
  slowSamples: Array<ResponseLatencySample & { tenantId: number }> = [];
  sweepLocked = false;

  private _nextId = 1;
  private _locks = new Map<string, Promise<unknown>>();

  alertsOf(type: NetworkAlertType): NetworkAlertDto[] {
    return this.alerts.filter((alert) => alert.type === type);
  }

  occurrencesOf(alertId: number | undefined): NetworkAlertOccurrenceDto[] {
    return this.occurrences.filter((occurrence) => occurrence.alertId === alertId);
  }

  seed(alert: NetworkAlertCreate & { tenantId: number }): NetworkAlertDto {
    const created = NetworkAlertSchema.parse({ ...alert, id: this._nextId++ });
    this.alerts.push(created);
    return created;
  }

  async withSubjectLock<T>(
    subject: NetworkAlertSubject,
    fn: (session: INetworkAlertSession) => Promise<T>,
  ): Promise<T> {
    const key = `${subject.tenantId}:${subject.type}:${subject.stationId}:${subject.connectorId ?? ''}`;
    const previous = this._locks.get(key) ?? Promise.resolve();
    const run = previous.then(() => fn(this._session(subject)));
    this._locks.set(
      key,
      run.catch(() => undefined),
    );
    return run;
  }

  async withSweepLock(fn: () => Promise<void>): Promise<boolean> {
    if (this.sweepLocked) {
      return false;
    }
    this.sweepLocked = true;
    try {
      await fn();
      return true;
    } finally {
      this.sweepLocked = false;
    }
  }

  async readOpenByType(type: NetworkAlertType): Promise<OpenNetworkAlert[]> {
    return this.alertsOf(type)
      .filter((alert) => alert.status !== 'Resolved')
      .map((alert) => {
        const station = this.stations.find(
          (s) => s.tenantId === alert.tenantId && s.stationId === alert.stationId,
        );
        return {
          alert,
          station: station
            ? {
                isOnline: station.isOnline,
                latestOcppMessageTimestamp: station.latestOcppMessageTimestamp,
                heartbeatInterval: station.heartbeatInterval || null,
              }
            : null,
        };
      });
  }

  async readSilentStations(
    tenantId: number,
    at: string,
    defaultHeartbeatInterval: number,
    missedHeartbeats: number,
  ): Promise<SilentStation[]> {
    return this.stations.flatMap((station) =>
      station.tenantId === tenantId &&
      station.isOnline &&
      station.latestOcppMessageTimestamp !== null &&
      Date.parse(station.latestOcppMessageTimestamp) <
        Date.parse(at) -
          missedHeartbeats * (station.heartbeatInterval || defaultHeartbeatInterval) * 1000
        ? [
            {
              tenantId: station.tenantId,
              stationId: station.stationId,
              latestOcppMessageTimestamp: station.latestOcppMessageTimestamp,
            },
          ]
        : [],
    );
  }

  async readTenantIds(): Promise<number[]> {
    return this.tenantIds;
  }

  async readSlowResponseSamples(
    tenantId: number,
    since: string,
    sampleSize: number,
    thresholdMs: number,
  ): Promise<ResponseLatencySample[]> {
    return this.slowSamples.flatMap(({ tenantId: sampleTenantId, ...sample }) =>
      sampleTenantId === tenantId &&
      Date.parse(sample.earliestTimestamp) >= Date.parse(since) &&
      sample.sampleSize === sampleSize &&
      sample.averageMs > thresholdMs
        ? [sample]
        : [],
    );
  }

  private _session(subject: NetworkAlertSubject): INetworkAlertSession {
    return {
      findOpen: async () =>
        this.alerts
          .filter(
            (alert) =>
              alert.tenantId === subject.tenantId &&
              alert.type === subject.type &&
              alert.stationId === subject.stationId &&
              (alert.connectorId ?? null) === (subject.connectorId ?? null) &&
              alert.status !== 'Resolved',
          )
          .at(-1),
      createAlert: async (alert) => {
        const created = NetworkAlertSchema.parse({
          ...alert,
          id: this._nextId++,
          tenantId: subject.tenantId,
        });
        this.alerts.push(created);
        return created;
      },
      updateAlert: async (id: number, values: NetworkAlertUpdate) => {
        const index = this.alerts.findIndex((alert) => alert.id === id);
        this.alerts[index] = NetworkAlertSchema.parse({ ...this.alerts[index], ...values });
      },
      addOccurrence: async (occurrence: NetworkAlertOccurrenceCreate) => {
        this.occurrences.push(
          NetworkAlertOccurrenceSchema.parse({
            ...occurrence,
            id: this._nextId++,
            tenantId: subject.tenantId,
          }),
        );
      },
      countOccurrencesSince: async (alertId: number, since: string) =>
        this.occurrencesOf(alertId).filter(
          (occurrence) => Date.parse(occurrence.occurredAt) >= Date.parse(since),
        ).length,
      findLatestOccurrence: async (alertId: number) =>
        this.occurrencesOf(alertId)
          .slice()
          .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
          .at(-1),
      findLatestCallFailure: async (alertId, reason, origin) =>
        this.occurrencesOf(alertId)
          .filter(
            (occurrence) =>
              occurrence.type === 'OcppCallFailures' &&
              occurrence.details.reason === reason &&
              occurrence.details.origin === origin,
          )
          .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt))
          .at(-1),
      updateOccurrenceDetails: async (id: number, details) => {
        const index = this.occurrences.findIndex((occurrence) => occurrence.id === id);
        this.occurrences[index] = NetworkAlertOccurrenceSchema.parse({
          ...this.occurrences[index],
          details,
        });
      },
    };
  }
}
