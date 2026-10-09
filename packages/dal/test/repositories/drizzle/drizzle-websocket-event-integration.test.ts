// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { MessageOrigin, type WebsocketEventDto } from '@citrineos/types';
import { ChargingStation, WebsocketEvent } from '@dal/db/sequelize/index.js';
import {
  DrizzleWebsocketEventRepository,
  toWebsocketEventDto,
} from '@dal/repositories/drizzle/websocket-event.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'cp001';
const TS = '2026-10-05T12:00:00.000Z';

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
  // Stopping the container terminates idle connections (Postgres 57P01); unhandled, pg escalates
  // the pool 'error' to an uncaught exception.
  drizzlePool.on('error', () => {});
  db = drizzle(drizzlePool);
}, 90_000);

afterAll(async () => {
  await drizzlePool?.end();
  await h?.stop();
}, 90_000);

beforeEach(async () => {
  await resetDb(h);
});

const makeRepo = () =>
  new DrizzleWebsocketEventRepository({ config: h.config, drizzleInstance: db });

async function aStation(tenantId: number): Promise<number> {
  const station = await ChargingStation.create({
    ocppConnectionName: STATION,
    isOnline: false,
    tenantId,
  });
  return station.id;
}

const aRejection = {
  serverId: 'ws-0',
  host: 'pod-a',
  remoteAddress: '10.0.0.7',
  uri: `/${STATION}`,
  type: 'ConnectionRejected' as const,
  timestamp: TS,
  subprotocol: 'ocpp2.0.1',
  sentCode: 1011,
  closeReason: 'Unknown charging station',
  initiator: MessageOrigin.ChargingStationManagementSystem,
  source: 'unknown_station',
  details: { attempt: 1 },
};

describe('toWebsocketEventDto', () => {
  it('converts the timestamp to ISO and keeps null columns null', () => {
    const createdAt = new Date('2026-10-05T12:00:01.000Z');
    const dto = toWebsocketEventDto({
      id: 1,
      stationId: null,
      serverId: 'ws-0',
      host: 'pod-a',
      remoteAddress: null,
      uri: null,
      type: 'Open',
      timestamp: new Date(TS),
      subprotocol: null,
      httpStatus: null,
      wsCloseCode: null,
      sentCode: null,
      closeReason: null,
      initiator: null,
      source: null,
      details: null,
      tenantId: TENANT_A,
      createdAt,
      updatedAt: createdAt,
    });

    expect(dto.timestamp).toBe(TS);
    expect(dto.stationId).toBeNull();
    expect(dto.initiator).toBeNull();
  });
});

describe('DrizzleWebsocketEventRepository', () => {
  it('persists every field, links the station and emits created', async () => {
    const stationId = await aStation(TENANT_A);
    const repo = makeRepo();
    const created: WebsocketEventDto[] = [];
    repo.on('created', (dtos: WebsocketEventDto[]) => created.push(...dtos));

    const dto = await repo.createWebsocketEvent(TENANT_A, STATION, aRejection);

    expect(dto).toMatchObject({ ...aRejection, stationId, tenantId: TENANT_A });
    expect(created).toEqual([dto]);
    expect((await WebsocketEvent.findByPk(dto.id))?.toJSON()).toMatchObject({
      ...aRejection,
      stationId,
    });
  });

  it('leaves stationId null when the name belongs to a station in another tenant', async () => {
    await aStation(TENANT_B);

    const dto = await makeRepo().createWebsocketEvent(TENANT_A, STATION, aRejection);

    expect(dto.stationId).toBeNull();
  });

  it('stores an event with no station name and only the required fields', async () => {
    const dto = await makeRepo().createWebsocketEvent(TENANT_A, undefined, {
      serverId: 'wss-0',
      host: 'pod-a',
      type: 'UpgradeRejected',
      timestamp: TS,
    });

    expect(dto).toMatchObject({
      stationId: null,
      uri: null,
      httpStatus: null,
      details: null,
      type: 'UpgradeRejected',
    });
  });
});
