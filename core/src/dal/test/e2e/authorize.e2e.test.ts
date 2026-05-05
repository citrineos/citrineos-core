// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: Authorize (OCPP 2.0.1) — basic happy/sad paths
 *
 * Seeds rows in `Authorizations` with `status` ∈ {Accepted, Blocked} for known
 * idTokens, then drives Authorize calls and asserts the returned `idTokenInfo`
 * matches.
 *
 * Covers the parity baseline:
 *   - status=Accepted in DB → response status=Accepted
 *   - status=Blocked in DB → response status=Blocked
 *   - idToken not in DB → response status=Unknown
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
  uniqueStationId,
} from './helpers/test-server.js';
import { connectOcpp, sendCall } from './helpers/ocpp-ws.js';

const STATION_ID = uniqueStationId('AUTH');
const ACCEPTED_TOKEN = 'tok-accepted-001';
const BLOCKED_TOKEN = 'tok-blocked-002';
const UNKNOWN_TOKEN = 'tok-unknown-003';

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[authorize] target = ${TARGET}`);
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);

  // Seed Authorization rows. Both targets use the column name `status` after
  // legacy 20250621-flatten + nestjs 0006_authorizations_status_rename.
  const now = new Date().toISOString();
  await ctx.db.query(
    `INSERT INTO "Authorizations" ("idToken", "idTokenType", "status", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, 'Central', 'Accepted', 1, $3, $3),
            ($2, 'Central', 'Blocked', 1, $3, $3)`,
    [ACCEPTED_TOKEN, BLOCKED_TOKEN, now],
  );
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`Authorize — target=${TARGET}`, () => {
  it.each([
    { label: 'Accepted', token: ACCEPTED_TOKEN, expected: 'Accepted' },
    { label: 'Blocked', token: BLOCKED_TOKEN, expected: 'Blocked' },
    { label: 'Unknown', token: UNKNOWN_TOKEN, expected: 'Unknown' },
  ])(
    'idToken $label → idTokenInfo.status=$expected',
    async ({ token, expected }) => {
      const msgId = crypto.randomUUID();
      const payload = { idToken: { idToken: token, type: 'Central' } };

      const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

      try {
        const response = await sendCall(ws, msgId, 'Authorize', payload);
        expect(response[0]).toBe(3);
        expect(response[1]).toBe(msgId);
        const body = response[2] as { idTokenInfo: { status: string } };
        expect(body.idTokenInfo).toBeDefined();
        expect(body.idTokenInfo.status).toBe(expected);
      } finally {
        ws.close();
      }
    },
    30_000,
  );
});
