// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { PartnerProfile, TenantDto } from '@citrineos/types';
import {
  AsyncJobStatus,
  ChargingStationSecurityInfo,
  ChargingStationSequence,
  OCPPMessage,
  ServerNetworkProfile,
  SetNetworkProfile,
  Tariff,
  Tenant,
  TenantPartner,
} from '../../../index.js';
import {
  DrizzleAsyncJobStatusRepository,
  toAsyncJobStatusDto,
} from '@dal/repositories/drizzle/async-job-status.js';
import { toChargingStationNetworkProfileDto } from '@dal/repositories/drizzle/charging-station-network-profile.js';
import {
  DrizzleChargingStationSecurityInfoRepository,
  toChargingStationSecurityInfoDto,
} from '@dal/repositories/drizzle/charging-station-security-info.js';
import {
  DrizzleChargingStationSequenceRepository,
  toChargingStationSequenceDto,
} from '@dal/repositories/drizzle/charging-station-sequence.js';
import {
  DrizzleOCPPMessageRepository,
  toOCPPMessageDto,
} from '@dal/repositories/drizzle/ocpp-message.js';
import {
  DrizzleServerNetworkProfileRepository,
  toServerNetworkProfileDto,
} from '@dal/repositories/drizzle/server-network-profile.js';
import {
  DrizzleSetNetworkProfileRepository,
  toSetNetworkProfileDto,
} from '@dal/repositories/drizzle/set-network-profile.js';
import { DrizzleTariffRepository, toTariffDto } from '@dal/repositories/drizzle/tariff.js';
import { DrizzleTenantRepository, toTenantDto } from '@dal/repositories/drizzle/tenant.js';
import {
  DrizzleTenantPartnerRepository,
  toTenantPartnerDto,
} from '@dal/repositories/drizzle/tenant-partner.js';
import type { AsyncJobStatusEntity } from '@dal/db/drizzle/schema/async-job-status.js';
import type { ChargingStationNetworkProfileEntity } from '@dal/db/drizzle/schema/charging-station-network-profile.js';
import type { ChargingStationSecurityInfoEntity } from '@dal/db/drizzle/schema/charging-station-security-info.js';
import type { ChargingStationSequenceEntity } from '@dal/db/drizzle/schema/charging-station-sequence.js';
import type { OCPPMessageEntity } from '@dal/db/drizzle/schema/ocpp-message.js';
import type { ServerNetworkProfileEntity } from '@dal/db/drizzle/schema/server-network-profile.js';
import type { SetNetworkProfileEntity } from '@dal/db/drizzle/schema/set-network-profile.js';
import type { TariffEntity } from '@dal/db/drizzle/schema/tariff.js';
import type { TenantEntity } from '@dal/db/drizzle/schema/tenant.js';
import type { TenantPartnerEntity } from '@dal/db/drizzle/schema/tenant-partner.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// Infra-cluster drizzle repositories. DrizzleTenantRepository and
// DrizzleServerNetworkProfileRepository carry domain methods of their own; the
// rest (TenantPartner, OCPPMessage, ChargingStationSequence, AsyncJobStatus,
// SetNetworkProfile, ChargingStationSecurityInfo) are Base-CRUD stubs, so this
// suite drives the shared findById/findAll/exists/countAll/insert/updateById/
// deleteById paths from base.ts through them, over the sequelize-created schema.
// DrizzleTariffRepository is covered on the same base surface only; its
// ITariffRepository methods are not yet covered anywhere.
// ChargingStationNetworkProfile gets mapper coverage only — see the note at the
// bottom. The sequelize twins have their own suites under
// test/repositories/sequelize.

const TENANT = 1;
const OTHER_TENANT = 2;
const STATION = 'CS-01';
const TS = '2026-02-01T09:30:00.000Z';
// TenantPartners.partnerProfileOCPI is typed as the OCPI PartnerProfile, which
// requires version and serverCredentials.
const PARTNER_PROFILE: PartnerProfile = {
  version: { version: '2.2.1', versionDetailsUrl: 'https://partner.example/2.2.1' },
  serverCredentials: { versionsUrl: 'https://partner.example/versions', token: 'tok-1' },
};

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

// ─── Seed helpers (rows written through the sequelize layer) ─────────────────

async function aTariff(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const tariff = await Tariff.create({
    currency: 'EUR',
    pricePerKwh: 0.25,
    tenantId,
    ...overrides,
  } as any);
  return tariff as unknown as { id: number };
}

async function aMessage(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const message = await OCPPMessage.create({
    ocppConnectionName: STATION,
    correlationId: 'corr-1',
    origin: 'cs',
    type: 2,
    protocol: 'ocpp2.0.1',
    action: 'Heartbeat',
    payload: { interval: 300 },
    raw: '[2,"corr-1","Heartbeat",{}]',
    timestamp: TS,
    tenantId,
    ...overrides,
  } as any);
  return message as unknown as { id: number };
}

describe('drizzle row-to-DTO mappers', () => {
  const timestamps = {
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  it('toTenantDto coalesces nullable columns to null and keeps scalars', () => {
    const dto = toTenantDto({
      id: 7,
      name: 'Acme',
      url: null,
      partyId: null,
      countryCode: 'DE',
      serverProfileOCPI: null,
      isUserTenant: false,
      maxChargingStations: null,
      tenantWebsocketServerPath: 'acme',
      ...timestamps,
    } as TenantEntity);

    expect(dto.id).toBe(7);
    expect(dto.name).toBe('Acme');
    expect(dto.url).toBeNull();
    expect(dto.countryCode).toBe('DE');
    expect(dto.isUserTenant).toBe(false);
    expect(dto.maxChargingStations).toBeNull();
    expect(dto.tenantWebsocketServerPath).toBe('acme');
    expect(dto.createdAt).toEqual(timestamps.createdAt);
  });

  it('toTenantPartnerDto keeps the OCPI profile and leaves the relation empty', () => {
    const dto = toTenantPartnerDto({
      id: 3,
      partyId: null,
      countryCode: 'DE',
      partnerProfileOCPI: PARTNER_PROFILE,
      tenantId: TENANT,
      ...timestamps,
    } as TenantPartnerEntity);

    expect(dto.id).toBe(3);
    expect(dto.partyId).toBeNull();
    expect(dto.countryCode).toBe('DE');
    expect(dto.partnerProfileOCPI).toEqual(PARTNER_PROFILE);
    expect(dto.tenant).toBeUndefined();
    expect(dto.tenantId).toBe(TENANT);
  });

  it('toOCPPMessageDto converts timestamp to ISO and null columns to undefined', () => {
    const dto = toOCPPMessageDto({
      id: 4,
      stationId: null,
      ocppConnectionName: STATION,
      correlationId: null,
      origin: 'cs',
      type: 2,
      state: '1',
      protocol: 'ocpp2.0.1',
      action: null,
      payload: null,
      raw: '[2,"x","Heartbeat",{}]',
      message: null,
      requestMessageId: null,
      timestamp: new Date(TS),
      tenantId: TENANT,
      ...timestamps,
    } as OCPPMessageEntity);

    expect(dto.timestamp).toBe(TS);
    expect(dto.stationId).toBeUndefined();
    expect(dto.correlationId).toBeUndefined();
    expect(dto.action).toBeUndefined();
    expect(dto.payload).toBeUndefined();
    expect(dto.raw).toBe('[2,"x","Heartbeat",{}]');
    expect(dto.state).toBe('1');
    expect(dto.requestMessageId).toBeUndefined();
    expect(dto.requestMessage).toBeUndefined();
    expect(dto.responseMessages).toBeUndefined();
  });

  it('toChargingStationSequenceDto keys on connection name and drops stationId', () => {
    const dto = toChargingStationSequenceDto({
      id: 6,
      stationId: 12,
      ocppConnectionName: STATION,
      type: 'transactionId',
      value: 41,
      tenantId: TENANT,
      ...timestamps,
    } as ChargingStationSequenceEntity);

    expect(dto.ocppConnectionName).toBe(STATION);
    expect(dto.type).toBe('transactionId');
    expect(dto.value).toBe(41);
    expect('stationId' in dto).toBe(false);
    expect(dto.station).toBeUndefined();
  });

  it('toAsyncJobStatusDto renames id to jobId and defaults the flag columns', () => {
    const dto = toAsyncJobStatusDto({
      id: 'job-1',
      jobName: 'FETCH_OCPI_TOKENS',
      tenantPartnerId: 9,
      finishedAt: null,
      stoppedAt: null,
      stopScheduled: null,
      isFailed: null,
      paginationParams: null,
      totalObjects: null,
      tenantId: TENANT,
      ...timestamps,
    } as AsyncJobStatusEntity);

    expect(dto.jobId).toBe('job-1');
    expect(dto.jobName).toBe('FETCH_OCPI_TOKENS');
    expect(dto.stopScheduled).toBe(false);
    expect(dto.isFailed).toBe(false);
    expect(dto.paginatedParams).toEqual({});
    expect(dto.finishedAt).toBeUndefined();
    expect(dto.stoppedAt).toBeNull();
    expect(dto.totalObjects).toBeUndefined();
  });

  it('toServerNetworkProfileDto omits the model-only dynamicTenantResolution column', () => {
    const dto = toServerNetworkProfileDto({
      id: 'ws-0',
      host: 'localhost',
      port: 8080,
      pingInterval: 60,
      protocols: ['ocpp2.0.1'],
      messageTimeout: 30,
      securityProfile: 1,
      allowUnknownChargingStations: true,
      dynamicTenantResolution: true,
      tlsKeyFilePath: null,
      tlsCertificateChainFilePath: null,
      mtlsCertificateAuthorityKeyFilePath: null,
      rootCACertificateFilePath: null,
      tenantId: null,
      ...timestamps,
    } as ServerNetworkProfileEntity);

    expect('dynamicTenantResolution' in dto).toBe(false);
    expect(dto.id).toBe('ws-0');
    expect(dto.protocols).toEqual(['ocpp2.0.1']);
    expect(dto.allowUnknownChargingStations).toBe(true);
    expect(dto.tlsKeyFilePath).toBeUndefined();
    expect(dto.tenantId).toBeUndefined();
  });

  it('toSetNetworkProfileDto substitutes empty-string and zero defaults', () => {
    const dto = toSetNetworkProfileDto({
      id: 2,
      stationId: null,
      ocppConnectionName: null,
      correlationId: null,
      websocketServerConfigId: null,
      configurationSlot: null,
      ocppVersion: 'ocpp2.0.1',
      ocppTransport: 'JSON',
      ocppCsmsUrl: null,
      messageTimeout: null,
      securityProfile: null,
      ocppInterface: 'Wired0',
      apn: null,
      vpn: null,
      tenantId: TENANT,
      ...timestamps,
    } as SetNetworkProfileEntity);

    expect(dto.ocppConnectionName).toBe('');
    expect(dto.correlationId).toBe('');
    expect(dto.websocketServerConfigId).toBeUndefined();
    expect(dto.configurationSlot).toBe(0);
    expect(dto.ocppVersion).toBe('ocpp2.0.1');
    expect(dto.ocppCsmsUrl).toBe('');
    expect(dto.messageTimeout).toBe(0);
    expect(dto.securityProfile).toBe(0);
    expect(dto.apn).toBeUndefined();
  });

  it('toChargingStationNetworkProfileDto zero-fills the slot and FK columns', () => {
    const dto = toChargingStationNetworkProfileDto({
      id: 5,
      stationId: null,
      ocppConnectionName: null,
      configurationSlot: null,
      setNetworkProfileId: null,
      websocketServerConfigId: null,
      tenantId: OTHER_TENANT,
      ...timestamps,
    } as ChargingStationNetworkProfileEntity);

    expect(dto.ocppConnectionName).toBe('');
    expect(dto.configurationSlot).toBe(0);
    expect(dto.setNetworkProfileId).toBe(0);
    expect(dto.websocketServerConfigId).toBeUndefined();
    expect(dto.tenantId).toBe(OTHER_TENANT);
  });

  it('toChargingStationSecurityInfoDto empty-strings nullable identity columns', () => {
    const dto = toChargingStationSecurityInfoDto({
      id: 8,
      stationId: null,
      ocppConnectionName: null,
      publicKeyFileId: null,
      tenantId: TENANT,
      ...timestamps,
    } as ChargingStationSecurityInfoEntity);

    expect(dto.ocppConnectionName).toBe('');
    expect(dto.publicKeyFileId).toBe('');
    expect(dto.tenantId).toBe(TENANT);
  });

  it('toTariffDto converts DECIMAL strings to numbers and validFrom to ISO', () => {
    const dto = toTariffDto({
      id: 9,
      currency: 'EUR',
      pricePerKwh: '0.2500',
      pricePerMin: null,
      pricePerSession: '1.50',
      authorizationAmount: null,
      paymentFee: null,
      taxRate: '19',
      tariffAltText: null,
      tariffId: 'T-9',
      validFrom: new Date(TS),
      description: null,
      energy: null,
      chargingTime: null,
      idleTime: null,
      fixedFee: null,
      reservationTime: null,
      reservationFixed: null,
      minCost: null,
      maxCost: null,
      tenantId: TENANT,
      ...timestamps,
    } as TariffEntity);

    expect(dto.pricePerKwh).toBe(0.25);
    expect(dto.pricePerMin).toBeNull();
    expect(dto.pricePerSession).toBe(1.5);
    expect(dto.taxRate).toBe(19);
    expect(dto.validFrom).toBe(TS);
    expect(dto.tariffAltText).toBeNull();
    expect(dto.tariffId).toBe('T-9');
  });
});

describe('DrizzleTenantRepository', () => {
  beforeEach(async () => {
    // resetDb seeds tenants 1 and 2 with explicit ids, which leaves the serial
    // sequence at 1; move it past the seeds so inserts do not collide.
    await h.sequelizeInstance.query(
      `SELECT setval(pg_get_serial_sequence('"Tenants"', 'id'), 100);`,
    );
  });

  it('createTenant persists name, url and isUserTenant and emits created', async () => {
    const repo = new DrizzleTenantRepository(deps());
    const created: TenantDto[] = [];
    repo.on('created', (dtos: TenantDto[]) => created.push(...dtos));

    const dto = await repo.createTenant({
      name: 'Acme',
      url: 'https://acme.example',
      isUserTenant: true,
    } as TenantDto);

    expect(dto.id).toBeGreaterThan(2);
    expect(dto.name).toBe('Acme');
    expect(dto.url).toBe('https://acme.example');
    expect(dto.isUserTenant).toBe(true);
    expect(created).toEqual([dto]);

    const row = (await Tenant.findByPk(dto.id!)) as any;
    expect(row.name).toBe('Acme');
    expect(row.isUserTenant).toBe(true);

    // isUserTenant falls back to false when the input leaves it unset.
    const bare = await repo.createTenant({ name: 'Bare' } as TenantDto);
    expect(bare.isUserTenant).toBe(false);
    expect(bare.url).toBeNull();
  });

  it('readByKey resolves numeric and string keys, undefined when absent', async () => {
    const repo = new DrizzleTenantRepository(deps());
    const dto = await repo.createTenant({ name: 'Lookup' } as TenantDto);

    expect((await repo.readByKey(TENANT, dto.id!))!.name).toBe('Lookup');
    expect((await repo.readByKey(TENANT, String(dto.id)))!.name).toBe('Lookup');
    expect(await repo.readByKey(TENANT, 9999)).toBeUndefined();
  });

  it('updateWebsocketServerPath sets, clears and lists paths', async () => {
    const repo = new DrizzleTenantRepository(deps());
    const updated: TenantDto[] = [];
    repo.on('updated', (dtos: TenantDto[]) => updated.push(...dtos));

    const first = await repo.updateWebsocketServerPath(TENANT, 'op-a');
    await repo.updateWebsocketServerPath(OTHER_TENANT, 'op-b');

    expect(first!.id).toBe(TENANT);
    expect(first!.tenantWebsocketServerPath).toBe('op-a');
    expect(updated[0]).toEqual(first);

    expect((await repo.readByWebsocketServerPath('op-a'))!.id).toBe(TENANT);
    expect(await repo.readByWebsocketServerPath('nope')).toBeUndefined();

    const all = await repo.readAllWithWebsocketServerPath();
    expect(all.map((t) => t.id).sort()).toEqual([TENANT, OTHER_TENANT]);

    const cleared = await repo.updateWebsocketServerPath(TENANT, null);
    expect(cleared!.tenantWebsocketServerPath).toBeNull();
    expect((await repo.readAllWithWebsocketServerPath()).map((t) => t.id)).toEqual([OTHER_TENANT]);

    expect(await repo.updateWebsocketServerPath(9999, 'ghost')).toBeUndefined();
  });

  it('a second tenant cannot claim an already-used websocket path', async () => {
    const repo = new DrizzleTenantRepository(deps());
    await repo.updateWebsocketServerPath(TENANT, 'shared');

    await expect(repo.updateWebsocketServerPath(OTHER_TENANT, 'shared')).rejects.toThrow(
      /Failed query: update "Tenants"/,
    );
    expect((await repo.readByKey(TENANT, OTHER_TENANT))!.tenantWebsocketServerPath).toBeNull();
  });
});

describe('DrizzleServerNetworkProfileRepository', () => {
  const wsConfig = (overrides: Record<string, unknown> = {}) => ({
    id: 'ws-0',
    host: 'localhost',
    port: 8080,
    pingInterval: 60,
    protocols: ['ocpp2.0.1'],
    securityProfile: 1,
    allowUnknownChargingStations: false,
    tenantId: TENANT,
    ...overrides,
  });

  it('upsert inserts a row, deriving messageTimeout from maxCallLengthSeconds', async () => {
    const repo = new DrizzleServerNetworkProfileRepository(deps());

    const dto = await repo.upsertServerNetworkProfile(wsConfig(), 30);

    expect(dto.id).toBe('ws-0');
    expect(dto.host).toBe('localhost');
    expect(dto.port).toBe(8080);
    expect(dto.messageTimeout).toBe(30);
    expect(dto.protocols).toEqual(['ocpp2.0.1']);
    expect(dto.tenantId).toBe(TENANT);
    expect(await ServerNetworkProfile.count()).toBe(1);

    const row = (await ServerNetworkProfile.findByPk('ws-0')) as any;
    expect(row.dynamicTenantResolution).toBe(false);
    expect(row.tlsKeyFilePath).toBeNull();
  });

  it('upsert updates the existing row in place and emits updated', async () => {
    const repo = new DrizzleServerNetworkProfileRepository(deps());
    await repo.upsertServerNetworkProfile(wsConfig(), 30);
    const updated: unknown[] = [];
    repo.on('updated', (dtos: unknown[]) => updated.push(...dtos));

    const dto = await repo.upsertServerNetworkProfile(
      wsConfig({ host: 'ws.internal', dynamicTenantResolution: true }),
      45,
    );

    expect(dto.host).toBe('ws.internal');
    expect(dto.messageTimeout).toBe(45);
    expect(updated).toEqual([dto]);
    expect(await ServerNetworkProfile.count()).toBe(1);
    expect(((await ServerNetworkProfile.findByPk('ws-0')) as any).dynamicTenantResolution).toBe(
      true,
    );
  });

  it('upsert falls back to the default tenant when the config has none', async () => {
    const repo = new DrizzleServerNetworkProfileRepository(deps());
    const dto = await repo.upsertServerNetworkProfile(wsConfig({ tenantId: undefined }), 30);
    expect(dto.tenantId).toBe(DEFAULT_TENANT_ID);
  });

  it('upsert rejects for a tenant that does not exist', async () => {
    const repo = new DrizzleServerNetworkProfileRepository(deps());
    await expect(repo.upsertServerNetworkProfile(wsConfig({ tenantId: 999 }), 30)).rejects.toThrow(
      /Failed query: insert into "ServerNetworkProfiles"/,
    );
    expect(await ServerNetworkProfile.count()).toBe(0);
  });

  it('base findById and findAll scope upserted rows by tenant', async () => {
    const repo = new DrizzleServerNetworkProfileRepository(deps());
    await repo.upsertServerNetworkProfile(wsConfig(), 30);
    await repo.upsertServerNetworkProfile(wsConfig({ id: 'ws-1', tenantId: OTHER_TENANT }), 30);

    const own = await repo.findById(TENANT, 'ws-0' as unknown as number);
    expect(own!.id).toBe('ws-0');
    expect(await repo.findById(OTHER_TENANT, 'ws-0' as unknown as number)).toBeUndefined();
    expect((await repo.findAll(OTHER_TENANT)).map((p) => p.id)).toEqual(['ws-1']);
  });
});

describe('DrizzleTariffRepository (base CRUD)', () => {
  it('findById maps DECIMAL strings to numbers and scopes by tenant', async () => {
    const repo = new DrizzleTariffRepository(deps());
    const seeded = await aTariff(TENANT, { pricePerMin: 0.05, taxRate: 19, tariffId: 'T-1' });

    const dto = await repo.findById(TENANT, seeded.id);

    expect(dto!.currency).toBe('EUR');
    expect(dto!.pricePerKwh).toBe(0.25);
    expect(dto!.pricePerMin).toBe(0.05);
    expect(dto!.pricePerSession).toBeNull();
    expect(dto!.taxRate).toBe(19);
    expect(dto!.tariffId).toBe('T-1');
    expect(dto!.tenantId).toBe(TENANT);

    expect(await repo.findById(OTHER_TENANT, seeded.id)).toBeUndefined();
  });

  it('findAll, countAll and exists see only the tenant rows', async () => {
    const repo = new DrizzleTariffRepository(deps());
    const t1 = await aTariff(TENANT, { tariffId: 'T-1' });
    await aTariff(TENANT, { tariffId: 'T-2' });
    const foreign = await aTariff(OTHER_TENANT, { tariffId: 'T-3' });

    expect((await repo.findAll(TENANT)).map((t) => t.tariffId).sort()).toEqual(['T-1', 'T-2']);
    expect(await repo.countAll(TENANT)).toBe(2);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
    expect(await repo.exists(TENANT, t1.id)).toBe(true);
    expect(await repo.exists(TENANT, foreign.id)).toBe(false);
  });

  it('updateById rewrites values, emits updated, and skips foreign tenants', async () => {
    const repo = new DrizzleTariffRepository(deps());
    const seeded = await aTariff(TENANT);
    const updated: unknown[] = [];
    repo.on('updated', (dtos: unknown[]) => updated.push(...dtos));

    const dto = await repo.updateById(TENANT, seeded.id, { currency: 'USD', pricePerKwh: 0.42 });

    expect(dto!.currency).toBe('USD');
    expect(dto!.pricePerKwh).toBe(0.42);
    expect(updated).toEqual([dto]);

    expect(await repo.updateById(OTHER_TENANT, seeded.id, { currency: 'GBP' })).toBeUndefined();
    expect((await repo.findById(TENANT, seeded.id))!.currency).toBe('USD');
  });

  it('updateById rejects when clearing the NOT NULL currency column', async () => {
    const repo = new DrizzleTariffRepository(deps());
    const seeded = await aTariff(TENANT);

    await expect(repo.updateById(TENANT, seeded.id, { currency: null })).rejects.toThrow(
      /Failed query: update "Tariffs"/,
    );
    expect((await repo.findById(TENANT, seeded.id))!.currency).toBe('EUR');
  });

  it('deleteById removes only the tenant row and emits deleted', async () => {
    const repo = new DrizzleTariffRepository(deps());
    const seeded = await aTariff(TENANT, { tariffId: 'T-1' });
    await aTariff(OTHER_TENANT, { tariffId: 'T-2' });
    const deleted: unknown[] = [];
    repo.on('deleted', (dtos: unknown[]) => deleted.push(...dtos));

    const dto = await repo.deleteById(TENANT, seeded.id);

    expect(dto!.tariffId).toBe('T-1');
    expect(deleted).toEqual([dto]);
    expect(await Tariff.count()).toBe(1);
    expect(await repo.deleteById(TENANT, seeded.id)).toBeUndefined();
  });
});

describe('DrizzleOCPPMessageRepository (base CRUD)', () => {
  it('findById returns the message with timestamp as an ISO string', async () => {
    const repo = new DrizzleOCPPMessageRepository(deps());
    const seeded = await aMessage(TENANT);

    const dto = await repo.findById(TENANT, seeded.id);

    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.correlationId).toBe('corr-1');
    expect(dto!.origin).toBe('cs');
    expect(dto!.type).toBe(2);
    expect(dto!.protocol).toBe('ocpp2.0.1');
    expect(dto!.action).toBe('Heartbeat');
    expect(dto!.payload).toEqual({ interval: 300 });
    expect(dto!.raw).toBe('[2,"corr-1","Heartbeat",{}]');
    expect(dto!.timestamp).toBe(TS);
  });

  it('deleteById is tenant-scoped', async () => {
    const repo = new DrizzleOCPPMessageRepository(deps());
    const seeded = await aMessage(TENANT);

    expect(await repo.deleteById(OTHER_TENANT, seeded.id)).toBeUndefined();
    expect(await OCPPMessage.count()).toBe(1);

    const dto = await repo.deleteById(TENANT, seeded.id);
    expect(dto!.correlationId).toBe('corr-1');
    expect(await OCPPMessage.count()).toBe(0);
  });
});

describe('DrizzleChargingStationSequenceRepository (base CRUD)', () => {
  async function aSequence(tenantId: number, value: number): Promise<{ id: number }> {
    const sequence = await ChargingStationSequence.create({
      ocppConnectionName: STATION,
      type: 'transactionId',
      value,
      tenantId,
    } as any);
    return sequence as unknown as { id: number };
  }

  it('findById reads the BIGINT value back as a number', async () => {
    const repo = new DrizzleChargingStationSequenceRepository(deps());
    const seeded = await aSequence(TENANT, 41);

    const dto = await repo.findById(TENANT, seeded.id);

    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.type).toBe('transactionId');
    expect(dto!.value).toBe(41);
    expect(typeof dto!.value).toBe('number');
  });

  it('updateById advances the value; foreign tenants get undefined', async () => {
    const repo = new DrizzleChargingStationSequenceRepository(deps());
    const seeded = await aSequence(TENANT, 41);

    expect(await repo.updateById(OTHER_TENANT, seeded.id, { value: 99 })).toBeUndefined();

    const dto = await repo.updateById(TENANT, seeded.id, { value: 42 });
    expect(dto!.value).toBe(42);
    expect((await repo.findById(TENANT, seeded.id))!.value).toBe(42);
  });
});

describe('DrizzleAsyncJobStatusRepository (base CRUD, string PK)', () => {
  // AsyncJobStatus.tenantPartnerId is NOT NULL and an FK, so every job needs an
  // owning partner row.
  async function aPartner(tenantId: number): Promise<{ id: number }> {
    const partner = await TenantPartner.create({
      partyId: 'CPO',
      countryCode: 'DE',
      partnerProfileOCPI: PARTNER_PROFILE,
      tenantId,
    } as any);
    return partner as unknown as { id: number };
  }

  async function aJob(tenantId: number, tenantPartnerId: number): Promise<{ jobId: string }> {
    const job = await AsyncJobStatus.create({
      jobName: 'FETCH_OCPI_TOKENS',
      tenantPartnerId,
      paginationParams: { offset: 0, limit: 10 },
      totalObjects: 250,
      tenantId,
    } as any);
    return job as unknown as { jobId: string };
  }

  it('findById keys on the jobId column and maps the pagination params', async () => {
    const repo = new DrizzleAsyncJobStatusRepository(deps());
    const partner = await aPartner(TENANT);
    const seeded = await aJob(TENANT, partner.id);

    const dto = await repo.findById(TENANT, seeded.jobId as unknown as number);

    expect(dto!.jobId).toBe(seeded.jobId);
    expect(dto!.jobName).toBe('FETCH_OCPI_TOKENS');
    expect(dto!.tenantPartnerId).toBe(partner.id);
    expect(dto!.paginatedParams).toEqual({ offset: 0, limit: 10 });
    expect(dto!.totalObjects).toBe(250);
    expect(dto!.stopScheduled).toBe(false);
    expect(dto!.isFailed).toBe(false);

    expect(await repo.findById(TENANT, 'missing' as unknown as number)).toBeUndefined();
  });

  it('countAll scopes jobs to the tenant', async () => {
    const repo = new DrizzleAsyncJobStatusRepository(deps());
    await aJob(TENANT, (await aPartner(TENANT)).id);
    await aJob(OTHER_TENANT, (await aPartner(OTHER_TENANT)).id);

    expect(await repo.countAll(TENANT)).toBe(1);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });
});

describe('DrizzleTenantPartnerRepository (base CRUD)', () => {
  it('findAll returns tenant partners with their OCPI profile, tenant-scoped', async () => {
    const repo = new DrizzleTenantPartnerRepository(deps());
    const own = (await TenantPartner.create({
      partyId: 'CPO',
      countryCode: 'DE',
      partnerProfileOCPI: PARTNER_PROFILE,
      tenantId: TENANT,
    } as any)) as unknown as { id: number };
    await TenantPartner.create({
      partyId: 'MSP',
      countryCode: 'NL',
      partnerProfileOCPI: PARTNER_PROFILE,
      tenantId: OTHER_TENANT,
    } as any);

    const partners = await repo.findAll(TENANT);
    expect(partners).toHaveLength(1);
    expect(partners[0].partyId).toBe('CPO');
    expect(partners[0].partnerProfileOCPI).toEqual(PARTNER_PROFILE);

    expect(await repo.findById(OTHER_TENANT, own.id)).toBeUndefined();

    const deleted = await repo.deleteById(TENANT, own.id);
    expect(deleted!.partyId).toBe('CPO');
    expect(await repo.countAll(TENANT)).toBe(0);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });
});

describe('DrizzleSetNetworkProfileRepository (base CRUD)', () => {
  it('findById maps the stored profile fields; foreign updates return undefined', async () => {
    const repo = new DrizzleSetNetworkProfileRepository(deps());
    const seeded = (await SetNetworkProfile.create({
      ocppConnectionName: STATION,
      correlationId: 'corr-snp',
      configurationSlot: 1,
      ocppVersion: 'ocpp2.0.1',
      ocppTransport: 'JSON',
      ocppCsmsUrl: 'wss://csms.example/ws',
      messageTimeout: 30,
      securityProfile: 1,
      ocppInterface: 'Wired0',
      tenantId: TENANT,
    } as any)) as unknown as { id: number };

    const dto = await repo.findById(TENANT, seeded.id);

    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.correlationId).toBe('corr-snp');
    expect(dto!.configurationSlot).toBe(1);
    expect(dto!.ocppVersion).toBe('ocpp2.0.1');
    expect(dto!.ocppTransport).toBe('JSON');
    expect(dto!.ocppCsmsUrl).toBe('wss://csms.example/ws');
    expect(dto!.messageTimeout).toBe(30);
    expect(dto!.securityProfile).toBe(1);
    expect(dto!.ocppInterface).toBe('Wired0');
    expect(dto!.websocketServerConfigId).toBeUndefined();

    expect(
      await repo.updateById(OTHER_TENANT, seeded.id, { configurationSlot: 9 }),
    ).toBeUndefined();
    expect((await repo.findById(TENANT, seeded.id))!.configurationSlot).toBe(1);
  });
});

// DrizzleChargingStationNetworkProfileRepository has no DB-backed tests here:
// the sequelize layer defines ChargingStationNetworkProfile as the BelongsToMany
// through-model of ChargingStation<->ServerNetworkProfile, so the real table has
// a composite PK (stationId, websocketServerConfigId) and NO id column, while
// the drizzle schema declares `serial('id')`. Every Base-CRUD method on the
// drizzle repository fails with `column "id" does not exist` (42703) against
// the sequelize-created schema. Only the pure mapper is covered above.

describe('DrizzleChargingStationSecurityInfoRepository (base insert)', () => {
  // Base insert is protected; the stub adds no public create yet.
  class InsertableSecurityInfoRepository extends DrizzleChargingStationSecurityInfoRepository {
    create(tenantId: number, values: object) {
      return this.insert(tenantId, values);
    }
  }

  it('insert injects tenantId, emits created, and reads back via findById', async () => {
    const repo = new InsertableSecurityInfoRepository(deps());
    const created: unknown[] = [];
    repo.on('created', (dtos: unknown[]) => created.push(...dtos));

    const dto = await repo.create(TENANT, {
      ocppConnectionName: STATION,
      publicKeyFileId: 'file-1',
    });

    expect(dto.tenantId).toBe(TENANT);
    expect(dto.ocppConnectionName).toBe(STATION);
    expect(dto.publicKeyFileId).toBe('file-1');
    expect(created).toEqual([dto]);

    const row = (await ChargingStationSecurityInfo.findOne({
      where: { ocppConnectionName: STATION },
    })) as any;
    expect(row.tenantId).toBe(TENANT);
    // The model declares publicKeyFileId as a plain class field (not `declare`),
    // which shadows the sequelize getter — read through get() instead.
    expect(row.get('publicKeyFileId')).toBe('file-1');

    expect((await repo.findById(TENANT, dto.id!))!.publicKeyFileId).toBe('file-1');
    expect(await repo.findById(OTHER_TENANT, dto.id!)).toBeUndefined();
  });

  it('insert rejects for a tenant that does not exist', async () => {
    const repo = new InsertableSecurityInfoRepository(deps());

    await expect(
      repo.create(999, { ocppConnectionName: STATION, publicKeyFileId: 'file-1' }),
    ).rejects.toThrow(/Failed query: insert into "ChargingStationSecurityInfos"/);
    expect(await ChargingStationSecurityInfo.count()).toBe(0);
  });
});
