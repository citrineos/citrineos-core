// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: SecurityEventNotification over OCPP WebSocket.
 *
 * Charger sends SecurityEventNotification → CSMS persists it in
 * `SecurityEvents`. Under TARGET=old we exercise both the legacy Sequelize
 * and Drizzle-feature-flagged repos. Under TARGET=nestjs there's only the
 * Drizzle implementation.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aSecurityEventNotificationRequest } from '../providers/SecurityEvent.js';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
} from './helpers/test-server.js';
import { connectOcpp, sendCall } from './helpers/ocpp-ws.js';

interface Scenario {
  label: string;
  extraEnv: Record<string, string>;
  stationId: string;
}

const SCENARIOS: Scenario[] =
  TARGET === 'old'
    ? [
        { label: 'Sequelize', extraEnv: {}, stationId: 'E2E-CP-SEQUELIZE' },
        {
          label: 'Drizzle',
          extraEnv: { CITRINEOS_USE_DRIZZLE_SECURITY_EVENT: 'true' },
          stationId: 'E2E-CP-DRIZZLE',
        },
      ]
    : [{ label: 'NestJS-Drizzle', extraEnv: {}, stationId: 'E2E-CP-NESTJS' }];

describe.each(SCENARIOS)(
  `SecurityEventNotification [target=${TARGET}, $label]`,
  ({ extraEnv, stationId }) => {
    let ctx: TestServerHandle;

    beforeAll(async () => {
      ctx = await startTestServer({ extraEnv });
      await seedChargingStation(ctx.db, stationId);
    }, 180_000);

    afterAll(async () => {
      await ctx?.shutdown();
    });

    it('returns a CallResult and persists the SecurityEvent record', async () => {
      const msgId = crypto.randomUUID();
      const payload = aSecurityEventNotificationRequest({ type: 'SecurityLogWasCleared' });

      const ws = await connectOcpp(ctx.wsUrl, stationId);

      try {
        const response = await sendCall(ws, msgId, 'SecurityEventNotification', payload);

        expect(response[0]).toBe(3);
        expect(response[1]).toBe(msgId);
        expect(response[2]).toEqual({});

        const { rows } = await ctx.db.query<{ stationId: string; type: string }>(
          `SELECT "stationId", "type"
             FROM "SecurityEvents"
            WHERE "stationId" = $1
            ORDER BY id DESC
            LIMIT 1`,
          [stationId],
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].stationId).toBe(stationId);
        expect(rows[0].type).toBe(payload.type);
      } finally {
        ws.close();
      }
    }, 30_000);
  },
);
