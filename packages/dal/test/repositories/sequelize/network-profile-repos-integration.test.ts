// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OCPP2_0_1, OCPPVersion } from '@citrineos/types';
import {
  ChargingStation,
  ChargingStationNetworkProfile,
  ChargingStationSecurityInfo,
  SequelizeChargingStationNetworkProfileRepository,
  SequelizeChargingStationSecurityInfoRepository,
  SequelizeServerNetworkProfileRepository,
  SequelizeSetNetworkProfileRepository,
  ServerNetworkProfile,
  SetNetworkProfile,
} from '../../../index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// Four thin repositories over the network-profile tables. ChargingStationNetworkProfile and
// SetNetworkProfile resolve stationId from ocppConnectionName in a BeforeCreate hook,
// ServerNetworkProfile keys on a caller-supplied string id, and ChargingStationSecurityInfo
// holds one row per (ocppConnectionName, tenantId).

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'CP-NET-01';
const CORRELATION = 'corr-1';

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

function deps() {
  return { config: h.config, sequelizeInstance: h.sequelizeInstance };
}

async function aStation(tenantId: number, ocppConnectionName = STATION) {
  return ChargingStation.create({ ocppConnectionName, isOnline: false, tenantId } as any);
}

async function aServerProfile(id = 'ws-0', overrides: Record<string, unknown> = {}) {
  return ServerNetworkProfile.create({
    id,
    host: 'localhost',
    port: 8080,
    pingInterval: 60,
    protocols: [OCPPVersion.OCPP2_0_1],
    messageTimeout: 30,
    securityProfile: 1,
    allowUnknownChargingStations: false,
    dynamicTenantResolution: false,
    tenantId: TENANT_A,
    ...overrides,
  } as any);
}

function setNetworkProfileValues(overrides: Record<string, unknown> = {}) {
  return {
    ocppConnectionName: STATION,
    correlationId: CORRELATION,
    configurationSlot: 1,
    ocppVersion: OCPP2_0_1.OCPPVersionEnumType.OCPP20,
    ocppTransport: OCPP2_0_1.OCPPTransportEnumType.JSON,
    ocppCsmsUrl: 'ws://csms.example:8080',
    messageTimeout: 30,
    securityProfile: 1,
    ocppInterface: OCPP2_0_1.OCPPInterfaceEnumType.Wired0,
    tenantId: TENANT_A,
    ...overrides,
  } as any;
}

function wsConfig(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ws-upsert',
    host: '0.0.0.0',
    port: 8081,
    pingInterval: 30,
    protocols: [OCPPVersion.OCPP2_0_1],
    securityProfile: 2,
    allowUnknownChargingStations: true,
    tenantId: TENANT_A,
    ...overrides,
  } as any;
}

describe('SequelizeServerNetworkProfileRepository', () => {
  function makeRepo() {
    return new SequelizeServerNetworkProfileRepository(deps());
  }

  it('upsertServerNetworkProfile inserts a row keyed on the config id', async () => {
    const saved = await makeRepo().upsertServerNetworkProfile(wsConfig(), 45);

    expect(saved.id).toBe('ws-upsert');
    const row = await ServerNetworkProfile.findByPk('ws-upsert');
    expect(row).not.toBeNull();
    expect(row!.host).toBe('0.0.0.0');
    expect(row!.port).toBe(8081);
    expect(row!.pingInterval).toBe(30);
    expect(row!.protocols).toEqual([OCPPVersion.OCPP2_0_1]);
    expect(row!.messageTimeout).toBe(45);
    expect(row!.securityProfile).toBe(2);
    expect(row!.allowUnknownChargingStations).toBe(true);
    expect(row!.tenantId).toBe(TENANT_A);
  });

  it('a second upsert with the same id updates the row in place', async () => {
    const repo = makeRepo();
    await repo.upsertServerNetworkProfile(wsConfig(), 45);
    await repo.upsertServerNetworkProfile(
      wsConfig({ host: 'lb.internal', port: 443, securityProfile: 3 }),
      60,
    );

    expect(await ServerNetworkProfile.count()).toBe(1);
    const row = await ServerNetworkProfile.findByPk('ws-upsert');
    expect(row!.host).toBe('lb.internal');
    expect(row!.port).toBe(443);
    expect(row!.securityProfile).toBe(3);
    expect(row!.messageTimeout).toBe(60);
  });

  it('a config without tenantId lands on the default tenant', async () => {
    await makeRepo().upsertServerNetworkProfile(wsConfig({ tenantId: undefined }), 30);

    const row = await ServerNetworkProfile.findByPk('ws-upsert');
    expect(row!.tenantId).toBe(1);
  });

  it('a config pointing at a missing tenant fails the foreign key and writes nothing', async () => {
    await expect(
      makeRepo().upsertServerNetworkProfile(wsConfig({ tenantId: 999 }), 30),
    ).rejects.toMatchObject({ name: 'SequelizeForeignKeyConstraintError' });
    expect(await ServerNetworkProfile.count()).toBe(0);
  });
});

describe('SequelizeSetNetworkProfileRepository', () => {
  function makeRepo() {
    return new SequelizeSetNetworkProfileRepository(deps());
  }

  it('createPending persists the profile, resolves stationId, and links the server config', async () => {
    const station = await aStation(TENANT_A);
    await aServerProfile('ws-0');

    const created = await makeRepo().createPending(
      setNetworkProfileValues({ websocketServerConfigId: 'ws-0' }),
    );

    expect(created.stationId).toBe(station.id);
    expect(created.correlationId).toBe(CORRELATION);
    expect(created.configurationSlot).toBe(1);
    expect(created.ocppVersion).toBe(OCPP2_0_1.OCPPVersionEnumType.OCPP20);
    expect(created.ocppTransport).toBe(OCPP2_0_1.OCPPTransportEnumType.JSON);
    expect(created.ocppCsmsUrl).toBe('ws://csms.example:8080');
    expect(created.messageTimeout).toBe(30);
    expect(created.securityProfile).toBe(1);
    expect(created.tenantId).toBe(TENANT_A);

    const withConfig = await makeRepo().readAllByQuery(TENANT_A, {
      where: { correlationId: CORRELATION },
      include: [ServerNetworkProfile],
    });
    expect(withConfig).toHaveLength(1);
    expect(withConfig[0].websocketServerConfig?.host).toBe('localhost');
    expect(withConfig[0].websocketServerConfig?.port).toBe(8080);
  });

  it('createPending with no matching station leaves stationId empty', async () => {
    const created = await makeRepo().createPending(
      setNetworkProfileValues({ ocppConnectionName: 'CP-UNKNOWN' }),
    );

    expect(created.stationId ?? null).toBeNull();
    expect(created.ocppConnectionName).toBe('CP-UNKNOWN');
    expect(await SetNetworkProfile.count()).toBe(1);
  });

  it('station resolution picks the station of the row tenant, not a namesake', async () => {
    const stationA = await aStation(TENANT_A, 'CP-SHARED');
    const stationB = await aStation(TENANT_B, 'CP-SHARED');

    const created = await makeRepo().createPending(
      setNetworkProfileValues({ ocppConnectionName: 'CP-SHARED', tenantId: TENANT_B }),
    );

    expect(created.stationId).toBe(stationB.id);
    expect(created.stationId).not.toBe(stationA.id);
    expect(created.tenantId).toBe(TENANT_B);
  });

  it("readAllByQuery does not return another tenant's rows", async () => {
    await makeRepo().createPending(setNetworkProfileValues());

    const forB = await makeRepo().readAllByQuery(TENANT_B, {
      where: { correlationId: CORRELATION },
    });
    const forA = await makeRepo().readAllByQuery(TENANT_A, {
      where: { correlationId: CORRELATION },
    });

    expect(forB).toHaveLength(0);
    expect(forA).toHaveLength(1);
  });

  it('a second pending row for the same station and correlationId is rejected', async () => {
    await aStation(TENANT_A);
    const repo = makeRepo();
    await repo.createPending(setNetworkProfileValues({ configurationSlot: 1 }));

    await expect(
      repo.createPending(setNetworkProfileValues({ configurationSlot: 2 })),
    ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
    expect(await SetNetworkProfile.count()).toBe(1);
  });
});

describe('SequelizeChargingStationNetworkProfileRepository', () => {
  function makeRepo() {
    return new SequelizeChargingStationNetworkProfileRepository(deps());
  }

  // Through table of the ServerNetworkProfile <-> ChargingStation BelongsToMany: sequelize drops
  // the auto id and makes (stationId, websocketServerConfigId) the primary key, so every row needs
  // an existing station and its own server profile. setNetworkProfileId is NOT NULL, so each row
  // also needs the SetNetworkProfile it was configured from; correlationId is unique per station,
  // so each of those gets its own. The association also rewrites stationId's
  // 'stationId_configurationSlot' unique group, leaving a single-column unique on
  // configurationSlot, so slots below are globally distinct.
  async function aSetProfile(
    ocppConnectionName: string,
    configurationSlot: number,
    tenantId = TENANT_A,
  ) {
    return SetNetworkProfile.create(
      setNetworkProfileValues({
        ocppConnectionName,
        configurationSlot,
        correlationId: `corr-${ocppConnectionName}-${configurationSlot}-${tenantId}`,
        tenantId,
      }),
    );
  }

  async function aSlotRow(
    ocppConnectionName: string,
    configurationSlot: number,
    websocketServerConfigId: string,
    tenantId = TENANT_A,
  ) {
    const setNetworkProfile = await aSetProfile(ocppConnectionName, configurationSlot, tenantId);
    return ChargingStationNetworkProfile.create({
      ocppConnectionName,
      configurationSlot,
      websocketServerConfigId,
      setNetworkProfileId: setNetworkProfile.id,
      tenantId,
    } as any);
  }

  it('create resolves stationId from the connection name and the row reads back', async () => {
    const station = await aStation(TENANT_A);
    await aServerProfile('ws-0');
    const setNetworkProfile = await aSetProfile(STATION, 2);
    const repo = makeRepo();

    await repo.create(
      TENANT_A,
      ChargingStationNetworkProfile.build({
        ocppConnectionName: STATION,
        configurationSlot: 2,
        websocketServerConfigId: 'ws-0',
        setNetworkProfileId: setNetworkProfile.id,
        tenantId: TENANT_A,
      } as any),
    );

    const rows = await repo.readAllByQuery(TENANT_A, { where: { ocppConnectionName: STATION } });
    expect(rows).toHaveLength(1);
    expect(rows[0].stationId).toBe(station.id);
    expect(rows[0].configurationSlot).toBe(2);
    expect(rows[0].websocketServerConfigId).toBe('ws-0');
    expect(rows[0].setNetworkProfileId).toBe(setNetworkProfile.id);
    expect(rows[0].tenantId).toBe(TENANT_A);
  });

  it('deleteAllByStationIdAndConfigurationSlots removes only the listed slots of that connection', async () => {
    await aStation(TENANT_A, 'CP-A');
    await aStation(TENANT_A, 'CP-B');
    for (const id of ['ws-1', 'ws-2', 'ws-3', 'ws-4']) {
      await aServerProfile(id);
    }
    await aSlotRow('CP-A', 1, 'ws-1');
    await aSlotRow('CP-A', 2, 'ws-2');
    await aSlotRow('CP-A', 3, 'ws-3');
    await aSlotRow('CP-B', 9, 'ws-4');

    // Slot 9 is in the list but belongs to CP-B, so it survives.
    const deleted = await makeRepo().deleteAllByStationIdAndConfigurationSlots(
      TENANT_A,
      'CP-A',
      [1, 3, 9],
    );

    expect(deleted.map((r) => r.configurationSlot).sort()).toEqual([1, 3]);
    const remaining = await ChargingStationNetworkProfile.findAll();
    expect(remaining).toHaveLength(2);
    expect(remaining.map((r) => [r.ocppConnectionName, r.configurationSlot]).sort()).toEqual([
      ['CP-A', 2],
      ['CP-B', 9],
    ]);
  });

  it("delete under one tenant leaves the other tenant's identically named rows", async () => {
    await aStation(TENANT_A, 'CP-X');
    await aStation(TENANT_B, 'CP-X');
    await aServerProfile('ws-a');
    await aServerProfile('ws-b', { tenantId: TENANT_B });
    await aSlotRow('CP-X', 5, 'ws-a', TENANT_A);
    await aSlotRow('CP-X', 6, 'ws-b', TENANT_B);

    // Tenant A's slot 5 matches the name and the slot list but not the tenant.
    const deleted = await makeRepo().deleteAllByStationIdAndConfigurationSlots(
      TENANT_B,
      'CP-X',
      [5, 6],
    );

    expect(deleted).toHaveLength(1);
    expect(deleted[0].tenantId).toBe(TENANT_B);
    expect(deleted[0].configurationSlot).toBe(6);
    const remaining = await ChargingStationNetworkProfile.findAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].tenantId).toBe(TENANT_A);
    expect(remaining[0].configurationSlot).toBe(5);
  });

  it('a duplicate slot for the same station is rejected', async () => {
    await aStation(TENANT_A);
    await aServerProfile('ws-0');
    await aServerProfile('ws-1');
    await aSlotRow(STATION, 1, 'ws-0');

    await expect(aSlotRow(STATION, 1, 'ws-1')).rejects.toMatchObject({
      name: 'SequelizeUniqueConstraintError',
    });
    expect(await ChargingStationNetworkProfile.count()).toBe(1);
  });
});

describe('SequelizeChargingStationSecurityInfoRepository', () => {
  function makeRepo() {
    return new SequelizeChargingStationSecurityInfoRepository(deps());
  }

  // ocppConnectionName and publicKeyFileId are public class fields on the model, which shadow
  // Sequelize's attribute getters under ES2022 define semantics: instance property reads come
  // back undefined even though the columns persist. Row values are asserted through get();
  // the found-row return of readChargingStationPublicKeyFileId and the resolveStationId hook
  // (it reads the shadowed field) are left untested.
  it('readOrCreateChargingStationInfo creates the row with the fileId default', async () => {
    await makeRepo().readOrCreateChargingStationInfo(TENANT_A, STATION, 'file-1');

    const rows = await ChargingStationSecurityInfo.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].get('ocppConnectionName')).toBe(STATION);
    expect(rows[0].get('publicKeyFileId')).toBe('file-1');
    expect(rows[0].tenantId).toBe(TENANT_A);
  });

  it('a second readOrCreate keeps the original fileId', async () => {
    const repo = makeRepo();
    await repo.readOrCreateChargingStationInfo(TENANT_A, STATION, 'file-1');
    await repo.readOrCreateChargingStationInfo(TENANT_A, STATION, 'file-2');

    const rows = await ChargingStationSecurityInfo.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0].get('publicKeyFileId')).toBe('file-1');
  });

  it("readChargingStationPublicKeyFileId returns '' when the tenant has no row", async () => {
    const repo = makeRepo();
    await repo.readOrCreateChargingStationInfo(TENANT_A, STATION, 'file-9');

    expect(await repo.readChargingStationPublicKeyFileId(TENANT_A, 'CP-MISSING')).toBe('');
    expect(await repo.readChargingStationPublicKeyFileId(TENANT_B, STATION)).toBe('');
  });

  it('the same connection name carries a distinct fileId per tenant', async () => {
    const repo = makeRepo();
    await repo.readOrCreateChargingStationInfo(TENANT_A, STATION, 'file-a');
    await repo.readOrCreateChargingStationInfo(TENANT_B, STATION, 'file-b');

    expect(await ChargingStationSecurityInfo.count()).toBe(2);
    const rowA = await ChargingStationSecurityInfo.findOne({ where: { tenantId: TENANT_A } });
    const rowB = await ChargingStationSecurityInfo.findOne({ where: { tenantId: TENANT_B } });
    expect(rowA!.get('publicKeyFileId')).toBe('file-a');
    expect(rowB!.get('publicKeyFileId')).toBe('file-b');
    expect(rowA!.get('ocppConnectionName')).toBe(STATION);
    expect(rowB!.get('ocppConnectionName')).toBe(STATION);
  });

  it('a duplicate (connection name, tenant) row is rejected', async () => {
    await ChargingStationSecurityInfo.create({
      ocppConnectionName: STATION,
      publicKeyFileId: 'file-1',
      tenantId: TENANT_A,
    } as any);

    await expect(
      ChargingStationSecurityInfo.create({
        ocppConnectionName: STATION,
        publicKeyFileId: 'file-2',
        tenantId: TENANT_A,
      } as any),
    ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
    expect(await ChargingStationSecurityInfo.count()).toBe(1);
  });
});
