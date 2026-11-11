// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  SequelizeAuthorizationRepository,
  SequelizeChargingStationSequenceRepository,
  SequelizeLocationRepository,
  SequelizeTariffRepository,
  SequelizeTenantRepository,
  SequelizeTransactionEventRepository,
} from '@citrineos/dal';
import { OCPPVersion } from '@citrineos/types';
import { QueryTypes } from 'sequelize';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CoreData } from '../../src/core/core-data.js';
import { toSystemConfig } from '../../src/db/database.js';
import {
  aTariff,
  resetDatabase,
  startTestDatabase,
  TENANT_A,
  TENANT_B,
  type TestDatabase,
} from '../support/database.js';

let db: TestDatabase;
let coreData: CoreData;

beforeAll(async () => {
  db = await startTestDatabase();
  const dependencies = {
    config: toSystemConfig({
      env: 'development',
      database: { host: 'unused', port: 1, database: 'unused', username: 'unused', password: '' },
    }),
    sequelizeInstance: db.sequelize,
  };
  const locationRepository = new SequelizeLocationRepository(dependencies);
  coreData = new CoreData({
    evseRepository: locationRepository,
    connectorRepository: locationRepository,
    chargingStationRepository: locationRepository,
    locationRepository,
    tenantRepository: new SequelizeTenantRepository(dependencies),
    tariffRepository: new SequelizeTariffRepository(dependencies),
    authorizationRepository: new SequelizeAuthorizationRepository(dependencies),
    chargingStationSequenceRepository: new SequelizeChargingStationSequenceRepository(dependencies),
    transactionRepository: new SequelizeTransactionEventRepository(dependencies),
  });
}, 90_000);

afterAll(async () => {
  await db?.stop();
});

beforeEach(async () => {
  await db.sequelize.query(
    'TRUNCATE TABLE "Transactions", "Authorizations", "ChargingStationSequences", "Connectors", "Evses", "ChargingStations" RESTART IDENTITY CASCADE;',
  );
  await resetDatabase(db);
});

async function insert(table: string, row: Record<string, unknown>): Promise<number> {
  const columns = Object.keys(row);
  const [result] = await db.sequelize.query<{ id: number }>(
    `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}, "createdAt", "updatedAt")
     VALUES (${columns.map((c) => `:${c}`).join(', ')}, now(), now()) RETURNING id`,
    { replacements: row, type: QueryTypes.SELECT },
  );
  return result.id;
}

async function aStation(tenantId: number, protocol: OCPPVersion | null = OCPPVersion.OCPP2_0_1) {
  const stationId = await insert('ChargingStations', {
    ocppConnectionName: `CS-${tenantId}`,
    isOnline: true,
    protocol,
    tenantId,
  });
  const evseId = await insert('Evses', {
    stationId,
    evseTypeId: 1,
    evseId: `US*CIT*E${tenantId}`,
    tenantId,
  });
  const tariff = await aTariff(tenantId);
  const connectorId = await insert('Connectors', {
    stationId,
    evseId,
    connectorId: 2,
    evseTypeConnectorId: 1,
    status: 'Available',
    tariffId: tariff.id,
    tenantId,
  });
  return { stationId, evseId, connectorId, tariff };
}

describe('CoreData', () => {
  it('resolves an EVSE to its tenant and reads it with its station and connectors', async () => {
    const { evseId, connectorId } = await aStation(TENANT_B);

    expect(await coreData.resolveEvseTenant(evseId)).toBe(TENANT_B);
    expect(await coreData.readEvse(TENANT_B, evseId)).toEqual({
      id: evseId,
      tenantId: TENANT_B,
      evseId: `US*CIT*E${TENANT_B}`,
      evseTypeId: 1,
      removed: false,
      station: { ocppConnectionName: `CS-${TENANT_B}`, protocol: 'ocpp2.0.1', isOnline: true },
      connectors: [
        {
          id: connectorId,
          connectorId: 2,
          evseTypeConnectorId: 1,
          status: 'Available',
          type: null,
          powerType: null,
          maximumPowerWatts: null,
        },
      ],
      location: null,
      operatorName: 'Tenant B',
    });
  });

  it('reads where an EVSE stands', async () => {
    const { stationId, evseId } = await aStation(TENANT_A);
    const [location] = await db.sequelize.query<{ id: number }>(
      `INSERT INTO "Locations" (name, address, city, "postalCode", state, country, "publishUpstream",
         "timeZone", coordinates, "tenantId", "createdAt", "updatedAt")
       VALUES ('Depot', '1 Main Street', 'Boston', '02110', 'MA', 'USA', false, 'America/New_York',
         ST_GeomFromText('POINT(13.4 52.5)', 4326), :tenantId, now(), now()) RETURNING id`,
      { replacements: { tenantId: TENANT_A }, type: QueryTypes.SELECT },
    );
    await db.sequelize.query(
      'UPDATE "ChargingStations" SET "locationId" = :locationId WHERE id = :id',
      {
        replacements: { locationId: location.id, id: stationId },
      },
    );

    expect((await coreData.readEvse(TENANT_A, evseId))?.location).toEqual({
      name: 'Depot',
      address: '1 Main Street',
      city: 'Boston',
      postalCode: '02110',
      state: 'MA',
      country: 'USA',
    });
  });

  it('finds EVSEs by eMI3 id across tenants, without separators or case', async () => {
    const a = await aStation(TENANT_A);
    const b = await aStation(TENANT_B);

    expect(await coreData.findEvsesByEmi3Id(`us*cit*e${TENANT_B}`)).toEqual([b.evseId]);
    expect(await coreData.findEvsesByEmi3Id(`USCITE${TENANT_A}`)).toEqual([a.evseId]);
    expect(await coreData.findEvsesByEmi3Id('US*CIT*E9')).toEqual([]);
    expect(await coreData.findEvsesByEmi3Id('***')).toEqual([]);

    await db.sequelize.query('UPDATE "Evses" SET removed = true WHERE id = :id', {
      replacements: { id: a.evseId },
    });
    expect(await coreData.findEvsesByEmi3Id(`USCITE${TENANT_A}`)).toEqual([]);
  });

  it('does not read an EVSE through another tenant', async () => {
    const { evseId } = await aStation(TENANT_B);

    expect(await coreData.readEvse(TENANT_A, evseId)).toBeUndefined();
  });

  it('reads where a connector’s remote start goes', async () => {
    const { evseId, connectorId } = await aStation(TENANT_A, OCPPVersion.OCPP1_6);

    expect(await coreData.readConnectorTarget(TENANT_A, connectorId)).toEqual({
      evseId,
      ocppConnectionName: `CS-${TENANT_A}`,
      protocol: 'ocpp1.6',
      evseTypeId: 1,
      connectorId: 2,
    });
    expect(await coreData.readConnectorTarget(TENANT_B, connectorId)).toBeUndefined();
  });

  it('reads a connector’s tariff as a snapshot', async () => {
    const { connectorId, tariff } = await aStation(TENANT_A);

    expect(await coreData.readTariffForConnector(TENANT_A, connectorId)).toMatchObject({
      id: tariff.id,
      currency: 'USD',
      pricePerKwh: 0.42,
      authorizationAmount: 50,
    });
  });

  it('reads no tariff for a connector priced with another tenant’s tariff', async () => {
    const { connectorId } = await aStation(TENANT_A);
    const foreign = await aTariff(TENANT_B);
    await db.sequelize.query('UPDATE "Connectors" SET "tariffId" = :tariffId WHERE id = :id', {
      replacements: { tariffId: foreign.id, id: connectorId },
    });

    expect(await coreData.readTariffForConnector(TENANT_A, connectorId)).toBeUndefined();
  });

  it('creates an Authorization for an idToken once', async () => {
    const first = await coreData.ensureAuthorization(TENANT_A, 'PAY_1');
    const second = await coreData.ensureAuthorization(TENANT_A, 'PAY_1');

    expect(second).toBe(first);
    expect(await coreData.readAuthorizationId(TENANT_A, 'PAY_1')).toBe(first);
    expect(await coreData.readAuthorizationId(TENANT_B, 'PAY_1')).toBeUndefined();
    const [row] = await db.sequelize.query<{ idTokenType: string; status: string }>(
      'SELECT "idTokenType", status FROM "Authorizations" WHERE id = :id',
      { replacements: { id: first }, type: QueryTypes.SELECT },
    );
    expect(row).toEqual({ idTokenType: 'Central', status: 'Accepted' });
  });

  it('reads where a transaction runs', async () => {
    const { stationId, evseId, connectorId } = await aStation(TENANT_A);
    await insert('Transactions', {
      stationId,
      evseId,
      connectorId,
      transactionId: 'tx-2',
      isActive: true,
      tenantId: TENANT_A,
    });

    expect(await coreData.readTransaction(TENANT_A, `CS-${TENANT_A}`, 'tx-2')).toMatchObject({
      evseId,
      connectorId,
    });
  });

  it('counts remoteStartIds up per station', async () => {
    await aStation(TENANT_A);

    expect(await coreData.nextRemoteStartId(TENANT_A, `CS-${TENANT_A}`)).toBe(1);
    expect(await coreData.nextRemoteStartId(TENANT_A, `CS-${TENANT_A}`)).toBe(2);
  });

  it('finds the active transaction an Authorization started, then the ended one by its id', async () => {
    const { stationId } = await aStation(TENANT_A);
    const authorizationId = await coreData.ensureAuthorization(TENANT_A, 'PAY_1');
    const id = await insert('Transactions', {
      stationId,
      transactionId: 'tx-1',
      isActive: true,
      authorizationId,
      tenantId: TENANT_A,
    });

    expect(
      await coreData.readActiveTransactionForAuthorization(TENANT_A, authorizationId),
    ).toMatchObject({
      id,
      transactionId: 'tx-1',
      isActive: true,
    });

    await db.sequelize.query(
      'UPDATE "Transactions" SET "isActive" = false, "totalKwh" = 7.5, "timeSpentCharging" = 600 WHERE id = :id',
      { replacements: { id } },
    );
    expect(
      await coreData.readActiveTransactionForAuthorization(TENANT_A, authorizationId),
    ).toBeUndefined();
    expect(await coreData.readTransaction(TENANT_A, `CS-${TENANT_A}`, 'tx-1')).toMatchObject({
      id,
      isActive: false,
      totalKwh: 7.5,
      timeSpentCharging: 600,
      evseId: null,
      connectorId: null,
    });
    expect(await coreData.readTransactionById(TENANT_A, id)).toMatchObject({ id });
    expect(await coreData.readTransactionById(TENANT_B, id)).toBeUndefined();
  });

  it('finds the newest transaction an Authorization started since a moment', async () => {
    const { stationId } = await aStation(TENANT_A);
    const authorizationId = await coreData.ensureAuthorization(TENANT_A, 'PAY_9');
    const old = await insert('Transactions', {
      stationId,
      transactionId: 'old',
      isActive: false,
      authorizationId,
      tenantId: TENANT_A,
    });
    await db.sequelize.query(
      `UPDATE "Transactions" SET "createdAt" = now() - interval '30 days' WHERE id = :id`,
      { replacements: { id: old } },
    );
    const since = new Date(Date.now() - 60_000);

    expect(
      await coreData.readLatestTransactionForAuthorization(TENANT_A, authorizationId, since),
    ).toBeUndefined();

    const recent = await insert('Transactions', {
      stationId,
      transactionId: 'new',
      isActive: false,
      authorizationId,
      tenantId: TENANT_A,
    });
    expect(
      await coreData.readLatestTransactionForAuthorization(TENANT_A, authorizationId, since),
    ).toMatchObject({ id: recent, transactionId: 'new' });
    expect(
      await coreData.readLatestTransactionForAuthorization(TENANT_B, authorizationId, since),
    ).toBeUndefined();
  });
});
