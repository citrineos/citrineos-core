// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The Adversary against real traffic, both directions.
import { describe, expect, it } from 'vitest';
import { ctl, ctlDelete, ctlGet, maxSeq, waitFor } from '../support/live-client.js';

const OCPI_HEALTH = process.env.CITRINE_OCPI_HEALTH_URL ?? 'http://localhost:8085/ocpi/health';

async function nudgeAndWait() {
  const floor = await maxSeq();
  const p = await ctl<any>('/provoke/location-nudge', {});
  expect(p.status).toBe(200);
  return waitFor(
    { direction: 'inbound', module: 'locations', method: 'PATCH', minSeq: floor + 1 },
    30_000,
  );
}

describe('faults', () => {
  it('inbound ocpiStatus: Citrine gets a 3001 on its location push', async () => {
    const armed = await ctl<any>('/fault', {
      id: 'live-3001',
      match: { module: 'locations', direction: 'inbound' },
      action: { kind: 'ocpiStatus', status_code: 3001, status_message: 'live lane fault' },
    });
    expect(armed.status).toBe(200);
    const ex = await nudgeAndWait();
    expect(ex.fault).toMatchObject({ ruleId: 'live-3001', kind: 'ocpiStatus' });
    expect(ex.response.ocpiStatusCode).toBe(3001);
    expect((await ctlDelete('/faults/live-3001')).status).toBe(200);
  });

  it('inbound unauthorized: Citrine gets a 401', async () => {
    await ctl('/fault', {
      id: 'live-401',
      match: { module: 'locations', direction: 'inbound' },
      action: { kind: 'unauthorized' },
    });
    const ex = await nudgeAndWait();
    expect(ex.fault?.ruleId).toBe('live-401');
    expect(ex.response.httpStatus).toBe(401);
    await ctlDelete('/faults/live-401');
  });

  it('Citrine is still healthy after that', async () => {
    const res = await fetch(OCPI_HEALTH);
    expect(res.status).toBe(200);
    expect((await ctlGet<any>('/health')).body.status).toBe('up');
  });

  it('outbound unauthorized: our token push is rejected by Citrine', async () => {
    await ctl('/fault', {
      id: 'live-out-401',
      match: { module: 'tokens', direction: 'outbound' },
      action: { kind: 'unauthorized' },
    });
    const r = await ctl<any>('/emit/token', {});
    expect(r.status).toBe(200);
    expect(r.body.exchange.fault?.ruleId).toBe('live-out-401');
    expect(r.body.exchange.response.httpStatus).toBe(401);
    await ctlDelete('/faults/live-out-401');
  });

  it('outbound dropHeaders is recorded on the exchange', async () => {
    await ctl('/fault', {
      id: 'live-out-hdr',
      match: { module: 'tokens', direction: 'outbound' },
      action: { kind: 'dropHeaders', headers: ['X-Request-ID', 'X-Correlation-ID'] },
    });
    const r = await ctl<any>('/emit/token', {});
    expect(r.status).toBe(200);
    expect(r.body.exchange.fault?.kind).toBe('dropHeaders');
    expect(typeof r.body.exchange.response.httpStatus).toBe('number');
    await ctlDelete('/faults/live-out-hdr');
  });

  it('nothing left armed', async () => {
    expect((await ctlDelete('/faults')).status).toBe(200);
    expect((await ctlGet<any[]>('/faults')).body).toEqual([]);
  });
});
