// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: OCPP 1.6 priority handlers — Boot, Heartbeat, Authorize,
 * StartTransaction, StopTransaction, StatusNotification (1.6).
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
  uniqueStationId,
} from './helpers/test-server.js';
import { connectOcpp16 } from './helpers/ocpp-ws.js';

const STATION_ID = uniqueStationId('CP16');
const ID_TAG = 'tag-16-001';

let ctx: TestServerHandle;
let ws: WebSocket;

function call(action: string, payload: object): Promise<unknown[]> {
  const msgId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`No OCPP response for ${action} within 10s`)),
      10_000,
    );
    const onMessage = (data: WebSocket.RawData): void => {
      try {
        const frame = JSON.parse(data.toString()) as unknown[];
        if (Array.isArray(frame) && frame[1] === msgId) {
          clearTimeout(timeout);
          ws.off('message', onMessage);
          resolve(frame);
        }
      } catch (e) {
        clearTimeout(timeout);
        ws.off('message', onMessage);
        reject(e);
      }
    };
    ws.on('message', onMessage);
    ws.send(JSON.stringify([2, msgId, action, payload]));
  });
}

beforeAll(async () => {
  console.log(`[ocpp16-handlers] target = ${TARGET}`);
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
  const now = new Date().toISOString();
  await ctx.db.query(
    `INSERT INTO "Authorizations" ("idToken", "idTokenType", "status", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, 'Central', 'Accepted', 1, $2, $2) ON CONFLICT DO NOTHING`,
    [ID_TAG, now],
  );
  ws = await connectOcpp16(ctx.wsUrl, STATION_ID);
}, 180_000);

afterAll(async () => {
  ws?.close();
  await ctx?.shutdown();
});

describe(`OCPP 1.6 BootNotification — target=${TARGET}`, () => {
  it('returns Accepted with currentTime + interval', async () => {
    const resp = await call('BootNotification', {
      chargePointModel: 'M-16',
      chargePointVendor: 'V-16',
      firmwareVersion: '1.0.0',
    });
    expect(resp[0]).toBe(3);
    const body = resp[2] as { status: string; currentTime: string; interval: number };
    expect(body.status).toBe('Accepted');
    expect(typeof body.interval).toBe('number');
    expect(typeof body.currentTime).toBe('string');
  }, 15_000);
});

describe(`OCPP 1.6 Heartbeat — target=${TARGET}`, () => {
  it('returns currentTime', async () => {
    const resp = await call('Heartbeat', {});
    expect(resp[0]).toBe(3);
    const body = resp[2] as { currentTime: string };
    expect(typeof body.currentTime).toBe('string');
    expect(Number.isNaN(Date.parse(body.currentTime))).toBe(false);
  }, 15_000);
});

describe(`OCPP 1.6 Authorize — target=${TARGET}`, () => {
  it('returns idTagInfo.status=Accepted for a known idTag', async () => {
    const resp = await call('Authorize', { idTag: ID_TAG });
    expect(resp[0]).toBe(3);
    const body = resp[2] as { idTagInfo: { status: string } };
    expect(body.idTagInfo).toBeDefined();
    expect(body.idTagInfo.status).toBe('Accepted');
  }, 15_000);
});

describe(`OCPP 1.6 StatusNotification — target=${TARGET}`, () => {
  it('accepts a status update and returns empty body', async () => {
    const resp = await call('StatusNotification', {
      connectorId: 1,
      errorCode: 'NoError',
      status: 'Available',
      timestamp: new Date().toISOString(),
    });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});
