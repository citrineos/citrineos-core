// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { MessageOrigin, type SystemConfig } from '@citrineos/types';
import { ChargingStation, WebsocketEvent } from '@dal/db/sequelize/index.js';
import { SequelizeWebsocketEventRepository } from '../../../index.js';
import { type PgHarness, resetDb, startPgHarness } from '../../utils/pg-harness.js';

// SequelizeWebsocketEventRepository appends one row per websocket lifecycle event, linking it to
// the station when the event names one this tenant knows.

const TENANT_A = 1;
const TENANT_B = 2;
const STATION = 'cp001';
const TS = '2026-10-05T12:00:00.000Z';

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

function makeRepo(): SequelizeWebsocketEventRepository {
  return new SequelizeWebsocketEventRepository({
    config: {} as SystemConfig,
    sequelizeInstance: h.sequelizeInstance,
  });
}

async function aStation(tenantId: number, ocppConnectionName = STATION): Promise<number> {
  const station = await ChargingStation.create({ ocppConnectionName, isOnline: false, tenantId });
  return station.id;
}

const aCloseEvent = {
  serverId: 'ws-0',
  host: 'pod-a',
  remoteAddress: '10.0.0.7',
  uri: `/${STATION}`,
  type: 'Close' as const,
  timestamp: TS,
  subprotocol: 'ocpp2.0.1',
  wsCloseCode: 1000,
  sentCode: 1001,
  closeReason: 'Server shutting down',
  initiator: MessageOrigin.ChargingStationManagementSystem,
  source: 'server_shutdown',
  details: { connectedMs: 1200 },
};

describe('SequelizeWebsocketEventRepository', () => {
  it('persists every field and links the station named in the tenant', async () => {
    const stationId = await aStation(TENANT_A);

    const created = await makeRepo().createWebsocketEvent(TENANT_A, STATION, aCloseEvent);

    const row = await WebsocketEvent.findByPk(created.id);
    expect(row?.toJSON()).toMatchObject({
      ...aCloseEvent,
      stationId,
      tenantId: TENANT_A,
    });
  });

  it('leaves stationId null when no station by that name exists in the tenant', async () => {
    await aStation(TENANT_B);

    const created = await makeRepo().createWebsocketEvent(TENANT_A, STATION, aCloseEvent);

    expect(created.stationId).toBeNull();
    expect(created.tenantId).toBe(TENANT_A);
  });

  it('stores an event with no station name and only the required fields', async () => {
    const created = await makeRepo().createWebsocketEvent(TENANT_A, undefined, {
      serverId: 'wss-0',
      host: 'pod-a',
      type: 'UpgradeRejected',
      timestamp: TS,
    });

    const row = await WebsocketEvent.findByPk(created.id);
    expect(row?.stationId).toBeNull();
    expect(row?.uri).toBeNull();
    expect(row?.type).toBe('UpgradeRejected');
  });

  it('keeps a client-supplied address longer than a varchar(255) intact', async () => {
    const remoteAddress = 'x'.repeat(1000);

    const created = await makeRepo().createWebsocketEvent(TENANT_A, undefined, {
      ...aCloseEvent,
      remoteAddress,
    });

    expect((await WebsocketEvent.findByPk(created.id))?.remoteAddress).toBe(remoteAddress);
  });

  it('keeps the event and clears its stationId when the station is deleted', async () => {
    const stationId = await aStation(TENANT_A);
    const created = await makeRepo().createWebsocketEvent(TENANT_A, STATION, aCloseEvent);

    await ChargingStation.destroy({ where: { id: stationId } });

    const row = await WebsocketEvent.findByPk(created.id);
    expect(row).not.toBeNull();
    expect(row?.stationId).toBeNull();
  });
});
