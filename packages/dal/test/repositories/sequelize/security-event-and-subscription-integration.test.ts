// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { SystemConfig } from '@citrineos/types';
import {
  SequelizeSecurityEventRepository,
  SequelizeSubscriptionRepository,
  Subscription,
} from '../../../index.js';
// Not re-exported from the package barrel.
import { SecurityEvent } from '@dal/models/security-event.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';
import { aSecurityEventNotificationRequest } from '../../providers/security-event.js';

// SequelizeSecurityEventRepository stores SecurityEventNotification requests per
// station and reads them back by ocppConnectionName with an optional inclusive
// timestamp window. SequelizeSubscriptionRepository backs webhook subscriptions:
// create strips any client-supplied id and forces the tenant; reads and deletes
// go through the tenant-scoped base repository.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'cp001';
const OTHER_STATION = 'cp002';

const T1 = '2025-03-01T00:00:00.000Z';
const T2 = '2025-03-02T00:00:00.000Z';
const T3 = '2025-03-03T00:00:00.000Z';

let h: PgHarness;

beforeAll(async () => {
  h = await startPgHarness();
}, 90_000);

afterAll(async () => {
  await h.stop();
});

beforeEach(async () => {
  await resetDb(h);
});

function makeSecurityEventRepo(): SequelizeSecurityEventRepository {
  return new SequelizeSecurityEventRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

function makeSubscriptionRepo(): SequelizeSubscriptionRepository {
  return new SequelizeSubscriptionRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

// Three events on one station spanning T1..T3 plus one on another station.
async function seedTimeline(repo: SequelizeSecurityEventRepository): Promise<void> {
  await repo.createByStationId(
    TENANT_A,
    aSecurityEventNotificationRequest({ type: 'FirmwareUpdated', timestamp: T1 }),
    STATION,
  );
  await repo.createByStationId(
    TENANT_A,
    aSecurityEventNotificationRequest({ type: 'SettingSystemTime', timestamp: T2 }),
    STATION,
  );
  await repo.createByStationId(
    TENANT_A,
    aSecurityEventNotificationRequest({ type: 'MemoryExhaustion', timestamp: T3 }),
    STATION,
  );
  await repo.createByStationId(
    TENANT_A,
    aSecurityEventNotificationRequest({ type: 'InvalidMessages', timestamp: T2 }),
    OTHER_STATION,
  );
}

function timestampsOf(rows: SecurityEvent[]): string[] {
  return rows.map((r) => r.timestamp).sort();
}

// Plain object shaped like a deserialized JSON body, the input create documents.
function aSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    ocppConnectionName: STATION,
    url: 'https://csms.example.com/webhook',
    onConnect: true,
    ...overrides,
  } as unknown as Subscription;
}

describe('SequelizeSecurityEventRepository', () => {
  it('createByStationId persists the request under the station and tenant', async () => {
    const created = await makeSecurityEventRepo().createByStationId(
      TENANT_A,
      aSecurityEventNotificationRequest({
        type: 'InvalidFirmwareSignature',
        timestamp: T1,
        techInfo: 'signature check failed',
      }),
      STATION,
    );

    const row = await SecurityEvent.findByPk(created.id);
    expect(row).not.toBeNull();
    expect(row!.ocppConnectionName).toBe(STATION);
    expect(row!.type).toBe('InvalidFirmwareSignature');
    expect(row!.timestamp).toBe(T1);
    expect(row!.techInfo).toBe('signature check failed');
    expect(row!.tenantId).toBe(TENANT_A);
    expect(await SecurityEvent.count()).toBe(1);
  });

  it('read without bounds returns every event for the station only', async () => {
    const repo = makeSecurityEventRepo();
    await seedTimeline(repo);

    const rows = await repo.readByStationIdAndTimestamps(TENANT_A, STATION);

    expect(rows).toHaveLength(3);
    expect(timestampsOf(rows)).toEqual([T1, T2, T3]);
    expect(rows.every((r) => r.ocppConnectionName === STATION)).toBe(true);
  });

  it('from bound is inclusive and drops earlier events', async () => {
    const repo = makeSecurityEventRepo();
    await seedTimeline(repo);

    const rows = await repo.readByStationIdAndTimestamps(TENANT_A, STATION, new Date(T2));

    expect(timestampsOf(rows)).toEqual([T2, T3]);
  });

  it('to bound is inclusive and drops later events', async () => {
    const repo = makeSecurityEventRepo();
    await seedTimeline(repo);

    const rows = await repo.readByStationIdAndTimestamps(
      TENANT_A,
      STATION,
      undefined,
      new Date(T2),
    );

    expect(timestampsOf(rows)).toEqual([T1, T2]);
  });

  it('from and to together select the closed range', async () => {
    const repo = makeSecurityEventRepo();
    await seedTimeline(repo);

    const rows = await repo.readByStationIdAndTimestamps(
      TENANT_A,
      STATION,
      new Date(T2),
      new Date(T2),
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].timestamp).toBe(T2);
    expect(rows[0].type).toBe('SettingSystemTime');
  });

  it("does not return another tenant's events for the same station", async () => {
    const repo = makeSecurityEventRepo();
    await repo.createByStationId(
      TENANT_A,
      aSecurityEventNotificationRequest({ type: 'FirmwareUpdated', timestamp: T1 }),
      STATION,
    );
    await repo.createByStationId(
      TENANT_B,
      aSecurityEventNotificationRequest({ type: 'MemoryExhaustion', timestamp: T1 }),
      STATION,
    );

    const forB = await repo.readByStationIdAndTimestamps(TENANT_B, STATION);

    expect(forB).toHaveLength(1);
    expect(forB[0].type).toBe('MemoryExhaustion');
    expect(forB[0].tenantId).toBe(TENANT_B);
    expect(await SecurityEvent.count()).toBe(2);
  });

  it('deleteByKey removes the event and returns it', async () => {
    const repo = makeSecurityEventRepo();
    const created = await repo.createByStationId(
      TENANT_A,
      aSecurityEventNotificationRequest({ type: 'FirmwareUpdated', timestamp: T1 }),
      STATION,
    );

    const deleted = await repo.deleteByKey(TENANT_A, String(created.id));

    expect(deleted).toBeDefined();
    expect(deleted!.id).toBe(created.id);
    expect(deleted!.type).toBe('FirmwareUpdated');
    expect(await SecurityEvent.count()).toBe(0);
  });

  it('deleteByKey under the wrong tenant returns undefined and keeps the row', async () => {
    const repo = makeSecurityEventRepo();
    const created = await repo.createByStationId(
      TENANT_A,
      aSecurityEventNotificationRequest({ type: 'FirmwareUpdated', timestamp: T1 }),
      STATION,
    );

    const deleted = await repo.deleteByKey(TENANT_B, String(created.id));

    expect(deleted).toBeUndefined();
    expect(await SecurityEvent.count()).toBe(1);
  });

  it('createByStationId is rejected when the tenant does not exist', async () => {
    await expect(
      makeSecurityEventRepo().createByStationId(
        99,
        aSecurityEventNotificationRequest({ timestamp: T1 }),
        STATION,
      ),
    ).rejects.toMatchObject({ name: 'SequelizeForeignKeyConstraintError' });
    expect(await SecurityEvent.count()).toBe(0);
  });
});

describe('SequelizeSubscriptionRepository', () => {
  it('create strips a client-supplied id, forces the tenant, and applies flag defaults', async () => {
    const created = await makeSubscriptionRepo().create(
      TENANT_A,
      aSubscription({ id: 4242, tenantId: TENANT_B }),
    );

    expect(created.id).not.toBe(4242);
    expect(created.tenantId).toBe(TENANT_A);

    const row = await Subscription.findByPk(created.id);
    expect(row).not.toBeNull();
    expect(row!.ocppConnectionName).toBe(STATION);
    expect(row!.url).toBe('https://csms.example.com/webhook');
    expect(row!.onConnect).toBe(true);
    expect(row!.onClose).toBe(false);
    expect(row!.onMessage).toBe(false);
    expect(row!.sentMessage).toBe(false);
    expect(row!.messageRegexFilter).toBeNull();
    expect(row!.tenantId).toBe(TENANT_A);
  });

  it("readAllByStationId returns only that station's subscriptions", async () => {
    const repo = makeSubscriptionRepo();
    await repo.create(TENANT_A, aSubscription({ url: 'https://a.example/1' }));
    await repo.create(TENANT_A, aSubscription({ url: 'https://a.example/2', onMessage: true }));
    await repo.create(
      TENANT_A,
      aSubscription({ ocppConnectionName: OTHER_STATION, url: 'https://a.example/3' }),
    );

    const forStation = await repo.readAllByStationId(TENANT_A, STATION);
    const forOther = await repo.readAllByStationId(TENANT_A, OTHER_STATION);

    expect(forStation.map((s) => s.url).sort()).toEqual([
      'https://a.example/1',
      'https://a.example/2',
    ]);
    expect(forOther).toHaveLength(1);
    expect(forOther[0].url).toBe('https://a.example/3');
  });

  it("readAllByStationId does not leak another tenant's subscriptions", async () => {
    const repo = makeSubscriptionRepo();
    await repo.create(TENANT_A, aSubscription({ url: 'https://tenant-a.example/hook' }));
    await repo.create(TENANT_B, aSubscription({ url: 'https://tenant-b.example/hook' }));

    const forB = await repo.readAllByStationId(TENANT_B, STATION);

    expect(forB).toHaveLength(1);
    expect(forB[0].url).toBe('https://tenant-b.example/hook');
    expect(forB[0].tenantId).toBe(TENANT_B);
    expect(await Subscription.count()).toBe(2);
  });

  it('readByKey honours the tenant', async () => {
    const repo = makeSubscriptionRepo();
    const created = await repo.create(TENANT_A, aSubscription());

    const forB = await repo.readByKey(TENANT_B, created.id);
    const forA = await repo.readByKey(TENANT_A, created.id);

    expect(forB).toBeUndefined();
    expect(forA).toBeDefined();
    expect(forA!.url).toBe('https://csms.example.com/webhook');
  });

  it('deleteByKey removes the subscription and returns it', async () => {
    const repo = makeSubscriptionRepo();
    const created = await repo.create(TENANT_A, aSubscription());

    const deleted = await repo.deleteByKey(TENANT_A, String(created.id));

    expect(deleted).toBeDefined();
    expect(deleted!.id).toBe(created.id);
    expect(deleted!.url).toBe('https://csms.example.com/webhook');
    expect(await Subscription.count()).toBe(0);
    expect(await repo.readAllByStationId(TENANT_A, STATION)).toHaveLength(0);
  });

  it('deleteByKey under the wrong tenant returns undefined and keeps the row', async () => {
    const repo = makeSubscriptionRepo();
    const created = await repo.create(TENANT_A, aSubscription());

    const deleted = await repo.deleteByKey(TENANT_B, String(created.id));

    expect(deleted).toBeUndefined();
    expect(await Subscription.count()).toBe(1);
  });

  it('create is rejected when the tenant does not exist', async () => {
    await expect(makeSubscriptionRepo().create(99, aSubscription())).rejects.toMatchObject({
      name: 'SequelizeForeignKeyConstraintError',
    });
    expect(await Subscription.count()).toBe(0);
  });
});
