// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: SecurityEventNotification over OCPP WebSocket
 *
 * The test verifies the full path:
 *   charger (WS OCPP 2.0.1) → CSMS → Reporting module → SecurityEvents table
 *
 * It runs twice — once with the default Sequelize repository and once with
 * CITRINEOS_USE_DRIZZLE_SECURITY_EVENT=true — confirming both write the same record.
 *
 * Prerequisites: run `pnpm run test:e2e` (which builds first) rather than
 * `pnpm test`, since the server child process needs ocpp-server/dist/index.js to be
 * current and sequelize-cli needs dist/migrations/*.
 *
 * Why no manual Tenant seed?
 *   The migration 20250430110000-create-default-tenant inserts Tenant id=1
 *   automatically, so we rely on the real migration path here.
 */

import { type ChildProcess } from 'child_process';

import { Client } from 'pg';
import { type StartedTestContainer } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aSecurityEventNotificationRequest } from '../providers/SecurityEvent.js';
import { DEFAULT_PG_PORT, getDefaultPgClientConfig } from '../utils/containers/pgContainer';
import { buildTestEnv, setup } from '../utils/containers/setup';
import { connectOcpp, sendCall } from '../utils/containers/ocppWebsocket';
import { killServer, spawnServer } from '../utils/containers/server';

// ─── Shared state across all scenarios ────────────────────────────────────────

let containers: StartedTestContainer[];
let mappedPgPort: number;

// ─── Shared lifecycle: containers + migrations ────────────────────────────────

beforeAll(async () => {
  containers = await setup();
  mappedPgPort = containers[0].getMappedPort(DEFAULT_PG_PORT);
}, 120_000);

afterAll(async () => {
  await Promise.allSettled(containers.map((c) => c.stop()));
});

// ─── Test scenarios ───────────────────────────────────────────────────────────

describe.each([
  { label: 'Sequelize', extraEnv: {} },
  {
    label: 'Drizzle',
    extraEnv: { CITRINEOS_USE_DRIZZLE_SECURITY_EVENT: 'true' } as Record<string, string>,
  },
])('SecurityEventNotification [$label]', ({ label, extraEnv }) => {
  let server: ChildProcess;
  let db: Client;

  // Unique stationId per scenario so rows from each run don't collide.
  const stationId = `E2E-CP-${label.toUpperCase()}`;

  beforeAll(async () => {
    console.log(`Starting server for scenario "${label}"...`);
    server = await spawnServer(buildTestEnv(mappedPgPort, extraEnv), label);

    // Open a direct pg connection for the DB assertion step.
    db = new Client(getDefaultPgClientConfig(mappedPgPort));
    await db.connect();
  }, 60_000);

  afterAll(async () => {
    await db?.end();
    if (server) await killServer(server);
  }, 30_000);

  it('acknowledges and persists both listed and unlisted security event types', async () => {
    const ws = await connectOcpp(stationId);

    try {
      const msgId = crypto.randomUUID();
      const payload = aSecurityEventNotificationRequest({ type: 'SecurityLogWasCleared' });

      // OCPP 2.0.1 Call:   [2, uniqueId, action, payload]
      // OCPP 2.0.1 Result: [3, uniqueId, payload]
      const response = await sendCall(ws, msgId, 'SecurityEventNotification', payload);

      console.log(`[${label}] OCPP response:`, response);
      expect(response[0]).toBe(3);
      expect(response[1]).toBe(msgId);
      expect(response[2]).toEqual({});

      const { rows } = await db.query<{ ocppConnectionName: string; type: string }>(
        `SELECT "ocppConnectionName", "type"
           FROM "SecurityEvents"
          WHERE "ocppConnectionName" = $1
          ORDER BY id DESC
          LIMIT 1`,
        [stationId],
      );

      expect(rows).toHaveLength(1);
      expect(rows[0].ocppConnectionName).toBe(stationId);
      expect(rows[0].type).toBe(payload.type);

      const unlistedMsgId = crypto.randomUUID();
      const unlistedPayload = aSecurityEventNotificationRequest({
        type: 'InvalidCentralSystemCertificate',
      });

      const unlistedResponse = await sendCall(
        ws,
        unlistedMsgId,
        'SecurityEventNotification',
        unlistedPayload,
      );

      console.log(`[${label}] OCPP response (unlisted type):`, unlistedResponse);
      expect(unlistedResponse[0]).toBe(3);
      expect(unlistedResponse[1]).toBe(unlistedMsgId);
      expect(unlistedResponse[2]).toEqual({});

      const { rows: unlistedRows } = await db.query<{ type: string }>(
        `SELECT "type"
           FROM "SecurityEvents"
          WHERE "ocppConnectionName" = $1
          ORDER BY id DESC
          LIMIT 1`,
        [stationId],
      );

      expect(unlistedRows[0].type).toBe(unlistedPayload.type);
    } finally {
      ws.close();
    }
  }, 30_000);
});
