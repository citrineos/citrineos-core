// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { OCPPVersion } from '@citrineos/types';
import {
  ChargingStation,
  Connector,
  Evse,
  EvseType,
  Location,
  StatusNotification,
} from '../../../index.js';
import { LatestStatusNotification } from '@dal/models/location/latest-status-notification.js';
import {
  DrizzleChargingStationRepository,
  toChargingStationDto,
} from '@dal/repositories/drizzle/charging-station.js';
import { DrizzleConnectorRepository, toConnectorDto } from '@dal/repositories/drizzle/connector.js';
import { DrizzleEvseRepository, toEvseDto } from '@dal/repositories/drizzle/evse.js';
import { DrizzleEvseTypeRepository, toEvseTypeDto } from '@dal/repositories/drizzle/evse-type.js';
import {
  DrizzleLatestStatusNotificationRepository,
  toLatestStatusNotificationDto,
} from '@dal/repositories/drizzle/latest-status-notification.js';
import { DrizzleLocationRepository, toLocationDto } from '@dal/repositories/drizzle/location.js';
import {
  DrizzleStatusNotificationRepository,
  toStatusNotificationDto,
} from '@dal/repositories/drizzle/status-notification.js';
import type { ChargingStationEntity } from '@dal/db/drizzle/schema/charging-station.js';
import type { ConnectorEntity } from '@dal/db/drizzle/schema/connector.js';
import type { EvseEntity } from '@dal/db/drizzle/schema/evse.js';
import type { EvseTypeEntity } from '@dal/db/drizzle/schema/evse-type.js';
import type { LatestStatusNotificationEntity } from '@dal/db/drizzle/schema/latest-status-notification.js';
import type { LocationEntity } from '@dal/db/drizzle/schema/location.js';
import type { StatusNotificationEntity } from '@dal/db/drizzle/schema/status-notification.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// Drizzle repositories for the location cluster are mostly Base-CRUD stubs, so
// this suite covers the shared findById/findAll/exists/countAll/updateById/deleteById
// paths over the sequelize-created schema, plus the row-to-DTO mappers. The
// GEOMETRY(POINT) columns cross layers in both directions: sequelize writes
// GeoJSON (SRID 4326), drizzle reads hex EWKB into a [lon, lat] tuple and
// writes WKT. The sequelize twins already have their own integration suite
// (test/repositories/sequelize/location-integration.test.ts).

const TENANT = 1;
const OTHER_TENANT = 2;
const STATION = 'CS-100';
const TS = '2026-01-05T10:00:00.000Z';
const TS2 = '2026-01-06T11:30:00.000Z';
const BERLIN: [number, number] = [13.405, 52.52];
const HAMBURG: [number, number] = [9.9937, 53.5511];

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

async function aLocation(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const location = await Location.create({
    name: 'Depot',
    address: '1 Main St',
    city: 'Berlin',
    postalCode: '10115',
    state: 'BE',
    country: 'DEU',
    coordinates: { type: 'Point', coordinates: BERLIN },
    tenantId,
    ...overrides,
  } as any);
  return location as unknown as { id: number };
}

async function aStation(
  tenantId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const station = await ChargingStation.create({
    ocppConnectionName: STATION,
    isOnline: false,
    tenantId,
    ...overrides,
  } as any);
  return station as unknown as { id: number };
}

// Station with two EvseTypes (created connectorId-null; the column is an FK to
// Connectors, which do not exist yet) and one EVSE. Connector still resolves
// stationId from ocppConnectionName in a BeforeCreate hook; Evse lost that hook
// (PR #1002 moved the lookup into the repositories), so the FK is passed in.
async function aCommissionedStation(tenantId: number) {
  const station = await aStation(tenantId);
  const typeA = (await EvseType.create({
    tenantId,
    id: 1,
    connectorId: null,
  } as any)) as unknown as {
    databaseId: number;
  };
  const typeB = (await EvseType.create({
    tenantId,
    id: 2,
    connectorId: null,
  } as any)) as unknown as {
    databaseId: number;
  };
  const evse = (await Evse.create({
    tenantId,
    stationId: station.id,
    ocppConnectionName: STATION,
    evseTypeId: 1,
    evseId: 'DE*ABC*E001',
  } as any)) as unknown as { id: number };
  return { station, typeA, typeB, evse };
}

async function aConnector(
  tenantId: number,
  evseDbId: number,
  evseTypeDbId: number,
  connectorId: number,
  overrides: Record<string, unknown> = {},
): Promise<{ id: number }> {
  const connector = await Connector.create({
    tenantId,
    ocppConnectionName: STATION,
    evseId: evseDbId,
    connectorId,
    evseTypeConnectorId: evseTypeDbId,
    status: 'Available',
    timestamp: TS,
    ...overrides,
  } as any);
  return connector as unknown as { id: number };
}

describe('DrizzleLocationRepository', () => {
  it('findById maps the row and converts the PostGIS point to GeoJSON', async () => {
    const repo = new DrizzleLocationRepository(deps());
    const loc = await aLocation(TENANT, { facilities: ['Hotel', 'Cafe'] });

    const dto = await repo.findById(TENANT, loc.id);

    expect(dto!.id).toBe(loc.id);
    expect(dto!.name).toBe('Depot');
    expect(dto!.address).toBe('1 Main St');
    expect(dto!.city).toBe('Berlin');
    expect(dto!.postalCode).toBe('10115');
    expect(dto!.country).toBe('DEU');
    expect(dto!.publishUpstream).toBe(true);
    expect(dto!.timeZone).toBe('UTC');
    expect(dto!.parkingType).toBeNull();
    expect(dto!.facilities).toEqual(['Hotel', 'Cafe']);
    expect(dto!.coordinates).toEqual({ type: 'Point', coordinates: BERLIN });
    expect(dto!.chargingPool).toBeUndefined();
    expect(dto!.tenantId).toBe(TENANT);
    expect(dto!.createdAt).toBeInstanceOf(Date);
  });

  it('findById, exists and countAll are tenant-scoped', async () => {
    const repo = new DrizzleLocationRepository(deps());
    const own = await aLocation(TENANT);
    await aLocation(OTHER_TENANT, { name: 'Harbor' });

    expect(await repo.findById(OTHER_TENANT, own.id)).toBeUndefined();
    expect(await repo.exists(TENANT, own.id)).toBe(true);
    expect(await repo.exists(OTHER_TENANT, own.id)).toBe(false);
    expect(await repo.countAll(TENANT)).toBe(1);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);

    const all = await repo.findAll(OTHER_TENANT);
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Harbor');
  });

  it('updateById writes a geometry tuple both layers read back', async () => {
    const repo = new DrizzleLocationRepository(deps());
    const loc = await aLocation(TENANT);

    expect(await repo.updateById(OTHER_TENANT, loc.id, { city: 'Nope' })).toBeUndefined();

    const updated = await repo.updateById(TENANT, loc.id, {
      city: 'Hamburg',
      coordinates: HAMBURG,
    });
    expect(updated!.city).toBe('Hamburg');
    expect(updated!.coordinates).toEqual({ type: 'Point', coordinates: HAMBURG });

    const viaSequelize = await Location.findByPk(loc.id);
    expect(viaSequelize!.coordinates).toMatchObject({ type: 'Point', coordinates: HAMBURG });
    expect(viaSequelize!.city).toBe('Hamburg');

    const reread = await repo.findById(TENANT, loc.id);
    expect(reread!.coordinates).toEqual({ type: 'Point', coordinates: HAMBURG });
  });

  it('deleteById removes the row and returns undefined afterwards', async () => {
    const repo = new DrizzleLocationRepository(deps());
    const loc = await aLocation(TENANT);

    expect(await repo.deleteById(OTHER_TENANT, loc.id)).toBeUndefined();
    expect(await Location.count()).toBe(1);

    const deleted = await repo.deleteById(TENANT, loc.id);
    expect(deleted!.name).toBe('Depot');
    expect(await Location.count()).toBe(0);
    expect(await repo.deleteById(TENANT, loc.id)).toBeUndefined();
  });

  it('updateById rejects a value exceeding the varchar limit', async () => {
    const repo = new DrizzleLocationRepository(deps());
    const loc = await aLocation(TENANT);

    await expect(repo.updateById(TENANT, loc.id, { name: 'x'.repeat(300) })).rejects.toThrow(
      /Failed query: update "Locations"/,
    );
    expect((await repo.findById(TENANT, loc.id))!.name).toBe('Depot');
  });
});

describe('DrizzleChargingStationRepository', () => {
  it('findById maps scalars, the ISO message timestamp and null coordinates', async () => {
    const repo = new DrizzleChargingStationRepository(deps());
    const station = await aStation(TENANT, {
      protocol: OCPPVersion.OCPP2_0_1,
      latestOcppMessageTimestamp: TS,
      chargePointVendor: 'ACME',
      chargePointModel: 'CP-9000',
    });

    const dto = await repo.findById(TENANT, station.id);

    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.isOnline).toBe(false);
    expect(dto!.protocol).toBe(OCPPVersion.OCPP2_0_1);
    expect(dto!.latestOcppMessageTimestamp).toBe(TS);
    expect(dto!.chargePointVendor).toBe('ACME');
    expect(dto!.chargePointModel).toBe('CP-9000');
    expect(dto!.coordinates).toBeNull();
    expect(dto!.evses).toBeUndefined();
    expect(dto!.tenantId).toBe(TENANT);
  });

  it('findById reads the PostGIS point written by the sequelize layer', async () => {
    const repo = new DrizzleChargingStationRepository(deps());
    const station = await aStation(TENANT, {
      coordinates: { type: 'Point', coordinates: BERLIN },
    });

    const dto = await repo.findById(TENANT, station.id);
    expect(dto!.coordinates).toEqual({ type: 'Point', coordinates: BERLIN });
  });

  it('findAll keeps same-named stations separated per tenant', async () => {
    const repo = new DrizzleChargingStationRepository(deps());
    const own = await aStation(TENANT);
    await aStation(OTHER_TENANT);

    const all = await repo.findAll(TENANT);
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(own.id);
    expect(all[0].tenantId).toBe(TENANT);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });

  it('updateById flips isOnline and stamps the latest message timestamp', async () => {
    const repo = new DrizzleChargingStationRepository(deps());
    const station = await aStation(TENANT);

    expect(await repo.updateById(OTHER_TENANT, station.id, { isOnline: true })).toBeUndefined();

    const updated = await repo.updateById(TENANT, station.id, {
      isOnline: true,
      latestOcppMessageTimestamp: new Date(TS2),
    });
    expect(updated!.isOnline).toBe(true);
    expect(updated!.latestOcppMessageTimestamp).toBe(TS2);
  });

  it('updateById rejects a duplicate connection name within the tenant', async () => {
    const repo = new DrizzleChargingStationRepository(deps());
    await aStation(TENANT);
    const other = await aStation(TENANT, { ocppConnectionName: 'CS-200' });

    await expect(
      repo.updateById(TENANT, other.id, { ocppConnectionName: STATION }),
    ).rejects.toThrow(/Failed query: update "ChargingStations"/);
    expect((await repo.findById(TENANT, other.id))!.ocppConnectionName).toBe('CS-200');
  });
});

describe('DrizzleEvseRepository', () => {
  it('findById maps the row including the stationId FK', async () => {
    const repo = new DrizzleEvseRepository(deps());
    const { station, evse } = await aCommissionedStation(TENANT);

    const dto = await repo.findById(TENANT, evse.id);

    expect(dto!.stationId).toBe(station.id);
    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.evseTypeId).toBe(1);
    expect(dto!.evseId).toBe('DE*ABC*E001');
    expect(dto!.physicalReference).toBeNull();
    expect(dto!.removed).toBeUndefined();
    expect(dto!.connectors).toBeUndefined();
    expect(dto!.tenantId).toBe(TENANT);
  });

  it('updateById marks the EVSE removed and is tenant-scoped', async () => {
    const repo = new DrizzleEvseRepository(deps());
    const { evse } = await aCommissionedStation(TENANT);

    expect(await repo.updateById(OTHER_TENANT, evse.id, { removed: true })).toBeUndefined();

    const updated = await repo.updateById(TENANT, evse.id, {
      removed: true,
      physicalReference: 'E1',
    });
    expect(updated!.removed).toBe(true);
    expect(updated!.physicalReference).toBe('E1');
  });

  it('updateById rejects a duplicate stationId/evseTypeId pair', async () => {
    const repo = new DrizzleEvseRepository(deps());
    const { station } = await aCommissionedStation(TENANT);
    const second = (await Evse.create({
      tenantId: TENANT,
      stationId: station.id,
      ocppConnectionName: STATION,
      evseTypeId: 2,
    } as any)) as unknown as { id: number };

    await expect(repo.updateById(TENANT, second.id, { evseTypeId: 1 })).rejects.toThrow(
      /Failed query: update "Evses"/,
    );
  });

  // The stationId lookup that used to be an Evse BeforeCreate hook now lives in
  // the repository, on the two write paths that create EVSEs.
  it('createOrUpdateEvse and autoCommissionEvseForOcpp16Connector resolve stationId', async () => {
    const repo = new DrizzleEvseRepository(deps());
    const station = await aStation(TENANT);

    const created = await repo.createOrUpdateEvse(TENANT, {
      tenantId: TENANT,
      ocppConnectionName: STATION,
      evseTypeId: 7,
    });
    expect(created.stationId).toBe(station.id);
    expect(created.evseTypeId).toBe(7);

    const { evseId } = await repo.autoCommissionEvseForOcpp16Connector(TENANT, STATION);
    expect((await repo.findById(TENANT, evseId))!.stationId).toBe(station.id);
  });

  it('createOrUpdateEvse leaves stationId null for an unknown connection name', async () => {
    const repo = new DrizzleEvseRepository(deps());
    await aStation(TENANT);

    const created = await repo.createOrUpdateEvse(TENANT, {
      tenantId: TENANT,
      ocppConnectionName: 'CS-UNKNOWN',
      evseTypeId: 1,
    });

    expect(created.stationId).toBeUndefined();
  });
});

describe('DrizzleEvseTypeRepository', () => {
  // Base CRUD keys on table.id, which for EvseTypes is the non-unique OCPP EVSE
  // id rather than the databaseId PK — the id-keyed methods stay untested here.
  it('findAll and countAll scope rows by tenant', async () => {
    const repo = new DrizzleEvseTypeRepository(deps());
    await EvseType.create({ tenantId: TENANT, id: 1, connectorId: null } as any);
    await EvseType.create({ tenantId: TENANT, id: 2, connectorId: null } as any);
    await EvseType.create({ tenantId: OTHER_TENANT, id: 1, connectorId: null } as any);

    const all = await repo.findAll(TENANT);
    expect(all).toHaveLength(2);
    expect(all.map((t) => t.id).sort()).toEqual([1, 2]);
    expect(all[0].databaseId).toBeDefined();
    expect(all[0].connectorId).toBeNull();
    expect(all.every((t) => t.tenantId === TENANT)).toBe(true);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });
});

describe('DrizzleConnectorRepository', () => {
  it('findById maps enums, maxima and the ISO timestamp', async () => {
    const repo = new DrizzleConnectorRepository(deps());
    const { station, typeA, evse } = await aCommissionedStation(TENANT);
    const connector = await aConnector(TENANT, evse.id, typeA.databaseId, 1, {
      type: 'IEC62196T2',
      format: 'Socket',
      powerType: 'AC3Phase',
      maximumAmperage: 32,
      maximumVoltage: 400,
      maximumPowerWatts: 22000,
      vendorId: 'ACME',
    });

    const dto = await repo.findById(TENANT, connector.id);

    expect(dto!.stationId).toBe(station.id);
    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.evseId).toBe(evse.id);
    expect(dto!.connectorId).toBe(1);
    expect(dto!.evseTypeConnectorId).toBe(typeA.databaseId);
    expect(dto!.status).toBe('Available');
    expect(dto!.errorCode).toBe('NoError');
    expect(dto!.type).toBe('IEC62196T2');
    expect(dto!.format).toBe('Socket');
    expect(dto!.powerType).toBe('AC3Phase');
    expect(dto!.maximumAmperage).toBe(32);
    expect(dto!.maximumVoltage).toBe(400);
    expect(dto!.maximumPowerWatts).toBe(22000);
    expect(dto!.timestamp).toBe(TS);
    expect(dto!.vendorId).toBe('ACME');
    expect(dto!.tariff).toBeUndefined();
  });

  it('updateById moves the connector to Faulted with an error code', async () => {
    const repo = new DrizzleConnectorRepository(deps());
    const { typeA, evse } = await aCommissionedStation(TENANT);
    const connector = await aConnector(TENANT, evse.id, typeA.databaseId, 1);

    const updated = await repo.updateById(TENANT, connector.id, {
      status: 'Faulted',
      errorCode: 'GroundFailure',
      info: 'ground fault',
      timestamp: new Date(TS2),
    });

    expect(updated!.status).toBe('Faulted');
    expect(updated!.errorCode).toBe('GroundFailure');
    expect(updated!.info).toBe('ground fault');
    expect(updated!.timestamp).toBe(TS2);

    const viaSequelize = await Connector.findByPk(connector.id);
    expect(viaSequelize!.status).toBe('Faulted');
  });

  it('deleteById is tenant-scoped and returns undefined on repeat', async () => {
    const repo = new DrizzleConnectorRepository(deps());
    const { typeA, evse } = await aCommissionedStation(TENANT);
    const connector = await aConnector(TENANT, evse.id, typeA.databaseId, 1);

    expect(await repo.deleteById(OTHER_TENANT, connector.id)).toBeUndefined();
    expect(await Connector.count()).toBe(1);

    const deleted = await repo.deleteById(TENANT, connector.id);
    expect(deleted!.connectorId).toBe(1);
    expect(await Connector.count()).toBe(0);
    expect(await repo.deleteById(TENANT, connector.id)).toBeUndefined();
  });

  it('updateById rejects a duplicate stationId/connectorId pair', async () => {
    const repo = new DrizzleConnectorRepository(deps());
    const { typeA, typeB, evse } = await aCommissionedStation(TENANT);
    await aConnector(TENANT, evse.id, typeA.databaseId, 1);
    const second = await aConnector(TENANT, evse.id, typeB.databaseId, 2);

    await expect(repo.updateById(TENANT, second.id, { connectorId: 1 })).rejects.toThrow(
      /Failed query: update "Connectors"/,
    );
  });
});

describe('DrizzleStatusNotificationRepository', () => {
  it('findById maps the OCPP payload fields', async () => {
    const repo = new DrizzleStatusNotificationRepository(deps());
    const station = await aStation(TENANT);
    const sn = (await StatusNotification.create({
      tenantId: TENANT,
      ocppConnectionName: STATION,
      timestamp: TS,
      connectorStatus: 'Available',
      evseId: 1,
      errorCode: 'NoError',
      vendorId: 'ACME',
    } as any)) as unknown as { id: number; stationId: number };

    const dto = await repo.findById(TENANT, sn.id);

    expect(dto!.ocppConnectionName).toBe(STATION);
    expect(dto!.timestamp).toBe(TS);
    expect(dto!.connectorStatus).toBe('Available');
    expect(dto!.evseId).toBe(1);
    // connectorId null maps to 0.
    expect(dto!.connectorId).toBe(0);
    expect(dto!.errorCode).toBe('NoError');
    expect(dto!.vendorId).toBe('ACME');
    expect(dto!.chargingStation).toBeUndefined();
    expect(sn.stationId).toBe(station.id);
  });

  it('findAll returns only the calling tenant rows', async () => {
    const repo = new DrizzleStatusNotificationRepository(deps());
    await StatusNotification.create({
      tenantId: TENANT,
      ocppConnectionName: STATION,
      connectorStatus: 'Available',
    } as any);
    await StatusNotification.create({
      tenantId: TENANT,
      ocppConnectionName: STATION,
      connectorStatus: 'Charging',
    } as any);
    await StatusNotification.create({
      tenantId: OTHER_TENANT,
      ocppConnectionName: STATION,
      connectorStatus: 'Faulted',
    } as any);

    const own = await repo.findAll(TENANT);
    expect(own).toHaveLength(2);
    expect(own.map((s) => s.connectorStatus).sort()).toEqual(['Available', 'Charging']);
    expect(await repo.countAll(OTHER_TENANT)).toBe(1);
  });

  it('updateById rejects clearing tenantId', async () => {
    const repo = new DrizzleStatusNotificationRepository(deps());
    const sn = (await StatusNotification.create({
      tenantId: TENANT,
      ocppConnectionName: STATION,
      connectorStatus: 'Available',
    } as any)) as unknown as { id: number };

    await expect(repo.updateById(TENANT, sn.id, { tenantId: null })).rejects.toThrow(
      /Failed query: update "StatusNotifications"/,
    );
    expect((await repo.findById(TENANT, sn.id))!.tenantId).toBe(TENANT);
  });
});

describe('DrizzleLatestStatusNotificationRepository', () => {
  async function aPointer(tenantId: number) {
    await aStation(tenantId);
    const sn = (await StatusNotification.create({
      tenantId,
      ocppConnectionName: STATION,
      connectorStatus: 'Available',
    } as any)) as unknown as { id: number };
    const lsn = (await LatestStatusNotification.create({
      tenantId,
      ocppConnectionName: STATION,
      statusNotificationId: sn.id,
    } as any)) as unknown as { id: number };
    return { sn, lsn };
  }

  it('findById maps the pointer row and is tenant-scoped', async () => {
    const repo = new DrizzleLatestStatusNotificationRepository(deps());
    const { sn, lsn } = await aPointer(TENANT);

    const dto = await repo.findById(TENANT, lsn.id);

    expect(dto!.ocppConnectionName).toBe(STATION);
    // The column is an integer FK in the DB; compare numerically.
    expect(Number(dto!.statusNotificationId)).toBe(sn.id);
    expect(dto!.statusNotification).toBeUndefined();
    expect(dto!.tenantId).toBe(TENANT);
    expect(await repo.findById(OTHER_TENANT, lsn.id)).toBeUndefined();
  });

  it('updateById repoints to a newer status notification', async () => {
    const repo = new DrizzleLatestStatusNotificationRepository(deps());
    const { lsn } = await aPointer(TENANT);
    const sn2 = (await StatusNotification.create({
      tenantId: TENANT,
      ocppConnectionName: STATION,
      connectorStatus: 'Charging',
    } as any)) as unknown as { id: number };

    const updated = await repo.updateById(TENANT, lsn.id, { statusNotificationId: sn2.id });
    expect(Number(updated!.statusNotificationId)).toBe(sn2.id);
  });

  it('updateById rejects an unknown stationId FK', async () => {
    const repo = new DrizzleLatestStatusNotificationRepository(deps());
    const { lsn } = await aPointer(TENANT);

    await expect(repo.updateById(TENANT, lsn.id, { stationId: 987654 })).rejects.toThrow(
      /Failed query: update "LatestStatusNotifications"/,
    );
  });
});

describe('location cluster row-to-DTO mappers', () => {
  const timestamps = {
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-02T00:00:00.000Z'),
  };

  it('toLocationDto substitutes defaults for nulls and wraps the point tuple', () => {
    const dto = toLocationDto({
      id: 7,
      name: null,
      address: null,
      city: null,
      postalCode: null,
      state: null,
      country: null,
      publishUpstream: null,
      timeZone: null,
      parkingType: 'ParkingLot',
      facilities: null,
      openingHours: null,
      coordinates: BERLIN,
      tenantId: TENANT,
      ...timestamps,
    } as LocationEntity);

    expect(dto.name).toBe('');
    expect(dto.country).toBe('');
    expect(dto.publishUpstream).toBe(true);
    expect(dto.timeZone).toBe('UTC');
    expect(dto.parkingType).toBe('ParkingLot');
    expect(dto.coordinates).toEqual({ type: 'Point', coordinates: BERLIN });
    expect(dto.chargingPool).toBeUndefined();
    expect(dto.tenant).toBeUndefined();
  });

  it('toChargingStationDto keeps null coordinates and converts the timestamp', () => {
    const dto = toChargingStationDto({
      id: 3,
      ocppConnectionName: null,
      isOnline: null,
      protocol: 'ocpp1.6',
      latestOcppMessageTimestamp: new Date(TS),
      chargePointVendor: 'ACME',
      chargePointModel: null,
      chargePointSerialNumber: null,
      chargeBoxSerialNumber: null,
      firmwareVersion: null,
      iccid: null,
      imsi: null,
      meterType: null,
      meterSerialNumber: null,
      coordinates: null,
      floorLevel: null,
      parkingRestrictions: null,
      capabilities: null,
      use16StatusNotification0: null,
      locationId: null,
      tenantId: TENANT,
      ...timestamps,
    } as ChargingStationEntity);

    expect(dto.ocppConnectionName).toBe('');
    expect(dto.isOnline).toBe(false);
    expect(dto.protocol).toBe('ocpp1.6');
    expect(dto.latestOcppMessageTimestamp).toBe(TS);
    expect(dto.coordinates).toBeNull();
    expect(dto.networkProfiles).toBeUndefined();
    expect(dto.locationId).toBeNull();
  });

  it('toEvseDto maps null FKs to undefined and null evseId to empty string', () => {
    const dto = toEvseDto({
      id: 5,
      stationId: null,
      ocppConnectionName: null,
      evseTypeId: null,
      evseId: null,
      physicalReference: null,
      removed: null,
      tenantId: TENANT,
      ...timestamps,
    } as EvseEntity);

    expect(dto.stationId).toBeUndefined();
    expect(dto.ocppConnectionName).toBe('');
    expect(dto.evseTypeId).toBeUndefined();
    expect(dto.evseId).toBe('');
    expect(dto.physicalReference).toBeNull();
    expect(dto.removed).toBeUndefined();
    expect(dto.connectors).toBeUndefined();
  });

  it('toEvseTypeDto defaults a null OCPP id to 0 and keeps connectorId null', () => {
    const dto = toEvseTypeDto({
      databaseId: 11,
      id: null,
      connectorId: null,
      tenantId: TENANT,
      ...timestamps,
    } as EvseTypeEntity);

    expect(dto.databaseId).toBe(11);
    expect(dto.id).toBe(0);
    expect(dto.connectorId).toBeNull();
    expect(dto.tenantId).toBe(TENANT);
  });

  it('toConnectorDto maps a null timestamp to empty string and drops tariffId', () => {
    const dto = toConnectorDto({
      id: 9,
      stationId: null,
      ocppConnectionName: STATION,
      evseId: 4,
      connectorId: 1,
      evseTypeConnectorId: 2,
      status: 'Available',
      type: 'IEC62196T2',
      format: 'Cable',
      errorCode: 'NoError',
      powerType: 'DC',
      maximumAmperage: null,
      maximumVoltage: null,
      maximumPowerWatts: null,
      timestamp: null,
      info: null,
      vendorId: null,
      vendorErrorCode: null,
      termsAndConditionsUrl: 'https://cpo.example/terms',
      tariffId: 42,
      tenantId: TENANT,
      ...timestamps,
    } as ConnectorEntity);

    expect(dto.stationId).toBeUndefined();
    expect(dto.status).toBe('Available');
    expect(dto.format).toBe('Cable');
    expect(dto.timestamp).toBe('');
    expect(dto.termsAndConditionsUrl).toBe('https://cpo.example/terms');
    expect('tariffId' in dto).toBe(false);
    expect(dto.tariff).toBeUndefined();
  });

  it('toStatusNotificationDto converts the timestamp and defaults connectorId to 0', () => {
    const dto = toStatusNotificationDto({
      id: 2,
      stationId: 8,
      ocppConnectionName: null,
      timestamp: new Date(TS),
      connectorStatus: 'Faulted',
      evseId: null,
      connectorId: null,
      errorCode: 'GroundFailure',
      info: null,
      vendorId: null,
      vendorErrorCode: null,
      tenantId: TENANT,
      ...timestamps,
    } as StatusNotificationEntity);

    expect(dto.ocppConnectionName).toBe('');
    expect(dto.timestamp).toBe(TS);
    expect(dto.connectorStatus).toBe('Faulted');
    expect(dto.evseId).toBeNull();
    expect(dto.connectorId).toBe(0);
    expect(dto.errorCode).toBe('GroundFailure');
    expect(dto.chargingStation).toBeUndefined();
  });

  it('toLatestStatusNotificationDto defaults a null pointer to empty string', () => {
    const dto = toLatestStatusNotificationDto({
      id: 6,
      stationId: 8,
      ocppConnectionName: STATION,
      statusNotificationId: null,
      tenantId: TENANT,
      ...timestamps,
    } as LatestStatusNotificationEntity);

    expect(dto.ocppConnectionName).toBe(STATION);
    expect(dto.statusNotificationId).toBe('');
    expect(dto.chargingStation).toBeUndefined();
    expect(dto.statusNotification).toBeUndefined();
    expect(dto.createdAt).toEqual(timestamps.createdAt);
  });
});
