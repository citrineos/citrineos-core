// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E parity: NotifyReport persists Components / Variables / VariableAttributes.
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

const STATION_ID = uniqueStationId('NOTIFYREPORT');
const COMPONENT_NAME = 'ChargingStation';
const VARIABLE_NAME = 'Available';

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[notify-report] target = ${TARGET}`);
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`NotifyReport persistence — target=${TARGET}`, () => {
  it('persists Components, Variables, and VariableAttributes for a single-entry NotifyReport', async () => {
    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

    try {
      const resp = await sendCall(ws, crypto.randomUUID(), 'NotifyReport', {
        requestId: 1,
        generatedAt: new Date().toISOString(),
        seqNo: 0,
        tbc: false,
        reportData: [
          {
            component: { name: COMPONENT_NAME },
            variable: { name: VARIABLE_NAME },
            variableAttribute: [{ type: 'Actual', value: 'true', mutability: 'ReadOnly' }],
            variableCharacteristics: { dataType: 'boolean' },
          },
        ],
      });
      expect(resp[0]).toBe(3);

      await new Promise((r) => setTimeout(r, 2_500));

      const components = await ctx.db.query<{ id: number }>(
        `SELECT id FROM "Components" WHERE "name" = $1 AND "tenantId" = 1`,
        [COMPONENT_NAME],
      );
      expect(components.rows.length).toBeGreaterThanOrEqual(1);

      const variables = await ctx.db.query<{ id: number }>(
        `SELECT id FROM "Variables" WHERE "name" = $1 AND "tenantId" = 1`,
        [VARIABLE_NAME],
      );
      expect(variables.rows.length).toBeGreaterThanOrEqual(1);

      const attrs = await ctx.db.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
           FROM "VariableAttributes"
          WHERE "stationId" = $1 AND "tenantId" = 1`,
        [STATION_ID],
      );
      expect(parseInt(attrs.rows[0].count, 10)).toBeGreaterThanOrEqual(1);
    } finally {
      ws.close();
    }
  }, 60_000);
});
