// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import type { SubscriptionDto } from '@citrineos/types';
import {
  ChangeConfiguration,
  LocalListAuthorization,
  LocalListVersion,
  SendLocalList,
  Subscription,
} from '../../../index.js';
import { MessageInfo, SecurityEvent } from '@dal/db/sequelize/index.js';
import {
  DrizzleChangeConfigurationRepository,
  toChangeConfigurationDto,
} from '@dal/repositories/drizzle/change-configuration.js';
import {
  DrizzleLocalListAuthorizationRepository,
  toLocalListAuthorizationDto,
} from '@dal/repositories/drizzle/local-list-authorization.js';
import {
  DrizzleLocalListVersionRepository,
  toLocalListVersionDto,
} from '@dal/repositories/drizzle/local-list-version.js';
import {
  DrizzleMessageInfoRepository,
  toMessageInfoDto,
} from '@dal/repositories/drizzle/message-info.js';
import {
  DrizzleSecurityEventRepository,
  toSecurityEventDto,
} from '@dal/repositories/drizzle/security-event.js';
import {
  DrizzleSendLocalListRepository,
  toSendLocalListDto,
} from '@dal/repositories/drizzle/send-local-list.js';
import {
  DrizzleSubscriptionRepository,
  toSubscriptionDto,
} from '@dal/repositories/drizzle/subscription.js';
import type { ChangeConfigurationEntity } from '@dal/db/drizzle/schema/change-configuration.js';
import type { LocalListAuthorizationEntity } from '@dal/db/drizzle/schema/local-list-authorization.js';
import type { LocalListVersionEntity } from '@dal/db/drizzle/schema/local-list-version.js';
import type { MessageInfoEntity } from '@dal/db/drizzle/schema/message-info.js';
import type { SecurityEventEntity } from '@dal/db/drizzle/schema/security-event.js';
import type { SendLocalListEntity } from '@dal/db/drizzle/schema/send-local-list.js';
import type { SubscriptionEntity } from '@dal/db/drizzle/schema/subscription.js';
import { aSecurityEventNotificationRequest } from '../../providers/security-event.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// Lists/misc cluster: LocalListVersion, LocalListAuthorization, SendLocalList,
// SecurityEvent, Subscription, MessageInfo and ChangeConfiguration. SecurityEvent
// and Subscription implement their repository interfaces; the rest are Base-CRUD
// stubs, so those suites cover the shared findById/findAll/exists/countAll/
// updateById/deleteById paths over the sequelize-created schema plus each
// row-to-DTO mapper. The sequelize twins are covered by their own suites
// (security-event-and-subscription, component-and-change-configuration,
// reservation-and-message-info, local-auth-list), so these run drizzle-only.
//
// DrizzleMessageInfoRepository id-keyed base methods (findById, exists,
// updateById, deleteById) are left untested: messageInfoTable.id is the OCPP
// display-message id (non-unique per tenant), not the databaseId PK the
// sequelize layer keys on. See the note in the suite below.

const TENANT = 1;
const OTHER_TENANT = 2;
const STATION = 'CS-001';
const STATION_B = 'CS-002';
const TS = '2026-03-01T09:30:00.000Z';
const T10 = '2026-02-01T10:00:00.000Z';
const T12 = '2026-02-01T12:00:00.000Z';
const T14 = '2026-02-01T14:00:00.000Z';

let h: PgHarness;
let drizzlePool: pg.Pool;
let db: NodePgDatabase;

beforeAll(async () => {
  h = await startPgHarness();
  // Own pool: the DefaultDrizzleInstance singleton exposes no way to close it.
  drizzlePool = new pg.Pool({
    host: h.config.database.host,
    port: h.config.database.port,
    database: h.config.database.database,
    user: h.config.database.username,
    password: h.config.database.password,
  });
  db = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

const deps = () => ({ config: h.config, drizzleInstance: db });

async function aLocalListVersion(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const row = await LocalListVersion.create({
    ocppConnectionName: STATION,
    versionNumber: 1,
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { id: number };
}

async function aSendLocalList(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const row = await SendLocalList.create({
    ocppConnectionName: STATION,
    correlationId: 'corr-1',
    versionNumber: 2,
    updateType: 'Full',
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { id: number };
}

async function aLocalListAuthorization(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const row = await LocalListAuthorization.create({
    idToken: 'TAG-1',
    idTokenType: 'ISO14443',
    status: 'Accepted',
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { id: number };
}

async function aChangeConfiguration(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const row = await ChangeConfiguration.create({
    ocppConnectionName: STATION,
    key: 'HeartbeatInterval',
    value: '300',
    readonly: false,
    tenantId,
    ...overrides,
  } as any);
  return row as unknown as { id: number };
}

describe('DrizzleLocalListVersionRepository', () => {
  it('findById maps scalars and leaves relation fields unset', async () => {
    const repo = new DrizzleLocalListVersionRepository(deps());
    const row = await aLocalListVersion(TENANT, { versionNumber: 7 });

    const dto = await repo.findById(TENANT, row.id);

    expect(dto!.id).toBe(row.id);
    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.versionNumber).toBe(7);
    expect(dto!.localAuthorizationList).toBeUndefined();
    expect(dto!.customData).toBeUndefined();
    expect(dto!.tenantId).toBe(TENANT);
    expect(dto!.createdAt).toBeInstanceOf(Date);
  });

  it('findById, exists and countAll separate tenants sharing a station name', async () => {
    const repo = new DrizzleLocalListVersionRepository(deps());
    const own = await aLocalListVersion(TENANT, { versionNumber: 1 });
    await aLocalListVersion(OTHER_TENANT, { versionNumber: 9 });

    expect(await repo.findById(OTHER_TENANT, own.id)).toBeUndefined();
    expect(await repo.exists(TENANT, own.id)).toBe(true);
    expect(await repo.exists(OTHER_TENANT, own.id)).toBe(false);
    expect(await repo.countAll(TENANT)).toBe(1);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);

    const all = await repo.findAll(OTHER_TENANT);
    expect(all).toHaveLength(1);
    expect(all[0].versionNumber).toBe(9);
  });

  it('updateById bumps versionNumber only for the calling tenant', async () => {
    const repo = new DrizzleLocalListVersionRepository(deps());
    const own = await aLocalListVersion(TENANT, { versionNumber: 3 });

    expect(await repo.updateById(OTHER_TENANT, own.id, { versionNumber: 99 })).toBeUndefined();

    const updated = await repo.updateById(TENANT, own.id, { versionNumber: 4 });
    expect(updated!.versionNumber).toBe(4);

    const viaSequelize = await LocalListVersion.findByPk(own.id);
    expect(viaSequelize!.versionNumber).toBe(4);
  });

  it('updateById onto an existing station name violates the tenant-scoped unique index', async () => {
    const repo = new DrizzleLocalListVersionRepository(deps());
    await aLocalListVersion(TENANT);
    const other = await aLocalListVersion(TENANT, { ocppConnectionName: STATION_B });

    await expect(
      repo.updateById(TENANT, other.id, { ocppConnectionName: STATION }),
    ).rejects.toThrow(/Failed query: update "LocalListVersions"/);
    expect((await repo.findById(TENANT, other.id))!.ocppConnectionName).toBe(STATION_B);
  });

  it('deleteById returns the removed row once', async () => {
    const repo = new DrizzleLocalListVersionRepository(deps());
    const own = await aLocalListVersion(TENANT, { versionNumber: 5 });

    expect(await repo.deleteById(OTHER_TENANT, own.id)).toBeUndefined();
    expect(await LocalListVersion.count()).toBe(1);

    const deleted = await repo.deleteById(TENANT, own.id);
    expect(deleted!.versionNumber).toBe(5);
    expect(await LocalListVersion.count()).toBe(0);
    expect(await repo.deleteById(TENANT, own.id)).toBeUndefined();
  });
});

describe('DrizzleSendLocalListRepository', () => {
  it('findById maps correlationId, versionNumber and updateType', async () => {
    const repo = new DrizzleSendLocalListRepository(deps());
    const row = await aSendLocalList(TENANT, {
      correlationId: 'corr-42',
      versionNumber: 6,
      updateType: 'Differential',
    });

    const dto = await repo.findById(TENANT, row.id);

    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.correlationId).toBe('corr-42');
    expect(dto!.versionNumber).toBe(6);
    expect(dto!.updateType).toBe('Differential');
    expect(dto!.localAuthorizationList).toBeUndefined();
    expect(dto!.tenantId).toBe(TENANT);
  });

  it('findAll and deleteById stay within the calling tenant', async () => {
    const repo = new DrizzleSendLocalListRepository(deps());
    const own = await aSendLocalList(TENANT, { correlationId: 'corr-own' });
    await aSendLocalList(OTHER_TENANT, { correlationId: 'corr-other' });

    const all = await repo.findAll(TENANT);
    expect(all).toHaveLength(1);
    expect(all[0].correlationId).toBe('corr-own');

    expect(await repo.deleteById(OTHER_TENANT, own.id)).toBeUndefined();
    const deleted = await repo.deleteById(TENANT, own.id);
    expect(deleted!.correlationId).toBe('corr-own');
    expect(await SendLocalList.count()).toBe(1);
  });

  it('updateById rejects an updateType beyond the varchar limit', async () => {
    const repo = new DrizzleSendLocalListRepository(deps());
    const row = await aSendLocalList(TENANT);

    await expect(repo.updateById(TENANT, row.id, { updateType: 'x'.repeat(300) })).rejects.toThrow(
      /Failed query: update "SendLocalLists"/,
    );
    expect((await repo.findById(TENANT, row.id))!.updateType).toBe('Full');
  });
});

describe('DrizzleLocalListAuthorizationRepository', () => {
  it('findById maps arrays, jsonb payloads and the expiry timestamp', async () => {
    const repo = new DrizzleLocalListAuthorizationRepository(deps());
    const row = await aLocalListAuthorization(TENANT, {
      allowedConnectorTypes: ['cType2', 'cCCS1'],
      disallowedEvseIdPrefixes: ['DE*'],
      additionalInfo: [{ additionalIdToken: 'alt-1', type: 'eMAID' }],
      cacheExpiryDateTime: TS,
      chargingPriority: 3,
      language1: 'en',
      personalMessage: { format: 'UTF8', content: 'welcome' },
    });

    const dto = await repo.findById(TENANT, row.id);

    expect(dto!.idToken).toBe('TAG-1');
    expect(dto!.idTokenType).toBe('ISO14443');
    expect(dto!.status).toBe('Accepted');
    expect(dto!.allowedConnectorTypes).toEqual(['cType2', 'cCCS1']);
    expect(dto!.disallowedEvseIdPrefixes).toEqual(['DE*']);
    expect(dto!.additionalInfo).toEqual([{ additionalIdToken: 'alt-1', type: 'eMAID' }]);
    expect(dto!.cacheExpiryDateTime).toBe(TS);
    expect(dto!.chargingPriority).toBe(3);
    expect(dto!.language1).toBe('en');
    expect(dto!.personalMessage).toEqual({ format: 'UTF8', content: 'welcome' });
    expect(dto!.groupAuthorizationId).toBeNull();
    expect(dto!.groupAuthorization).toBeUndefined();
    expect(dto!.authorizationId).toBeUndefined();
    expect(dto!.tenantId).toBe(TENANT);
  });

  it('exists and countAll are tenant-scoped', async () => {
    const repo = new DrizzleLocalListAuthorizationRepository(deps());
    const own = await aLocalListAuthorization(TENANT);
    await aLocalListAuthorization(TENANT, { idToken: 'TAG-2' });
    await aLocalListAuthorization(OTHER_TENANT, { idToken: 'TAG-3' });

    expect(await repo.exists(TENANT, own.id)).toBe(true);
    expect(await repo.exists(OTHER_TENANT, own.id)).toBe(false);
    expect(await repo.countAll(TENANT)).toBe(2);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });

  it('updateById rewrites status and priority for the calling tenant only', async () => {
    const repo = new DrizzleLocalListAuthorizationRepository(deps());
    const own = await aLocalListAuthorization(TENANT);

    expect(await repo.updateById(OTHER_TENANT, own.id, { status: 'Blocked' })).toBeUndefined();

    const updated = await repo.updateById(TENANT, own.id, {
      status: 'Blocked',
      chargingPriority: -2,
    });
    expect(updated!.status).toBe('Blocked');
    expect(updated!.chargingPriority).toBe(-2);

    const viaSequelize = await LocalListAuthorization.findByPk(own.id);
    expect(viaSequelize!.status).toBe('Blocked');
  });

  it('updateById rejects an idToken beyond the varchar limit', async () => {
    const repo = new DrizzleLocalListAuthorizationRepository(deps());
    const own = await aLocalListAuthorization(TENANT);

    await expect(repo.updateById(TENANT, own.id, { idToken: 'x'.repeat(300) })).rejects.toThrow(
      /Failed query: update "LocalListAuthorizations"/,
    );
    expect((await repo.findById(TENANT, own.id))!.idToken).toBe('TAG-1');
  });
});

describe('DrizzleSecurityEventRepository', () => {
  it('createByStationId injects the tenant, stores the parsed timestamp and emits created', async () => {
    const repo = new DrizzleSecurityEventRepository(deps());
    const emitted: unknown[][] = [];
    repo.on('created', (dtos: unknown[]) => emitted.push(dtos));

    const dto = await repo.createByStationId(
      TENANT,
      aSecurityEventNotificationRequest({ timestamp: TS, techInfo: 'cert expired' }),
      STATION,
    );

    expect(dto.type).toBe('SettingSystemTime');
    expect(dto.timestamp).toBe(TS);
    expect(dto.techInfo).toBe('cert expired');
    expect(dto.ocppConnectionName).toBe(STATION);
    expect(dto.tenantId).toBe(TENANT);
    expect(emitted).toHaveLength(1);

    const viaSequelize = await SecurityEvent.findByPk(dto.id!);
    expect(viaSequelize!.ocppConnectionName).toBe(STATION);
    expect(viaSequelize!.type).toBe('SettingSystemTime');
    expect(await SecurityEvent.count()).toBe(1);
  });

  it('readByStationIdAndTimestamps without bounds returns every event for the station', async () => {
    const repo = new DrizzleSecurityEventRepository(deps());
    await repo.createByStationId(
      TENANT,
      aSecurityEventNotificationRequest({ timestamp: T10 }),
      STATION,
    );
    await repo.createByStationId(
      TENANT,
      aSecurityEventNotificationRequest({ timestamp: T12, type: 'MemoryExhaustion' }),
      STATION,
    );
    await repo.createByStationId(
      TENANT,
      aSecurityEventNotificationRequest({ timestamp: T10 }),
      STATION_B,
    );
    await repo.createByStationId(
      OTHER_TENANT,
      aSecurityEventNotificationRequest({ timestamp: T10 }),
      STATION,
    );

    const own = await repo.readByStationIdAndTimestamps(TENANT, STATION);
    expect(own).toHaveLength(2);
    expect(own.map((e) => e.type).sort()).toEqual(['MemoryExhaustion', 'SettingSystemTime']);
    expect(await repo.readByStationIdAndTimestamps(OTHER_TENANT, STATION)).toHaveLength(1);
    expect(await repo.readByStationIdAndTimestamps(TENANT, 'GHOST')).toEqual([]);
  });

  it('readByStationIdAndTimestamps applies from, to and between bounds', async () => {
    const repo = new DrizzleSecurityEventRepository(deps());
    for (const timestamp of [T10, T12, T14]) {
      await repo.createByStationId(
        TENANT,
        aSecurityEventNotificationRequest({ timestamp }),
        STATION,
      );
    }
    const eleven = new Date('2026-02-01T11:00:00.000Z');
    const thirteen = new Date('2026-02-01T13:00:00.000Z');

    const fromOnly = await repo.readByStationIdAndTimestamps(TENANT, STATION, eleven);
    expect(fromOnly.map((e) => e.timestamp).sort()).toEqual([T12, T14]);

    const toOnly = await repo.readByStationIdAndTimestamps(TENANT, STATION, undefined, eleven);
    expect(toOnly.map((e) => e.timestamp)).toEqual([T10]);

    const between = await repo.readByStationIdAndTimestamps(TENANT, STATION, eleven, thirteen);
    expect(between.map((e) => e.timestamp)).toEqual([T12]);
  });

  it('deleteByKey deletes only within the calling tenant', async () => {
    const repo = new DrizzleSecurityEventRepository(deps());
    const dto = await repo.createByStationId(
      TENANT,
      aSecurityEventNotificationRequest({ timestamp: TS }),
      STATION,
    );

    expect(await repo.deleteByKey(OTHER_TENANT, String(dto.id!))).toBeUndefined();
    expect(await SecurityEvent.count()).toBe(1);

    const deleted = await repo.deleteByKey(TENANT, String(dto.id!));
    expect(deleted!.id).toBe(dto.id);
    expect(await SecurityEvent.count()).toBe(0);
    expect(await repo.deleteByKey(TENANT, String(dto.id!))).toBeUndefined();
  });

  it('createByStationId rejects techInfo beyond the varchar limit', async () => {
    const repo = new DrizzleSecurityEventRepository(deps());

    await expect(
      repo.createByStationId(
        TENANT,
        aSecurityEventNotificationRequest({ timestamp: TS, techInfo: 'x'.repeat(300) }),
        STATION,
      ),
    ).rejects.toThrow(/Failed query: insert into "SecurityEvents"/);
    expect(await SecurityEvent.count()).toBe(0);
  });
});

describe('DrizzleSubscriptionRepository', () => {
  it('create fills boolean defaults, assigns its own id and emits created', async () => {
    const repo = new DrizzleSubscriptionRepository(deps());
    const emitted: SubscriptionDto[][] = [];
    repo.on('created', (dtos: SubscriptionDto[]) => emitted.push(dtos));

    const created = await repo.create(TENANT, {
      id: 999,
      ocppConnectionName: STATION,
      onMessage: true,
      url: 'https://callback.example/hook',
    } as SubscriptionDto);

    expect(created.id).not.toBe(999);
    expect(created.onConnect).toBe(false);
    expect(created.onClose).toBe(false);
    expect(created.onMessage).toBe(true);
    expect(created.sentMessage).toBe(false);
    expect(created.messageRegexFilter).toBeNull();
    expect(created.url).toBe('https://callback.example/hook');
    expect(created.tenantId).toBe(TENANT);
    expect(emitted).toHaveLength(1);
    expect(emitted[0][0].url).toBe('https://callback.example/hook');

    const viaSequelize = await Subscription.findByPk(created.id!);
    expect(viaSequelize!.ocppConnectionName).toBe(STATION);
    expect(viaSequelize!.onMessage).toBe(true);
  });

  it('readAllByStationId filters by station and tenant', async () => {
    const repo = new DrizzleSubscriptionRepository(deps());
    await repo.create(TENANT, {
      ocppConnectionName: STATION,
      url: 'https://a.example',
    } as SubscriptionDto);
    await repo.create(TENANT, {
      ocppConnectionName: STATION,
      url: 'https://b.example',
      messageRegexFilter: 'Heartbeat',
    } as SubscriptionDto);
    await repo.create(TENANT, {
      ocppConnectionName: STATION_B,
      url: 'https://c.example',
    } as SubscriptionDto);
    await repo.create(OTHER_TENANT, {
      ocppConnectionName: STATION,
      url: 'https://d.example',
    } as SubscriptionDto);

    const own = await repo.readAllByStationId(TENANT, STATION);
    expect(own.map((s) => s.url).sort()).toEqual(['https://a.example', 'https://b.example']);
    expect(own.find((s) => s.url === 'https://b.example')!.messageRegexFilter).toBe('Heartbeat');

    const other = await repo.readAllByStationId(OTHER_TENANT, STATION);
    expect(other).toHaveLength(1);
    expect(other[0].url).toBe('https://d.example');
  });

  it('deleteByKey parses the key and stays tenant-scoped', async () => {
    const repo = new DrizzleSubscriptionRepository(deps());
    const created = await repo.create(TENANT, {
      ocppConnectionName: STATION,
      url: 'https://a.example',
    } as SubscriptionDto);

    expect(await repo.deleteByKey(OTHER_TENANT, String(created.id!))).toBeUndefined();
    expect(await Subscription.count()).toBe(1);

    const deleted = await repo.deleteByKey(TENANT, String(created.id!));
    expect(deleted!.url).toBe('https://a.example');
    expect(await Subscription.count()).toBe(0);
  });

  // A create without a url is not exercised: the sequelize model leaves the
  // url column nullable, so the row persists with url NULL even though the
  // drizzle schema declares .notNull() and SubscriptionSchema requires a string.
  it('create rejects a url beyond the varchar limit', async () => {
    const repo = new DrizzleSubscriptionRepository(deps());

    await expect(
      repo.create(TENANT, {
        ocppConnectionName: STATION,
        url: 'https://a.example/' + 'x'.repeat(300),
      } as SubscriptionDto),
    ).rejects.toThrow(/Failed query: insert into "Subscriptions"/);
    expect(await Subscription.count()).toBe(0);
  });
});

describe('DrizzleMessageInfoRepository', () => {
  // Only findAll/countAll here. The id-keyed base methods filter on
  // messageInfoTable.id — the OCPP display id, unique only per
  // (ocppConnectionName, id, tenantId) — while the sequelize twin keys on the
  // databaseId PK, so findById/deleteById can hit rows across stations.
  // Left untested pending a fix.
  it('findAll maps message payloads per tenant', async () => {
    const repo = new DrizzleMessageInfoRepository(deps());
    await MessageInfo.create({
      ocppConnectionName: STATION,
      id: 1,
      priority: 'NormalCycle',
      state: 'Idle',
      message: { format: 'UTF8', content: 'Welcome' },
      active: true,
      startDateTime: TS,
      transactionId: 'tx-9',
      tenantId: TENANT,
    } as any);
    await MessageInfo.create({
      ocppConnectionName: STATION,
      id: 1,
      priority: 'AlwaysFront',
      message: { format: 'UTF8', content: 'Other tenant' },
      active: false,
      tenantId: OTHER_TENANT,
    } as any);

    const own = await repo.findAll(TENANT);
    expect(own).toHaveLength(1);
    expect(own[0].databaseId).toBeDefined();
    expect(own[0].id).toBe(1);
    expect(own[0].ocppConnectionName).toBe(STATION);
    expect(own[0].priority).toBe('NormalCycle');
    expect(own[0].state).toBe('Idle');
    expect(own[0].message).toEqual({ format: 'UTF8', content: 'Welcome' });
    expect(own[0].active).toBe(true);
    expect(own[0].startDateTime).toBe(TS);
    expect(own[0].endDateTime).toBeNull();
    expect(own[0].transactionId).toBe('tx-9');
    expect(own[0].displayComponentId).toBeNull();
    expect(own[0].tenantId).toBe(TENANT);
  });

  it('countAll counts rows for the calling tenant only', async () => {
    const repo = new DrizzleMessageInfoRepository(deps());
    await MessageInfo.create({
      ocppConnectionName: STATION,
      id: 1,
      priority: 'NormalCycle',
      message: { format: 'UTF8', content: 'A' },
      tenantId: TENANT,
    } as any);
    await MessageInfo.create({
      ocppConnectionName: STATION,
      id: 2,
      priority: 'NormalCycle',
      message: { format: 'UTF8', content: 'B' },
      tenantId: TENANT,
    } as any);
    await MessageInfo.create({
      ocppConnectionName: STATION,
      id: 1,
      priority: 'NormalCycle',
      message: { format: 'UTF8', content: 'C' },
      tenantId: OTHER_TENANT,
    } as any);

    expect(await repo.countAll(TENANT)).toBe(2);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });
});

describe('DrizzleChangeConfigurationRepository', () => {
  it('findById maps the configuration row', async () => {
    const repo = new DrizzleChangeConfigurationRepository(deps());
    const row = await aChangeConfiguration(TENANT);

    const dto = await repo.findById(TENANT, row.id);

    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.key).toBe('HeartbeatInterval');
    expect(dto!.value).toBe('300');
    expect(dto!.readonly).toBe(false);
    expect(dto!.tenantId).toBe(TENANT);
    expect(dto!.createdAt).toBeInstanceOf(Date);
  });

  it('findById, findAll and countAll are tenant-scoped for the same station and key', async () => {
    const repo = new DrizzleChangeConfigurationRepository(deps());
    const own = await aChangeConfiguration(TENANT, { value: '300' });
    await aChangeConfiguration(OTHER_TENANT, { value: '600' });

    expect(await repo.findById(OTHER_TENANT, own.id)).toBeUndefined();
    expect(await repo.countAll(TENANT)).toBe(1);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);

    const other = await repo.findAll(OTHER_TENANT);
    expect(other).toHaveLength(1);
    expect(other[0].value).toBe('600');
  });

  it('updateById writes value only for the calling tenant', async () => {
    const repo = new DrizzleChangeConfigurationRepository(deps());
    const own = await aChangeConfiguration(TENANT);

    expect(await repo.updateById(OTHER_TENANT, own.id, { value: '999' })).toBeUndefined();

    const updated = await repo.updateById(TENANT, own.id, { value: '120', readonly: true });
    expect(updated!.value).toBe('120');
    expect(updated!.readonly).toBe(true);

    const viaSequelize = await ChangeConfiguration.findByPk(own.id);
    expect(viaSequelize!.value).toBe('120');
  });

  it('updateById onto an existing key violates the station-scoped unique index', async () => {
    const repo = new DrizzleChangeConfigurationRepository(deps());
    await aChangeConfiguration(TENANT);
    const other = await aChangeConfiguration(TENANT, { key: 'MeterValueSampleInterval' });

    await expect(repo.updateById(TENANT, other.id, { key: 'HeartbeatInterval' })).rejects.toThrow(
      /Failed query: update "ChangeConfigurations"/,
    );
    expect((await repo.findById(TENANT, other.id))!.key).toBe('MeterValueSampleInterval');
  });

  it('deleteById removes the tenant row only', async () => {
    const repo = new DrizzleChangeConfigurationRepository(deps());
    const own = await aChangeConfiguration(TENANT);
    await aChangeConfiguration(OTHER_TENANT);

    expect(await repo.deleteById(OTHER_TENANT, own.id)).toBeUndefined();
    expect(await ChangeConfiguration.count()).toBe(2);

    const deleted = await repo.deleteById(TENANT, own.id);
    expect(deleted!.key).toBe('HeartbeatInterval');
    expect(await ChangeConfiguration.count()).toBe(1);
    expect((await repo.findAll(OTHER_TENANT))[0].tenantId).toBe(OTHER_TENANT);
  });
});

describe('drizzle row-to-DTO mappers', () => {
  const timestamps = {
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };

  it('toLocalListVersionDto defaults null scalars and omits relations', () => {
    const dto = toLocalListVersionDto({
      id: 1,
      ocppConnectionName: null,
      versionNumber: null,
      tenantId: TENANT,
      ...timestamps,
    } as LocalListVersionEntity);

    expect(dto.ocppConnectionName).toBe('');
    expect(dto.versionNumber).toBe(0);
    expect(dto.localAuthorizationList).toBeUndefined();
    expect(dto.customData).toBeUndefined();
    expect(dto.tenant).toBeUndefined();
    expect(dto.createdAt).toEqual(timestamps.createdAt);
  });

  it('toSendLocalListDto defaults null scalars', () => {
    const dto = toSendLocalListDto({
      id: 2,
      ocppConnectionName: null,
      correlationId: null,
      versionNumber: null,
      updateType: null,
      tenantId: TENANT,
      ...timestamps,
    } as SendLocalListEntity);

    expect(dto.ocppConnectionName).toBe('');
    expect(dto.correlationId).toBe('');
    expect(dto.versionNumber).toBe(0);
    expect(dto.updateType).toBe('');
    expect(dto.localAuthorizationList).toBeUndefined();
  });

  it('toLocalListAuthorizationDto converts the expiry Date and remaps nullables', () => {
    const dto = toLocalListAuthorizationDto({
      id: 3,
      allowedConnectorTypes: null,
      disallowedEvseIdPrefixes: ['DE*'],
      idToken: null,
      idTokenType: 'ISO14443',
      additionalInfo: null,
      status: null,
      cacheExpiryDateTime: new Date('2027-01-01T00:00:00.000Z'),
      chargingPriority: null,
      language1: null,
      language2: null,
      personalMessage: null,
      groupAuthorizationId: 77,
      authorizationId: null,
      tenantId: TENANT,
      ...timestamps,
    } as LocalListAuthorizationEntity);

    expect(dto.allowedConnectorTypes).toBeUndefined();
    expect(dto.disallowedEvseIdPrefixes).toEqual(['DE*']);
    expect(dto.idToken).toBe('');
    expect(dto.status).toBe('');
    expect(dto.cacheExpiryDateTime).toBe('2027-01-01T00:00:00.000Z');
    expect(dto.groupAuthorizationId).toBe(77);
    expect(dto.groupAuthorization).toBeUndefined();
    expect(dto.authorizationId).toBeUndefined();
    expect(dto.authorization).toBeUndefined();
  });

  it('toSecurityEventDto converts the timestamp and defaults type and techInfo', () => {
    const dto = toSecurityEventDto({
      id: 4,
      ocppConnectionName: STATION,
      type: null,
      timestamp: new Date('2026-04-01T08:00:00.000Z'),
      techInfo: null,
      tenantId: TENANT,
      ...timestamps,
    } as SecurityEventEntity);

    expect(dto.type).toBe('');
    expect(dto.timestamp).toBe('2026-04-01T08:00:00.000Z');
    expect(dto.techInfo).toBeNull();
    expect(dto.ocppConnectionName).toBe(STATION);
  });

  it('toSubscriptionDto keeps booleans and the regex filter verbatim', () => {
    const dto = toSubscriptionDto({
      id: 5,
      ocppConnectionName: STATION,
      onConnect: true,
      onClose: false,
      onMessage: true,
      sentMessage: false,
      messageRegexFilter: null,
      url: 'https://a.example',
      tenantId: TENANT,
      ...timestamps,
    } as SubscriptionEntity);

    expect(dto.onConnect).toBe(true);
    expect(dto.onClose).toBe(false);
    expect(dto.onMessage).toBe(true);
    expect(dto.sentMessage).toBe(false);
    expect(dto.messageRegexFilter).toBeNull();
    expect(dto.url).toBe('https://a.example');
    expect(dto.tenant).toBeUndefined();
  });

  it('toMessageInfoDto converts dates and defaults active to false', () => {
    const dto = toMessageInfoDto({
      databaseId: 6,
      ocppConnectionName: null,
      id: 12,
      priority: 'InFront',
      state: null,
      startDateTime: new Date('2026-05-01T00:00:00.000Z'),
      endDateTime: null,
      transactionId: null,
      message: { format: 'UTF8', content: 'Hi' },
      active: null,
      displayComponentId: null,
      tenantId: TENANT,
      ...timestamps,
    } as MessageInfoEntity);

    expect(dto.databaseId).toBe(6);
    expect(dto.ocppConnectionName).toBe('');
    expect(dto.id).toBe(12);
    expect(dto.priority).toBe('InFront');
    expect(dto.state).toBeNull();
    expect(dto.startDateTime).toBe('2026-05-01T00:00:00.000Z');
    expect(dto.endDateTime).toBeNull();
    expect(dto.transactionId).toBeNull();
    expect(dto.message).toEqual({ format: 'UTF8', content: 'Hi' });
    expect(dto.active).toBe(false);
    expect(dto.displayComponentId).toBeNull();
  });

  it('toChangeConfigurationDto passes nullable value and readonly through', () => {
    const dto = toChangeConfigurationDto({
      id: 7,
      ocppConnectionName: STATION,
      key: 'AuthorizeRemoteTxRequests',
      value: null,
      readonly: null,
      tenantId: TENANT,
      ...timestamps,
    } as ChangeConfigurationEntity);

    expect(dto.key).toBe('AuthorizeRemoteTxRequests');
    expect(dto.value).toBeNull();
    expect(dto.readonly).toBeNull();
    expect(dto.ocppConnectionName).toBe(STATION);
    expect(dto.tenant).toBeUndefined();
    expect(dto.updatedAt).toEqual(timestamps.updatedAt);
  });
});
