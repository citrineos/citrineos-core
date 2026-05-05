// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: OCPP BasicAuth (SecurityProfile 1) WebSocket handshake.
 *
 * Both targets expose a BasicAuth WebSocket on port 8082. Credentials are
 * verified against the DeviceModel (VariableAttributes table:
 * SecurityCtrlr / BasicAuthPassword / Actual) using the same PBKDF2 hash
 * format, so the seed SQL is target-agnostic.
 *
 * Tests:
 *   - Correct credentials  → WS handshake succeeds
 *   - Wrong password       → HTTP 401 upgrade rejection
 *   - No auth header       → HTTP 401 upgrade rejection
 *   - Username ≠ stationId → HTTP 401 upgrade rejection
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { pbkdf2Sync, randomBytes } from 'crypto';
import WebSocket from 'ws';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
  uniqueStationId,
} from './helpers/test-server.js';

const STATION_ID = uniqueStationId('AUTH');
const CORRECT_PASSWORD = 'SuperSecret123!';

let ctx: TestServerHandle;

function pbkdf2Hash(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `PBKDF2:1000:64:sha512:${salt}:${hash}`;
}

function connectWithAuth(stationId: string, authHeader?: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const opts: WebSocket.ClientOptions = {};
    if (authHeader) opts.headers = { Authorization: authHeader };
    const ws = new WebSocket(`${ctx.basicAuthWsUrl!}/${stationId}`, ['ocpp2.0.1'], opts);
    ws.once('open', () => resolve(ws));
    ws.once('error', reject);
  });
}

function basicAuthHeader(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

beforeAll(async () => {
  console.log(`[basic-auth] target = ${TARGET}`);
  ctx = await startTestServer({ includeBasicAuth: true });
  await seedChargingStation(ctx.db, STATION_ID);

  const now = new Date().toISOString();

  // Component: SecurityCtrlr
  const compResult = await ctx.db.query(
    `INSERT INTO "Components" (name, "tenantId", "createdAt", "updatedAt")
     VALUES ('SecurityCtrlr', 1, $1, $2)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [now, now],
  );
  const componentId: number =
    compResult.rows[0]?.id ??
    (
      await ctx.db.query(
        `SELECT id FROM "Components" WHERE name = 'SecurityCtrlr' AND "tenantId" = 1`,
      )
    ).rows[0].id;

  // Variable: BasicAuthPassword
  const varResult = await ctx.db.query(
    `INSERT INTO "Variables" (name, "tenantId", "createdAt", "updatedAt")
     VALUES ('BasicAuthPassword', 1, $1, $2)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [now, now],
  );
  const variableId: number =
    varResult.rows[0]?.id ??
    (
      await ctx.db.query(
        `SELECT id FROM "Variables" WHERE name = 'BasicAuthPassword' AND "tenantId" = 1`,
      )
    ).rows[0].id;

  // VariableAttribute: stationId → PBKDF2 hashed password
  await ctx.db.query(
    `INSERT INTO "VariableAttributes"
       ("stationId", type, "dataType", value, "componentId", "variableId", "tenantId", "generatedAt", "createdAt", "updatedAt")
     VALUES ($1, 'Actual', 'passwordString', $2, $3, $4, 1, NOW(), $5, $6)
     ON CONFLICT DO NOTHING`,
    [STATION_ID, pbkdf2Hash(CORRECT_PASSWORD), componentId, variableId, now, now],
  );
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`OCPP BasicAuth (securityProfile 1) — target=${TARGET}`, () => {
  it('accepts a WebSocket connection with correct credentials', async () => {
    const ws = await connectWithAuth(STATION_ID, basicAuthHeader(STATION_ID, CORRECT_PASSWORD));
    expect(ws.readyState).toBe(WebSocket.OPEN);
    ws.close();
  }, 15_000);

  it('rejects a connection with no Authorization header', async () => {
    await expect(connectWithAuth(STATION_ID)).rejects.toThrow();
  }, 15_000);

  it('rejects a connection with a wrong password', async () => {
    await expect(
      connectWithAuth(STATION_ID, basicAuthHeader(STATION_ID, 'wrongpassword')),
    ).rejects.toThrow();
  }, 15_000);

  it('rejects a connection where username does not match stationId in URL', async () => {
    await expect(
      connectWithAuth(STATION_ID, basicAuthHeader('another-station', CORRECT_PASSWORD)),
    ).rejects.toThrow();
  }, 15_000);
});
