// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * E2E test: A batch of charger-initiated 2.0.1 handlers that all share one
 * harness instance + one persistent WebSocket. Each describe block exercises
 * one OCPP action.
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
import { connectOcpp } from './helpers/ocpp-ws.js';

const STATION_ID = uniqueStationId('MISC');

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
  console.log(`[charger-handlers] target = ${TARGET}`);
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
  ws = await connectOcpp(ctx.wsUrl, STATION_ID);
}, 180_000);

afterAll(async () => {
  ws?.close();
  await ctx?.shutdown();
});

describe(`Heartbeat — target=${TARGET}`, () => {
  it('responds with currentTime', async () => {
    const resp = await call('Heartbeat', {});
    expect(resp[0]).toBe(3);
    const body = resp[2] as { currentTime?: string };
    expect(body.currentTime).toBeTruthy();
    const t = Date.parse(body.currentTime as string);
    expect(Number.isNaN(t)).toBe(false);
    expect(Math.abs(Date.now() - t)).toBeLessThan(15_000);
  }, 15_000);
});

describe(`DataTransfer — target=${TARGET}`, () => {
  it('responds with a status', async () => {
    const resp = await call('DataTransfer', {
      vendorId: 'org.test.example',
      messageId: 'ping',
      data: { hello: 'world' },
    });
    expect(resp[0]).toBe(3);
    const body = resp[2] as { status?: string };
    expect(typeof body.status).toBe('string');
    expect(['Accepted', 'Rejected', 'UnknownMessageId', 'UnknownVendorId']).toContain(body.status);
  }, 15_000);
});

describe(`MeterValues — target=${TARGET}`, () => {
  it('accepts a sample and returns empty body', async () => {
    const resp = await call('MeterValues', {
      evseId: 1,
      meterValue: [
        {
          timestamp: new Date().toISOString(),
          sampledValue: [{ value: 0, measurand: 'Energy.Active.Import.Register' }],
        },
      ],
    });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`NotifyEvent — target=${TARGET}`, () => {
  it('accepts an event report and returns empty body', async () => {
    const resp = await call('NotifyEvent', {
      generatedAt: new Date().toISOString(),
      seqNo: 0,
      eventData: [
        {
          eventId: 1,
          timestamp: new Date().toISOString(),
          trigger: 'Alerting',
          actualValue: 'fired',
          eventNotificationType: 'HardWiredNotification',
          component: { name: 'TestComponent' },
          variable: { name: 'TestVariable' },
        },
      ],
    });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`NotifyReport — target=${TARGET}`, () => {
  it('accepts a report and returns empty body', async () => {
    const resp = await call('NotifyReport', {
      requestId: 0,
      generatedAt: new Date().toISOString(),
      seqNo: 0,
      reportData: [
        {
          component: { name: 'OCPPCommCtrlr' },
          variable: { name: 'HeartbeatInterval' },
          variableAttribute: [{ value: '60' }],
        },
      ],
    });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`LogStatusNotification — target=${TARGET}`, () => {
  it('accepts a status update and returns empty body', async () => {
    const resp = await call('LogStatusNotification', { status: 'Idle' });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`FirmwareStatusNotification — target=${TARGET}`, () => {
  it('accepts a firmware status update and returns empty body', async () => {
    const resp = await call('FirmwareStatusNotification', { status: 'Idle' });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`DiagnosticsStatusNotification — target=${TARGET}`, () => {
  it('accepts a status update and returns empty body', async () => {
    const resp = await call('DiagnosticsStatusNotification', { status: 'Idle' });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`NotifyMonitoringReport — target=${TARGET}`, () => {
  it('accepts a monitoring report and returns empty body', async () => {
    const resp = await call('NotifyMonitoringReport', {
      requestId: 0,
      seqNo: 0,
      generatedAt: new Date().toISOString(),
      tbc: false,
    });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`NotifyCustomerInformation — target=${TARGET}`, () => {
  it('accepts a customer info notification and returns empty body', async () => {
    const resp = await call('NotifyCustomerInformation', {
      data: 'fake-data',
      tbc: false,
      seqNo: 0,
      generatedAt: new Date().toISOString(),
      requestId: 1,
    });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`NotifyDisplayMessages — target=${TARGET}`, () => {
  it('accepts an empty display-messages report and returns empty body', async () => {
    const resp = await call('NotifyDisplayMessages', { requestId: 0, tbc: false });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`ReservationStatusUpdate — target=${TARGET}`, () => {
  it('accepts a reservation status update and returns empty body', async () => {
    const resp = await call('ReservationStatusUpdate', {
      reservationId: 1,
      reservationUpdateStatus: 'Expired',
    });
    expect(resp[0]).toBe(3);
    expect(resp[2]).toEqual({});
  }, 15_000);
});

describe(`NotifyEVChargingNeeds — target=${TARGET}`, () => {
  it('accepts charging needs and returns a status', async () => {
    const resp = await call('NotifyEVChargingNeeds', {
      evseId: 1,
      chargingNeeds: { requestedEnergyTransfer: 'DC' },
    });
    expect(resp[0]).toBe(3);
    const body = resp[2] as { status?: string };
    expect(['Accepted', 'Rejected', 'Processing', 'NoChargingProfile']).toContain(body.status);
  }, 15_000);
});
