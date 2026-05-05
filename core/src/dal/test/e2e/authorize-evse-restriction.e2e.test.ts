// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: EvseRestrictionAuthorizer downgrades an Accepted token to
 * NotAtThisLocation when the request's stationId starts with one of the
 * authorization's `disallowedEvseIdPrefixes`.
 *
 * NestJS-only — legacy stores authorization restrictions in a different shape.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
} from './helpers/test-server.js';
import { connectOcpp, sendCall } from './helpers/ocpp-ws.js';

// Use a static stationId so the prefix-match assertion stays deterministic.
const STATION_ID = 'E2E-EVSE-RESTRICT-CP-001';
const ID_TOKEN = 'tok-restrict-001';

let ctx: TestServerHandle;

beforeAll(async () => {
  if (TARGET !== 'nestjs') return;
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
  const now = new Date().toISOString();
  await ctx.db.query(
    `INSERT INTO "Authorizations" ("idToken", "idTokenType", "status", "disallowedEvseIdPrefixes", "tenantId", "createdAt", "updatedAt")
     VALUES ($1, 'Central', 'Accepted', $2, 1, $3, $3)
     ON CONFLICT DO NOTHING`,
    [ID_TOKEN, 'E2E-EVSE-RESTRICT', now],
  );
}, 180_000);

afterAll(async () => {
  if (TARGET !== 'nestjs') return;
  await ctx?.shutdown();
});

describe(`Authorize EvseRestriction — target=${TARGET}`, () => {
  it.skipIf(TARGET !== 'nestjs')(
    'downgrades an Accepted token to NotAtThisLocation when stationId matches a disallowed prefix',
    async () => {
      const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

      try {
        const resp = await sendCall(ws, crypto.randomUUID(), 'Authorize', {
          idToken: { idToken: ID_TOKEN, type: 'Central' },
        });
        expect(resp[0]).toBe(3);
        const body = resp[2] as { idTokenInfo?: { status?: string } };
        expect(body.idTokenInfo?.status).toBe('NotAtThisLocation');
      } finally {
        ws.close();
      }
    },
    60_000,
  );
});
