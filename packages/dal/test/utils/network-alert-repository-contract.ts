// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  MessageOrigin,
  MessageTypeId,
  type NetworkAlertCreate,
  type NetworkAlertOccurrenceCreate,
  OCPPVersion,
} from '@citrineos/types';
import {
  Boot,
  ChargingStation,
  Connector,
  Evse,
  NetworkAlert,
  NetworkAlertConfig,
  OCPPMessage,
} from '@dal/db/sequelize/index.js';
import type { NetworkAlertSubject } from '@dal/interfaces/projections/network-alert.js';
import type {
  INetworkAlertConfigRepository,
  INetworkAlertRepository,
} from '@dal/repositories/repositories.js';

// Behaviour both ORMs' network alert repositories must share, run by each ORM's integration suite
// against the harness database. Fixtures are written through the sequelize models, which own the
// schema in these suites.

export const TENANT_A = 1;
export const TENANT_B = 2;

const T0 = '2026-10-01T10:00:00.000Z';
const T1 = '2026-10-01T10:05:00.000Z';
const T2 = '2026-10-01T10:10:00.000Z';
const T3 = '2026-10-01T10:15:00.000Z';

type ConnectivityAlertCreate = Extract<NetworkAlertCreate, { type: 'StationConnectivity' }>;
type ConnectorAlertCreate = Extract<NetworkAlertCreate, { type: 'ConnectorStatus' }>;
type ConnectivityOccurrenceCreate = Extract<
  NetworkAlertOccurrenceCreate,
  { type: 'StationConnectivity' }
>;

interface StationOptions {
  isOnline?: boolean;
  latestOcppMessageTimestamp?: string | null;
}

async function aStation(
  tenantId: number,
  ocppConnectionName: string,
  { isOnline = false, latestOcppMessageTimestamp = null }: StationOptions = {},
): Promise<number> {
  const station = await ChargingStation.create({
    ocppConnectionName,
    isOnline,
    latestOcppMessageTimestamp,
    tenantId,
  });
  return station.id;
}

async function aConnector(tenantId: number, stationId: number, connectorId: number) {
  const evse = await Evse.create({ tenantId, stationId, evseTypeId: connectorId });
  const connector = await Connector.create({
    tenantId,
    stationId,
    evseId: evse.id,
    connectorId,
    evseTypeConnectorId: 1,
    status: 'Available',
    timestamp: T0,
  });
  return { evseId: evse.id, connectorId: connector.id };
}

function aConnectivityAlert(
  stationId: number | null,
  overrides: Partial<ConnectivityAlertCreate> = {},
): ConnectivityAlertCreate {
  return {
    type: 'StationConnectivity',
    severity: 'Critical',
    status: 'Active',
    stationId,
    firstSeenAt: T0,
    lastSeenAt: T0,
    occurrenceCount: 1,
    details: { offlineSince: T0 },
    ...overrides,
  };
}

function aConnectorAlert(
  stationId: number,
  connectorId: number | null,
  overrides: Partial<ConnectorAlertCreate> = {},
): ConnectorAlertCreate {
  return {
    type: 'ConnectorStatus',
    severity: 'Warning',
    status: 'Active',
    stationId,
    connectorId,
    firstSeenAt: T0,
    lastSeenAt: T0,
    occurrenceCount: 1,
    details: { status: 'Faulted', errorCode: null },
    ...overrides,
  };
}

function anOccurrence(alertId: number, occurredAt: string): ConnectivityOccurrenceCreate {
  return {
    alertId,
    type: 'StationConnectivity',
    occurredAt,
    severity: 'Critical',
    details: { durationSeconds: null },
  };
}

async function aBoot(tenantId: number, stationId: number, heartbeatInterval: number | null) {
  await Boot.create({ tenantId, stationId, heartbeatInterval, status: 'Accepted' });
}

/** A Call and the CallResult answering it `latencyMs` later, linked as the trigger links them. */
async function anExchange(
  tenantId: number,
  stationId: number,
  correlationId: string,
  respondedAt: string,
  latencyMs: number,
  responder: MessageOrigin,
): Promise<number> {
  const caller =
    responder === MessageOrigin.ChargingStation
      ? MessageOrigin.ChargingStationManagementSystem
      : MessageOrigin.ChargingStation;
  const common = { tenantId, stationId, correlationId, protocol: OCPPVersion.OCPP2_0_1 };
  const call = await OCPPMessage.create({
    ...common,
    origin: caller,
    type: MessageTypeId.Call,
    action: 'Heartbeat',
    raw: '[2]',
    timestamp: new Date(Date.parse(respondedAt) - latencyMs).toISOString(),
  });
  const response = await OCPPMessage.create({
    ...common,
    origin: responder,
    type: MessageTypeId.CallResult,
    action: 'Heartbeat',
    raw: '[3]',
    timestamp: respondedAt,
    requestMessageId: call.id,
  });
  return response.id;
}

function connectivitySubject(tenantId: number, stationId: number): NetworkAlertSubject {
  return { tenantId, type: 'StationConnectivity', stationId };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

export function networkAlertRepositoryContract(
  makeRepo: () => INetworkAlertRepository,
  makeConfigRepo: () => INetworkAlertConfigRepository,
): void {
  describe('session.createAlert and findOpen', () => {
    it('returns the created alert as a parsed DTO with ISO timestamps', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const subject = connectivitySubject(TENANT_A, stationId);

      const created = await makeRepo().withSubjectLock(subject, (session) =>
        session.createAlert(aConnectivityAlert(stationId)),
      );
      const found = await makeRepo().withSubjectLock(subject, (session) => session.findOpen());

      expect(created.id).toEqual(expect.any(Number));
      expect(found).toMatchObject({
        id: created.id,
        type: 'StationConnectivity',
        severity: 'Critical',
        status: 'Active',
        stationId,
        firstSeenAt: T0,
        lastSeenAt: T0,
        occurrenceCount: 1,
        details: { offlineSince: T0 },
        tenantId: TENANT_A,
      });
      expect(found?.connectorId ?? null).toBeNull();
      expect(found?.resolvedAt ?? null).toBeNull();
    });

    it('ignores resolved alerts', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const subject = connectivitySubject(TENANT_A, stationId);

      const found = await makeRepo().withSubjectLock(subject, async (session) => {
        await session.createAlert(
          aConnectivityAlert(stationId, {
            status: 'Resolved',
            resolvedAt: T1,
            resolvedBy: 'Automatic',
          }),
        );
        return session.findOpen();
      });

      expect(found).toBeUndefined();
    });

    it("ignores another tenant's alert and another station's alert", async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const otherStationId = await aStation(TENANT_A, 'cp002');
      const repo = makeRepo();
      // The station FK does not check tenants, so a tenant B alert can name a tenant A station.
      await repo.withSubjectLock(connectivitySubject(TENANT_B, stationId), (session) =>
        session.createAlert(aConnectivityAlert(stationId)),
      );
      await repo.withSubjectLock(connectivitySubject(TENANT_A, otherStationId), (session) =>
        session.createAlert(aConnectivityAlert(otherStationId)),
      );

      const found = await repo.withSubjectLock(connectivitySubject(TENANT_A, stationId), (s) =>
        s.findOpen(),
      );

      expect(found).toBeUndefined();
      expect(await NetworkAlert.count()).toBe(2);
    });

    it('matches a station-level subject to the null-connector alert only, and vice versa', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const { connectorId } = await aConnector(TENANT_A, stationId, 1);
      const repo = makeRepo();
      const stationSubject: NetworkAlertSubject = {
        tenantId: TENANT_A,
        type: 'ConnectorStatus',
        stationId,
      };
      const connectorSubject: NetworkAlertSubject = { ...stationSubject, connectorId };

      const stationLevel = await repo.withSubjectLock(stationSubject, (session) =>
        session.createAlert(aConnectorAlert(stationId, null)),
      );
      const connectorLevel = await repo.withSubjectLock(connectorSubject, (session) =>
        session.createAlert(aConnectorAlert(stationId, connectorId)),
      );

      const foundForStation = await repo.withSubjectLock(stationSubject, (s) => s.findOpen());
      const foundForConnector = await repo.withSubjectLock(connectorSubject, (s) => s.findOpen());
      const foundForNullConnector = await repo.withSubjectLock(
        { ...stationSubject, connectorId: null },
        (s) => s.findOpen(),
      );

      expect(foundForStation?.id).toBe(stationLevel.id);
      expect(foundForNullConnector?.id).toBe(stationLevel.id);
      expect(foundForConnector?.id).toBe(connectorLevel.id);
      expect(foundForConnector?.connectorId).toBe(connectorId);
    });
  });

  describe('session.updateAlert', () => {
    it('writes severity, status, lastSeenAt, occurrenceCount, details and the resolution', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const subject = connectivitySubject(TENANT_A, stationId);
      const repo = makeRepo();
      const created = await repo.withSubjectLock(subject, (session) =>
        session.createAlert(aConnectivityAlert(stationId)),
      );
      const id = created.id ?? -1;

      await repo.withSubjectLock(subject, (session) =>
        session.updateAlert(id, {
          severity: 'Warning',
          status: 'Resolved',
          lastSeenAt: T2,
          occurrenceCount: 3,
          details: { offlineSince: null },
          resolvedAt: T3,
          resolvedBy: 'UserAction',
        }),
      );

      const row = await NetworkAlert.findByPk(id);
      expect(row?.get({ plain: true })).toMatchObject({
        severity: 'Warning',
        status: 'Resolved',
        firstSeenAt: T0,
        lastSeenAt: T2,
        occurrenceCount: 3,
        details: { offlineSince: null },
        resolvedAt: T3,
        resolvedBy: 'UserAction',
      });
    });

    it('clears resolvedAt when given null', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const subject = connectivitySubject(TENANT_A, stationId);
      const repo = makeRepo();
      const created = await repo.withSubjectLock(subject, (session) =>
        session.createAlert(aConnectivityAlert(stationId, { status: 'Resolved', resolvedAt: T1 })),
      );
      const id = created.id ?? -1;

      await repo.withSubjectLock(subject, (session) =>
        session.updateAlert(id, { status: 'Active', resolvedAt: null, resolvedBy: null }),
      );

      const reopened = await repo.withSubjectLock(subject, (session) => session.findOpen());
      expect(reopened?.id).toBe(id);
      expect(reopened?.resolvedAt ?? null).toBeNull();
      expect(reopened?.resolvedBy ?? null).toBeNull();
    });

    it("does not touch another tenant's alert", async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const repo = makeRepo();
      const created = await repo.withSubjectLock(connectivitySubject(TENANT_A, stationId), (s) =>
        s.createAlert(aConnectivityAlert(stationId)),
      );
      const id = created.id ?? -1;

      await repo.withSubjectLock(connectivitySubject(TENANT_B, stationId), (s) =>
        s.updateAlert(id, { severity: 'Info' }),
      );

      expect((await NetworkAlert.findByPk(id))?.severity).toBe('Critical');
    });
  });

  describe('occurrences', () => {
    it('counts occurrences at or after since, for that alert only', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const otherStationId = await aStation(TENANT_A, 'cp002');
      const repo = makeRepo();
      const other = await repo.withSubjectLock(
        connectivitySubject(TENANT_A, otherStationId),
        async (session) => {
          const alert = await session.createAlert(aConnectivityAlert(otherStationId));
          await session.addOccurrence(anOccurrence(alert.id ?? -1, T2));
          return alert;
        },
      );

      const counts = await repo.withSubjectLock(
        connectivitySubject(TENANT_A, stationId),
        async (session) => {
          const alert = await session.createAlert(aConnectivityAlert(stationId));
          const alertId = alert.id ?? -1;
          await session.addOccurrence(anOccurrence(alertId, T0));
          await session.addOccurrence(anOccurrence(alertId, T1));
          await session.addOccurrence(anOccurrence(alertId, T2));
          return {
            sinceT1: await session.countOccurrencesSince(alertId, T1),
            sinceT3: await session.countOccurrencesSince(alertId, T3),
            other: await session.countOccurrencesSince(other.id ?? -1, T0),
          };
        },
      );

      expect(counts).toEqual({ sinceT1: 2, sinceT3: 0, other: 1 });
    });

    it('findLatestOccurrence returns the latest by occurredAt, not by insertion order', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const repo = makeRepo();

      const latest = await repo.withSubjectLock(
        connectivitySubject(TENANT_A, stationId),
        async (session) => {
          const alert = await session.createAlert(aConnectivityAlert(stationId));
          const alertId = alert.id ?? -1;
          await session.addOccurrence(anOccurrence(alertId, T2));
          await session.addOccurrence(anOccurrence(alertId, T0));
          return session.findLatestOccurrence(alertId);
        },
      );

      expect(latest).toMatchObject({
        type: 'StationConnectivity',
        occurredAt: T2,
        severity: 'Critical',
        details: { durationSeconds: null },
        tenantId: TENANT_A,
      });
    });

    it('findLatestCallFailure returns the latest occurrence of that reason from that side', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const repo = makeRepo();
      const subject: NetworkAlertSubject = {
        tenantId: TENANT_A,
        type: 'OcppCallFailures',
        stationId,
      };

      const found = await repo.withSubjectLock(subject, async (session) => {
        const alert = await session.createAlert({
          type: 'OcppCallFailures',
          severity: 'Warning',
          status: 'Active',
          stationId,
          firstSeenAt: T0,
          lastSeenAt: T0,
          occurrenceCount: 1,
          details: { reasons: ['Slow'], actions: ['Heartbeat'] },
        });
        const alertId = alert.id ?? -1;
        const occurrence = (
          occurredAt: string,
          reason: 'Slow' | 'CallError',
          origin: MessageOrigin,
        ) =>
          session.addOccurrence({
            type: 'OcppCallFailures',
            alertId,
            occurredAt,
            severity: 'Warning',
            details: { reason, origin, action: 'Heartbeat', correlationId: occurredAt },
          });
        await occurrence(T0, 'Slow', MessageOrigin.ChargingStation);
        await occurrence(T1, 'Slow', MessageOrigin.ChargingStation);
        await occurrence(T2, 'Slow', MessageOrigin.ChargingStationManagementSystem);
        await occurrence(T3, 'CallError', MessageOrigin.ChargingStation);
        return session.findLatestCallFailure(alertId, 'Slow', MessageOrigin.ChargingStation);
      });

      expect(found?.occurredAt).toBe(T1);
    });

    it('findLatestOccurrence returns undefined for an alert without occurrences', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');

      const latest = await makeRepo().withSubjectLock(
        connectivitySubject(TENANT_A, stationId),
        async (session) => {
          const alert = await session.createAlert(aConnectivityAlert(stationId));
          return session.findLatestOccurrence(alert.id ?? -1);
        },
      );

      expect(latest).toBeUndefined();
    });

    it('updateOccurrenceDetails replaces the details', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');

      const updated = await makeRepo().withSubjectLock(
        connectivitySubject(TENANT_A, stationId),
        async (session) => {
          const alert = await session.createAlert(aConnectivityAlert(stationId));
          const alertId = alert.id ?? -1;
          await session.addOccurrence(anOccurrence(alertId, T0));
          const occurrence = await session.findLatestOccurrence(alertId);
          await session.updateOccurrenceDetails(occurrence?.id ?? -1, { durationSeconds: 42 });
          return session.findLatestOccurrence(alertId);
        },
      );

      expect(updated?.details).toEqual({ durationSeconds: 42 });
    });
  });

  describe('withSubjectLock', () => {
    it('serializes concurrent find-or-create on the same subject into one alert', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const subject = connectivitySubject(TENANT_A, stationId);
      const repo = makeRepo();
      const findOrCreate = () =>
        repo.withSubjectLock(subject, async (session) => {
          const open = await session.findOpen();
          if (open) {
            return open;
          }
          await sleep(100);
          return session.createAlert(aConnectivityAlert(stationId));
        });

      const [first, second] = await Promise.all([findOrCreate(), findOrCreate()]);

      expect(await NetworkAlert.count()).toBe(1);
      expect(first.id).toBe(second.id);
    });

    it('does not block a different subject', async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const otherStationId = await aStation(TENANT_A, 'cp002');
      const repo = makeRepo();
      const entered = deferred();
      const release = deferred();

      const holding = repo.withSubjectLock(connectivitySubject(TENANT_A, stationId), async () => {
        entered.resolve();
        await release.promise;
      });
      await entered.promise;

      const other = await repo.withSubjectLock(
        connectivitySubject(TENANT_A, otherStationId),
        async () => 'ran',
      );
      release.resolve();
      await holding;

      expect(other).toBe('ran');
    });
  });

  describe('withSweepLock', () => {
    it('runs fn and resolves true when the lock is free', async () => {
      let ran = false;

      const acquired = await makeRepo().withSweepLock(async () => {
        ran = true;
      });

      expect(acquired).toBe(true);
      expect(ran).toBe(true);
    });

    it('resolves false without running fn while another sweep holds the lock', async () => {
      const repo = makeRepo();
      const entered = deferred();
      const release = deferred();
      let secondRan = false;

      const holding = repo.withSweepLock(async () => {
        entered.resolve();
        await release.promise;
      });
      await entered.promise;

      const second = await repo.withSweepLock(async () => {
        secondRan = true;
      });
      release.resolve();

      expect(second).toBe(false);
      expect(secondRan).toBe(false);
      expect(await holding).toBe(true);
      expect(await repo.withSweepLock(async () => undefined)).toBe(true);
    });
  });

  describe('readOpenByType', () => {
    it('returns unresolved alerts of the type across tenants, with their station state', async () => {
      const stationA = await aStation(TENANT_A, 'cp001', {
        isOnline: true,
        latestOcppMessageTimestamp: T1,
      });
      const stationB = await aStation(TENANT_B, 'cp001');
      await aBoot(TENANT_A, stationA, 300);
      const repo = makeRepo();
      const create = (tenantId: number, stationId: number, alert: NetworkAlertCreate) =>
        repo.withSubjectLock(connectivitySubject(tenantId, stationId), (s) => s.createAlert(alert));

      const activeA = await create(TENANT_A, stationA, aConnectivityAlert(stationA));
      const acknowledgedB = await create(
        TENANT_B,
        stationB,
        aConnectivityAlert(stationB, { status: 'Acknowledged' }),
      );
      const stationless = await create(TENANT_A, stationA, aConnectivityAlert(null));
      await create(
        TENANT_A,
        stationA,
        aConnectivityAlert(stationA, { status: 'Resolved', resolvedAt: T1 }),
      );
      await create(TENANT_A, stationA, aConnectorAlert(stationA, null));

      const open = await repo.readOpenByType('StationConnectivity');

      const byId = new Map(open.map((entry) => [entry.alert.id, entry]));
      expect([...byId.keys()].sort()).toEqual(
        [activeA.id, acknowledgedB.id, stationless.id].sort(),
      );
      expect(byId.get(activeA.id)).toMatchObject({
        alert: { type: 'StationConnectivity', status: 'Active', tenantId: TENANT_A },
        station: { isOnline: true, latestOcppMessageTimestamp: T1, heartbeatInterval: 300 },
      });
      expect(byId.get(acknowledgedB.id)).toMatchObject({
        alert: { status: 'Acknowledged', tenantId: TENANT_B },
        station: { isOnline: false, latestOcppMessageTimestamp: null, heartbeatInterval: null },
      });
      expect(byId.get(stationless.id)?.station).toBeNull();
    });
  });

  describe('readSilentStations', () => {
    it("returns the tenant's online stations that missed their own heartbeats", async () => {
      // At T3 with two missed 60s heartbeats by default, the cutoff is two minutes before T3.
      const defaultInterval = await aStation(TENANT_A, 'default', {
        isOnline: true,
        latestOcppMessageTimestamp: T2,
      });
      const zeroInterval = await aStation(TENANT_A, 'zero', {
        isOnline: true,
        latestOcppMessageTimestamp: T2,
      });
      await aBoot(TENANT_A, zeroInterval, 0);
      const shortInterval = await aStation(TENANT_B, 'short', {
        isOnline: true,
        latestOcppMessageTimestamp: T2,
      });
      await aBoot(TENANT_B, shortInterval, 120);
      const longInterval = await aStation(TENANT_A, 'long', {
        isOnline: true,
        latestOcppMessageTimestamp: T0,
      });
      await aBoot(TENANT_A, longInterval, 600);
      await aStation(TENANT_A, 'recent', {
        isOnline: true,
        latestOcppMessageTimestamp: '2026-10-01T10:14:00.000Z',
      });
      await aStation(TENANT_A, 'offline', { isOnline: false, latestOcppMessageTimestamp: T0 });
      await aStation(TENANT_A, 'never', { isOnline: true, latestOcppMessageTimestamp: null });

      const repo = makeRepo();
      const silentA = await repo.readSilentStations(TENANT_A, T3, 60, 2);
      const silentB = await repo.readSilentStations(TENANT_B, T3, 60, 2);

      expect(silentA.sort((a, b) => a.stationId - b.stationId)).toEqual([
        { tenantId: TENANT_A, stationId: defaultInterval, latestOcppMessageTimestamp: T2 },
        { tenantId: TENANT_A, stationId: zeroInterval, latestOcppMessageTimestamp: T2 },
      ]);
      expect(silentB).toEqual([
        { tenantId: TENANT_B, stationId: shortInterval, latestOcppMessageTimestamp: T2 },
      ]);
    });
  });

  describe('readTenantIds', () => {
    it('returns every tenant', async () => {
      expect((await makeRepo().readTenantIds()).sort()).toEqual([TENANT_A, TENANT_B]);
    });
  });

  describe('readSlowResponseSamples', () => {
    const SINCE = '2000-01-01T00:00:00.000Z';

    it("averages each station's latest responses per responding side", async () => {
      const stationId = await aStation(TENANT_A, 'cp001');
      const fromStation = MessageOrigin.ChargingStation;
      await anExchange(TENANT_A, stationId, 'old', T0, 60_000, fromStation);
      await anExchange(TENANT_A, stationId, 'a', T1, 6_000, fromStation);
      const latest = await anExchange(TENANT_A, stationId, 'b', T2, 8_000, fromStation);
      await anExchange(
        TENANT_A,
        stationId,
        'ours',
        T2,
        9_000,
        MessageOrigin.ChargingStationManagementSystem,
      );

      const samples = await makeRepo().readSlowResponseSamples(TENANT_A, SINCE, 2, 5_000);

      expect(samples).toEqual([
        {
          stationId,
          origin: fromStation,
          sampleSize: 2,
          averageMs: 7_000,
          earliestTimestamp: T1,
          latestMessageId: latest,
          latestCorrelationId: 'b',
          latestAction: 'Heartbeat',
          latestTimestamp: T2,
        },
      ]);
    });

    it('leaves out a sample at or under the threshold, and one not yet full', async () => {
      const fast = await aStation(TENANT_A, 'fast');
      await anExchange(TENANT_A, fast, 'a', T1, 4_000, MessageOrigin.ChargingStation);
      await anExchange(TENANT_A, fast, 'b', T2, 6_000, MessageOrigin.ChargingStation);
      const sparse = await aStation(TENANT_A, 'sparse');
      await anExchange(TENANT_A, sparse, 'c', T2, 60_000, MessageOrigin.ChargingStation);

      expect(await makeRepo().readSlowResponseSamples(TENANT_A, SINCE, 2, 5_000)).toEqual([]);
    });

    it("leaves out other tenants' responses and those stored before since", async () => {
      const stationId = await aStation(TENANT_B, 'cp001');
      await anExchange(TENANT_B, stationId, 'a', T1, 60_000, MessageOrigin.ChargingStation);

      const repo = makeRepo();
      expect(await repo.readSlowResponseSamples(TENANT_A, SINCE, 1, 5_000)).toEqual([]);
      expect(
        await repo.readSlowResponseSamples(TENANT_B, '2999-01-01T00:00:00.000Z', 1, 5_000),
      ).toEqual([]);
    });
  });

  describe('config readByTenant', () => {
    it("returns that tenant's parsed rows only", async () => {
      await NetworkAlertConfig.create({
        tenantId: TENANT_A,
        type: 'StationConnectivity',
        enabled: true,
        rules: { disconnectSeverity: 'Warning' },
      });
      await NetworkAlertConfig.create({
        tenantId: TENANT_A,
        type: 'ConnectorStatus',
        enabled: false,
        rules: null,
      });
      await NetworkAlertConfig.create({
        tenantId: TENANT_B,
        type: 'StationConnectivity',
        enabled: false,
        rules: null,
      });

      const configs = await makeConfigRepo().readByTenant(TENANT_A);

      expect(configs.sort((a, b) => a.type.localeCompare(b.type))).toEqual([
        expect.objectContaining({
          type: 'ConnectorStatus',
          enabled: false,
          rules: null,
          tenantId: TENANT_A,
        }),
        expect.objectContaining({
          type: 'StationConnectivity',
          enabled: true,
          rules: { disconnectSeverity: 'Warning' },
          tenantId: TENANT_A,
        }),
      ]);
    });

    it('returns an empty list for a tenant without rows', async () => {
      expect(await makeConfigRepo().readByTenant(TENANT_B)).toEqual([]);
    });
  });
}
