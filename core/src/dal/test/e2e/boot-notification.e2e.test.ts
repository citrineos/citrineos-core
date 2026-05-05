// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: BootNotification (OCPP 2.0.1) — Accepted happy path
 *
 * Spawns the target server (old or NestJS), connects an unknown charger over
 * SP0 WebSocket, sends BootNotification with full chargingStation metadata,
 * and verifies:
 *   • Response shape: { status: 'Accepted', interval: 60, currentTime: <ISO> }
 *   • DB side effects: ChargingStations row populated with vendor/model/serial,
 *     Boots row created with status=Accepted and lastBootTime set.
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

const STATION_ID = uniqueStationId('BOOT');

let ctx: TestServerHandle;

beforeAll(async () => {
  console.log(`[boot-notification] target = ${TARGET}`);
  ctx = await startTestServer();
  // Pre-seed ChargingStation row to satisfy the legacy populate_station_pk_id()
  // trigger on OCPPMessages. The NestJS server is happy without it.
  await seedChargingStation(ctx.db, STATION_ID);
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`BootNotification — target=${TARGET}`, () => {
  it('returns Accepted with heartbeatInterval and persists ChargingStation + Boot', async () => {
    const msgId = crypto.randomUUID();
    const payload = {
      reason: 'PowerUp',
      chargingStation: {
        model: 'TestModel-X1',
        vendorName: 'AcmeCharge',
        serialNumber: 'SN-001-XYZ',
        firmwareVersion: '1.2.3',
        modem: { iccid: '8901234567890123456', imsi: '310150123456789' },
      },
    };

    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);

    try {
      const response = await sendCall(ws, msgId, 'BootNotification', payload);

      // OCPP envelope
      expect(response[0]).toBe(3);
      expect(response[1]).toBe(msgId);

      const body = response[2] as {
        status: string;
        interval: number;
        currentTime: string;
      };
      expect(body.status).toBe('Accepted');
      expect(body.interval).toBe(60);
      const t = Date.parse(body.currentTime);
      expect(Number.isNaN(t)).toBe(false);
      expect(Math.abs(Date.now() - t)).toBeLessThan(15_000);

      await new Promise((r) => setTimeout(r, 1_500));

      const station = await ctx.db.query<{
        chargePointVendor: string | null;
        chargePointModel: string | null;
        chargePointSerialNumber: string | null;
        firmwareVersion: string | null;
        iccid: string | null;
        imsi: string | null;
      }>(
        `SELECT "chargePointVendor", "chargePointModel", "chargePointSerialNumber",
                "firmwareVersion", "iccid", "imsi"
           FROM "ChargingStations"
          WHERE "id" = $1`,
        [STATION_ID],
      );
      expect(station.rows).toHaveLength(1);
      expect(station.rows[0].chargePointVendor).toBe('AcmeCharge');
      expect(station.rows[0].chargePointModel).toBe('TestModel-X1');
      expect(station.rows[0].chargePointSerialNumber).toBe('SN-001-XYZ');
      expect(station.rows[0].firmwareVersion).toBe('1.2.3');
      expect(station.rows[0].iccid).toBe('8901234567890123456');
      expect(station.rows[0].imsi).toBe('310150123456789');

      // Legacy Boots uses `id` as the stationId (primary key); NestJS Boots
      // has a separate `stationId` column with a serial id. Query whichever
      // column exists in this schema.
      const colsResult = await ctx.db.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'Boots' AND column_name IN ('stationId', 'id')`,
      );
      const cols = colsResult.rows.map((r) => r.column_name);
      const lookupCol = cols.includes('stationId') ? 'stationId' : 'id';
      const orderClause = cols.includes('stationId') ? 'ORDER BY id DESC' : '';

      const boot = await ctx.db.query<{ status: string; lastBootTime: Date | null }>(
        `SELECT "status", "lastBootTime"
           FROM "Boots"
          WHERE "${lookupCol}" = $1
          ${orderClause}
          LIMIT 1`,
        [STATION_ID],
      );
      expect(boot.rows).toHaveLength(1);
      expect(boot.rows[0].status).toBe('Accepted');
      expect(boot.rows[0].lastBootTime).not.toBeNull();
    } finally {
      ws.close();
    }
  }, 30_000);
});
