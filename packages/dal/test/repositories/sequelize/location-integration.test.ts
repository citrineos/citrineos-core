// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OCPPVersion, type SystemConfig } from '@citrineos/types';
import {
  ChargingStation,
  Connector,
  Evse,
  Location,
  SequelizeLocationRepository,
  StatusNotification,
} from '../../../index.js';
import { LatestStatusNotification } from '@dal/models/location/latest-status-notification.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeLocationRepository owns the Location -> ChargingStation -> Evse -> Connector
// tree plus the status notification trail. Location.coordinates is a PostGIS
// GEOMETRY(POINT); ChargingStation.ocppConnectionName is unique per tenant only.
// Connector and StatusNotification still resolve their stationId FK from
// ocppConnectionName in a BeforeCreate hook; Evse no longer does — the repository
// resolves it through resolveStationId() before writing the row.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION_NAME = 'CS001';
const TS = '2026-01-05T10:00:00.000Z';
const BERLIN = { type: 'Point', coordinates: [13.405, 52.52] };
const HAMBURG = { type: 'Point', coordinates: [9.9937, 53.5511] };

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

function makeRepo(): SequelizeLocationRepository {
  return new SequelizeLocationRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

async function aLocation(overrides: Record<string, unknown> = {}) {
  return Location.create({
    name: 'Depot',
    address: '1 Main St',
    city: 'Berlin',
    postalCode: '10115',
    state: 'BE',
    country: 'DEU',
    coordinates: BERLIN,
    tenantId: TENANT_A,
    ...overrides,
  } as any);
}

async function aStation(overrides: Record<string, unknown> = {}) {
  return ChargingStation.create({
    ocppConnectionName: STATION_NAME,
    isOnline: false,
    tenantId: TENANT_A,
    ...overrides,
  } as any);
}

// Station with one EVSE (OCPP 2.0.1 evse id 1) and two connectors.
// Connector.evseTypeConnectorId is the per-EVSE OCPP 2.0.1 connector number;
// Connector.connectorId is the station-wide OCPP 1.6 connector number.
// stationId has to be passed on the Evse: the model dropped its resolving hook,
// so a direct Evse.create leaves the FK null and the station's evses unlinked.
async function aCommissionedStation() {
  const station = await aStation();
  const evse = await Evse.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION_NAME,
    stationId: station.id,
    evseTypeId: 1,
  } as any);
  const connector1 = await Connector.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION_NAME,
    evseId: evse.id,
    connectorId: 1,
    evseTypeConnectorId: 1,
    status: 'Available',
    timestamp: TS,
  } as any);
  const connector2 = await Connector.create({
    tenantId: TENANT_A,
    ocppConnectionName: STATION_NAME,
    evseId: evse.id,
    connectorId: 2,
    evseTypeConnectorId: 2,
    status: 'Available',
    timestamp: TS,
  } as any);
  return { station, evse, connector1, connector2 };
}

function aStatusNotification(overrides: Record<string, unknown> = {}) {
  return StatusNotification.build({
    tenantId: TENANT_A,
    ocppConnectionName: STATION_NAME,
    timestamp: TS,
    connectorStatus: 'Available',
    evseId: 1,
    ...overrides,
  } as any);
}

describe('SequelizeLocationRepository', () => {
  describe('readLocationById', () => {
    it('returns the location with its charging pool', async () => {
      const location = await aLocation();
      await aStation({ locationId: location.id });
      await aStation({ ocppConnectionName: 'CS002', locationId: location.id });

      const found = await makeRepo().readLocationById(TENANT_A, location.id);

      expect(found).toBeDefined();
      expect(found!.name).toBe('Depot');
      expect(found!.city).toBe('Berlin');
      expect(found!.chargingPool).toHaveLength(2);
      expect(found!.chargingPool.map((s) => s.ocppConnectionName).sort()).toEqual([
        'CS001',
        'CS002',
      ]);
    });

    it("does not return another tenant's location", async () => {
      const location = await aLocation({ tenantId: TENANT_A });

      const found = await makeRepo().readLocationById(TENANT_B, location.id);

      expect(found).toBeUndefined();
    });
  });

  describe('createOrUpdateLocationWithChargingStations', () => {
    it('creates a location and round-trips the geometry point', async () => {
      const saved = await makeRepo().createOrUpdateLocationWithChargingStations(TENANT_A, {
        name: 'Hafen Depot',
        address: 'Speicherstadt 1',
        city: 'Hamburg',
        postalCode: '20457',
        state: 'HH',
        country: 'DEU',
        coordinates: HAMBURG,
        // The method overwrites tenantId with its tenantId argument.
        tenantId: TENANT_B,
      } as any);

      expect(saved.tenantId).toBe(TENANT_A);
      expect(await Location.count()).toBe(1);
      const row = await Location.findByPk(saved.id);
      expect(row!.name).toBe('Hafen Depot');
      expect(row!.postalCode).toBe('20457');
      expect(row!.coordinates).toMatchObject({
        type: 'Point',
        coordinates: [9.9937, 53.5511],
      });
    });

    it('creates a missing location under the caller-supplied id', async () => {
      const saved = await makeRepo().createOrUpdateLocationWithChargingStations(TENANT_A, {
        id: 4242,
        name: 'Preassigned',
        address: '2 Side St',
        city: 'Munich',
        postalCode: '80331',
        state: 'BY',
        country: 'DEU',
        coordinates: BERLIN,
      } as any);

      expect(saved.id).toBe(4242);
      expect(await Location.count()).toBe(1);
      expect((await Location.findByPk(4242))!.name).toBe('Preassigned');
    });

    it('updates named fields in place and leaves unset ones alone', async () => {
      const existing = await aLocation();

      const saved = await makeRepo().createOrUpdateLocationWithChargingStations(TENANT_A, {
        id: existing.id,
        name: 'Renamed Depot',
        coordinates: HAMBURG,
      } as any);

      expect(await Location.count()).toBe(1);
      expect(saved.id).toBe(existing.id);
      expect(saved.name).toBe('Renamed Depot');
      const row = await Location.findByPk(existing.id);
      expect(row!.name).toBe('Renamed Depot');
      expect(row!.address).toBe('1 Main St');
      expect(row!.city).toBe('Berlin');
      expect(row!.coordinates).toMatchObject({ type: 'Point', coordinates: [9.9937, 53.5511] });
    });

    it('creates the charging pool stations and links them to the location', async () => {
      const saved = await makeRepo().createOrUpdateLocationWithChargingStations(TENANT_A, {
        name: 'Pool Site',
        address: '3 Pool St',
        city: 'Cologne',
        postalCode: '50667',
        state: 'NW',
        country: 'DEU',
        coordinates: BERLIN,
        chargingPool: [
          { ocppConnectionName: 'CS-A', chargePointVendor: 'VendorA' },
          { ocppConnectionName: 'CS-B', chargePointVendor: 'VendorB' },
        ],
      } as any);

      expect(saved.chargingPool).toHaveLength(2);
      const stations = await ChargingStation.findAll({ order: [['ocppConnectionName', 'ASC']] });
      expect(stations.map((s) => s.ocppConnectionName)).toEqual(['CS-A', 'CS-B']);
      expect(stations.map((s) => s.locationId)).toEqual([saved.id, saved.id]);
      expect(stations.map((s) => s.tenantId)).toEqual([TENANT_A, TENANT_A]);
    });

    it('adopts an existing station into the pool instead of duplicating it', async () => {
      const orphan = await aStation({
        ocppConnectionName: 'CS-A',
        chargePointVendor: 'OldVendor',
      });

      const saved = await makeRepo().createOrUpdateLocationWithChargingStations(TENANT_A, {
        name: 'Adopting Site',
        address: '4 Adopt St',
        city: 'Bremen',
        postalCode: '28195',
        state: 'HB',
        country: 'DEU',
        coordinates: BERLIN,
        chargingPool: [{ ocppConnectionName: 'CS-A', chargePointVendor: 'NewVendor' }],
      } as any);

      expect(await ChargingStation.count()).toBe(1);
      const row = await ChargingStation.findByPk(orphan.id);
      expect(row!.locationId).toBe(saved.id);
      expect(row!.chargePointVendor).toBe('NewVendor');
    });
  });

  describe('createOrUpdateChargingStation', () => {
    it("creates a separate row for another tenant instead of touching tenant A's station", async () => {
      const stationA = await aStation({ chargePointVendor: 'VendorA' });

      const forB = await makeRepo().createOrUpdateChargingStation(TENANT_B, {
        ocppConnectionName: STATION_NAME,
        chargePointVendor: 'VendorB',
      } as any);

      expect(await ChargingStation.count()).toBe(2);
      expect(forB.id).not.toBe(stationA.id);
      expect(forB.tenantId).toBe(TENANT_B);
      expect(forB.chargePointVendor).toBe('VendorB');
      expect((await ChargingStation.findByPk(stationA.id))!.chargePointVendor).toBe('VendorA');
    });

    it('a duplicate name within one tenant hits the composite unique constraint', async () => {
      await aStation();

      await expect(aStation()).rejects.toMatchObject({
        name: 'SequelizeUniqueConstraintError',
      });
      expect(await ChargingStation.count()).toBe(1);
    });
  });

  describe('setChargingStationIsOnlineAndOCPPVersion', () => {
    it('going offline with no station row is a no-op', async () => {
      const result = await makeRepo().setChargingStationIsOnlineAndOCPPVersion(
        TENANT_A,
        'CS-GHOST',
        false,
        null,
      );

      expect(result).toBeUndefined();
      expect(await ChargingStation.count()).toBe(0);
    });

    it('going online with no station row creates one', async () => {
      const result = await makeRepo().setChargingStationIsOnlineAndOCPPVersion(
        TENANT_A,
        'CS-NEW',
        true,
        OCPPVersion.OCPP2_0_1,
      );

      expect(result).toBeDefined();
      expect(result!.ocppConnectionName).toBe('CS-NEW');
      expect(result!.isOnline).toBe(true);
      expect(result!.protocol).toBe('ocpp2.0.1');
      expect(result!.connectedWebsocketServerConfigId ?? null).toBeNull();
      expect(result!.tenantId).toBe(TENANT_A);
      expect(await ChargingStation.count()).toBe(1);
    });

    it('updates the existing station and clears the protocol on disconnect', async () => {
      const station = await aStation({ isOnline: true, protocol: OCPPVersion.OCPP2_0_1 });

      const result = await makeRepo().setChargingStationIsOnlineAndOCPPVersion(
        TENANT_A,
        STATION_NAME,
        false,
        null,
      );

      expect(result!.id).toBe(station.id);
      expect(result!.isOnline).toBe(false);
      expect(result!.protocol ?? null).toBeNull();
      expect(await ChargingStation.count()).toBe(1);
    });
  });

  describe('doesChargingStationExistByOcppConnectionName', () => {
    it('is true within the owning tenant only', async () => {
      await aStation();
      const repo = makeRepo();

      expect(await repo.doesChargingStationExistByOcppConnectionName(TENANT_A, STATION_NAME)).toBe(
        true,
      );
      expect(await repo.doesChargingStationExistByOcppConnectionName(TENANT_B, STATION_NAME)).toBe(
        false,
      );
      expect(await repo.doesChargingStationExistByOcppConnectionName(TENANT_A, 'CS-GHOST')).toBe(
        false,
      );
    });
  });

  describe('getChargingStationsByIds', () => {
    it('returns only the named stations of the requesting tenant', async () => {
      await aStation();
      await aStation({ ocppConnectionName: 'CS002' });
      await aStation({ tenantId: TENANT_B });
      const repo = makeRepo();

      const forA = await repo.getChargingStationsByIds(TENANT_A, ['CS001', 'CS002', 'CS404']);
      const forB = await repo.getChargingStationsByIds(TENANT_B, ['CS001']);

      expect(forA.map((s) => s.ocppConnectionName).sort()).toEqual(['CS001', 'CS002']);
      expect(forA.map((s) => s.tenantId)).toEqual([TENANT_A, TENANT_A]);
      expect(forB).toHaveLength(1);
      expect(forB[0].tenantId).toBe(TENANT_B);
    });
  });

  describe('addStatusNotificationToChargingStation', () => {
    it('stores the notification and points the latest entry at it', async () => {
      const { station, connector1 } = await aCommissionedStation();

      await makeRepo().addStatusNotificationToChargingStation(
        TENANT_A,
        STATION_NAME,
        aStatusNotification({ connectorId: connector1.id, connectorStatus: 'Occupied' }),
      );

      const rows = await StatusNotification.findAll();
      expect(rows).toHaveLength(1);
      expect(rows[0].stationId).toBe(station.id);
      expect(rows[0].connectorStatus).toBe('Occupied');
      expect(rows[0].evseId).toBe(1);
      expect(rows[0].connectorId).toBe(connector1.id);
      const latest = await LatestStatusNotification.findAll();
      expect(latest).toHaveLength(1);
      expect(latest[0].statusNotificationId).toBe(rows[0].id);
      expect(latest[0].stationId).toBe(station.id);
      expect(latest[0].ocppConnectionName).toBe(STATION_NAME);
    });

    it('a newer notification for the same evse and connector replaces the latest entry', async () => {
      const { connector1 } = await aCommissionedStation();
      const repo = makeRepo();

      await repo.addStatusNotificationToChargingStation(
        TENANT_A,
        STATION_NAME,
        aStatusNotification({ connectorId: connector1.id, connectorStatus: 'Occupied' }),
      );
      await repo.addStatusNotificationToChargingStation(
        TENANT_A,
        STATION_NAME,
        aStatusNotification({ connectorId: connector1.id, connectorStatus: 'Available' }),
      );

      expect(await StatusNotification.count()).toBe(2);
      const latest = await LatestStatusNotification.findAll({ include: [StatusNotification] });
      expect(latest).toHaveLength(1);
      expect(latest[0].statusNotification.connectorStatus).toBe('Available');
    });

    it('notifications for different connectors keep separate latest entries', async () => {
      const { connector1, connector2 } = await aCommissionedStation();
      const repo = makeRepo();

      await repo.addStatusNotificationToChargingStation(
        TENANT_A,
        STATION_NAME,
        aStatusNotification({ connectorId: connector1.id }),
      );
      await repo.addStatusNotificationToChargingStation(
        TENANT_A,
        STATION_NAME,
        aStatusNotification({ connectorId: connector2.id, connectorStatus: 'Faulted' }),
      );

      const latest = await LatestStatusNotification.findAll({ include: [StatusNotification] });
      expect(latest).toHaveLength(2);
      expect(
        latest.map((l) => (l.statusNotification as StatusNotification).connectorId).sort(),
      ).toEqual([connector1.id, connector2.id]);
    });
  });

  describe('createOrUpdateEvse', () => {
    it('creates the evse and resolves the station FK from the connection name', async () => {
      const station = await aStation();

      const created = await makeRepo().createOrUpdateEvse(TENANT_A, {
        ocppConnectionName: STATION_NAME,
        evseTypeId: 1,
        evseId: 'DE*ICE*E1',
      } as any);

      expect(created.evseTypeId).toBe(1);
      expect(await Evse.count()).toBe(1);
      const row = await Evse.findOne({ where: { ocppConnectionName: STATION_NAME } });
      expect(row!.stationId).toBe(station.id);
      expect(row!.evseId).toBe('DE*ICE*E1');
      expect(row!.tenantId).toBe(TENANT_A);
    });

    it('leaves stationId empty when no station matches the connection name', async () => {
      await makeRepo().createOrUpdateEvse(TENANT_A, {
        ocppConnectionName: 'CS-UNSEEN',
        evseTypeId: 1,
      } as any);

      const row = await Evse.findOne({ where: { ocppConnectionName: 'CS-UNSEEN' } });
      expect(row).toBeDefined();
      expect(row!.stationId ?? null).toBeNull();
    });

    it('updates the existing evse in place', async () => {
      await aStation();
      const repo = makeRepo();
      const created = await repo.createOrUpdateEvse(TENANT_A, {
        ocppConnectionName: STATION_NAME,
        evseTypeId: 1,
        evseId: 'DE*ICE*E1',
      } as any);

      const updated = await repo.createOrUpdateEvse(TENANT_A, {
        ocppConnectionName: STATION_NAME,
        evseTypeId: 1,
        evseId: 'DE*ICE*E2',
        physicalReference: 'Bay 4',
      } as any);

      expect(await Evse.count()).toBe(1);
      expect((updated as Evse).id).toBe((created as Evse).id);
      expect(updated.evseId).toBe('DE*ICE*E2');
      expect(updated.physicalReference).toBe('Bay 4');
    });
  });

  describe('createOrUpdateOcpp16Connector', () => {
    it('creates the connector under its evse and resolves the station FK', async () => {
      const station = await aStation();
      const evse = await Evse.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION_NAME,
        evseTypeId: 1,
      } as any);

      const created = await makeRepo().createOrUpdateOcpp16Connector(TENANT_A, {
        ocppConnectionName: STATION_NAME,
        connectorId: 1,
        evseId: evse.id,
        status: 'Available',
        timestamp: TS,
      } as any);

      expect(created).toBeDefined();
      expect(created!.connectorId).toBe(1);
      expect(created!.stationId).toBe(station.id);
      expect(created!.status).toBe('Available');
      expect(created!.errorCode).toBe('NoError');
      expect(created!.timestamp).toBe(TS);
      expect(await Connector.count()).toBe(1);
    });

    it('updates the existing connector in place', async () => {
      const { connector1 } = await aCommissionedStation();

      const updated = await makeRepo().createOrUpdateOcpp16Connector(TENANT_A, {
        ocppConnectionName: STATION_NAME,
        connectorId: 1,
        evseId: connector1.evseId,
        status: 'Charging',
        timestamp: TS,
      } as any);

      expect(updated!.id).toBe(connector1.id);
      expect(updated!.status).toBe('Charging');
      expect(updated!.errorCode).toBe('NoError');
      expect(await Connector.count()).toBe(2);
      expect((await Connector.findByPk(connector1.id))!.status).toBe('Charging');
    });
  });

  describe('createOrUpdateOcpp2Connector', () => {
    it('creates the connector keyed on its evse and per-evse connector number', async () => {
      const station = await aStation();
      const evse = await Evse.create({
        tenantId: TENANT_A,
        ocppConnectionName: STATION_NAME,
        evseTypeId: 1,
      } as any);

      const created = await makeRepo().createOrUpdateOcpp2Connector(TENANT_A, {
        ocppConnectionName: STATION_NAME,
        evseId: evse.id,
        evseTypeConnectorId: 1,
        status: 'Available',
        timestamp: TS,
      } as any);

      expect(created).toBeDefined();
      expect(created!.evseTypeConnectorId).toBe(1);
      expect(created!.stationId).toBe(station.id);
      expect(created!.connectorId ?? null).toBeNull();
      expect(await Connector.count()).toBe(1);
    });

    it('a second report on the same evse connector updates rather than duplicates', async () => {
      const { evse, connector1 } = await aCommissionedStation();
      const repo = makeRepo();

      const updated = await repo.createOrUpdateOcpp2Connector(TENANT_A, {
        ocppConnectionName: STATION_NAME,
        evseId: evse.id,
        evseTypeConnectorId: 1,
        status: 'Faulted',
        timestamp: TS,
      } as any);

      expect(updated!.id).toBe(connector1.id);
      expect(await Connector.count()).toBe(2);
      expect((await Connector.findByPk(connector1.id))!.status).toBe('Faulted');
    });
  });

  describe('updateAllConnectorsByQuery', () => {
    it('updates every matching connector and honours the tenant scope', async () => {
      const { connector1, connector2 } = await aCommissionedStation();
      const repo = makeRepo();

      const updated = await repo.updateAllConnectorsByQuery(
        TENANT_A,
        { status: 'Unavailable' } as any,
        { where: { ocppConnectionName: STATION_NAME } },
      );
      const forB = await repo.updateAllConnectorsByQuery(TENANT_B, { status: 'Available' } as any, {
        where: { ocppConnectionName: STATION_NAME },
      });

      expect(updated.map((c) => c.id).sort()).toEqual([connector1.id, connector2.id]);
      expect(updated.map((c) => c.status)).toEqual(['Unavailable', 'Unavailable']);
      expect(forB).toHaveLength(0);
      const rows = await Connector.findAll();
      expect(rows.map((r) => r.status)).toEqual(['Unavailable', 'Unavailable']);
    });
  });

  describe('autoCommissionEvseForOcpp16Connector', () => {
    it('creates a bare evse with the station FK resolved', async () => {
      const station = await aStation();

      const result = await makeRepo().autoCommissionEvseForOcpp16Connector(TENANT_A, STATION_NAME);

      const evse = await Evse.findByPk(result.evseId);
      expect(evse!.ocppConnectionName).toBe(STATION_NAME);
      expect(evse!.stationId).toBe(station.id);
      expect(evse!.tenantId).toBe(TENANT_A);
      // OCPP 1.6 has no EVSE concept, so no OCPP 2.0.1 evse number is assigned.
      expect(evse!.evseTypeId ?? null).toBeNull();
    });

    // The commissioned EVSE is not keyed on anything the caller passes, so each
    // call yields a fresh row: one EVSE per 1.6 connector.
    it('gives every call its own evse', async () => {
      await aStation();
      const repo = makeRepo();

      const first = await repo.autoCommissionEvseForOcpp16Connector(TENANT_A, STATION_NAME);
      const second = await repo.autoCommissionEvseForOcpp16Connector(TENANT_A, STATION_NAME);

      expect(second.evseId).not.toBe(first.evseId);
      expect(await Evse.count()).toBe(2);
    });
  });

  describe('updateChargingStationTimestamp', () => {
    it('stamps only the named station', async () => {
      await aStation();
      await aStation({ ocppConnectionName: 'CS002' });

      await makeRepo().updateChargingStationTimestamp(TENANT_A, STATION_NAME, TS);

      const stamped = await ChargingStation.findOne({
        where: { ocppConnectionName: STATION_NAME },
      });
      expect(new Date(stamped!.latestOcppMessageTimestamp as any).toISOString()).toBe(TS);
      const other = await ChargingStation.findOne({ where: { ocppConnectionName: 'CS002' } });
      expect(other!.latestOcppMessageTimestamp ?? null).toBeNull();
    });
  });

  describe('topology reads', () => {
    it('readChargingStationByOcppConnectionName loads evses with their connectors', async () => {
      const { station, evse } = await aCommissionedStation();
      const repo = makeRepo();

      const found = await repo.readChargingStationByOcppConnectionName(TENANT_A, STATION_NAME);

      expect(found!.id).toBe(station.id);
      expect(found!.evses).toHaveLength(1);
      expect((found!.evses![0] as Evse).id).toBe(evse.id);
      expect((found!.evses![0] as Evse).connectors).toHaveLength(2);
      expect(
        await repo.readChargingStationByOcppConnectionName(TENANT_B, STATION_NAME),
      ).toBeUndefined();
    });

    it('readConnectorByStationIdAndOcpp16ConnectorId finds the connector with its evse', async () => {
      const { evse, connector1 } = await aCommissionedStation();
      const repo = makeRepo();

      const found = await repo.readConnectorByStationIdAndOcpp16ConnectorId(
        TENANT_A,
        STATION_NAME,
        1,
      );

      expect(found!.id).toBe(connector1.id);
      expect((found!.evse as Evse).id).toBe(evse.id);
      expect(
        await repo.readConnectorByStationIdAndOcpp16ConnectorId(TENANT_A, STATION_NAME, 9),
      ).toBeUndefined();
    });

    it('readEvseByStationIdAndOcpp201EvseId finds the evse with its connectors', async () => {
      const { evse } = await aCommissionedStation();
      const repo = makeRepo();

      const found = await repo.readEvseByStationIdAndOcpp201EvseId(TENANT_A, STATION_NAME, 1);

      expect(found!.id).toBe(evse.id);
      expect(found!.connectors).toHaveLength(2);
      expect(
        await repo.readEvseByStationIdAndOcpp201EvseId(TENANT_B, STATION_NAME, 1),
      ).toBeUndefined();
    });

    it('readConnectorByStationIdAndOcpp201EvseType matches the evse and connector pair', async () => {
      const { connector1 } = await aCommissionedStation();
      const repo = makeRepo();

      const found = await repo.readConnectorByStationIdAndOcpp201EvseType(TENANT_A, STATION_NAME, {
        id: 1,
        connectorId: 1,
      } as any);
      const miss = await repo.readConnectorByStationIdAndOcpp201EvseType(TENANT_A, STATION_NAME, {
        id: 99,
        connectorId: 1,
      } as any);

      expect(found!.id).toBe(connector1.id);
      expect(miss).toBeUndefined();
    });
  });
});
