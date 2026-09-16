// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Token push / readback / patch against Citrine's tokens RECEIVER. A fresh uid
// every run; DEADBEEF is never touched because the charge flow depends on it.
import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ctl } from '../support/live-client.js';

const uid = randomBytes(7).toString('hex').toUpperCase();

describe('tokens', () => {
  it('push a new token', async () => {
    const r = await ctl<any>('/emit/token', { uid });
    expect(r.status).toBe(200);
    expect(r.body.pushed).toBe(true);
    expect(r.body.exchange.response.httpStatus).toBe(200);
    expect(r.body.exchange.response.ocpiStatusCode).toBe(1000);
    expect(r.body.exchange.validation.ok).toBe(true);
  });

  it('readback matches what was pushed', async () => {
    const r = await ctl<any>('/verify/token', { uid });
    expect(r.status).toBe(200);
    expect(r.body.verified).toBe(true);
    expect(r.body.drift).toEqual([]);
  });

  it('an explicit valid:false patch is honoured', async () => {
    const p = await ctl<any>('/emit/token-patch', { uid });
    expect(p.status).toBe(200);
    expect(p.body.sent).toEqual({ valid: false });
    expect(p.body.exchange.response.ocpiStatusCode).toBe(1000);
    const v = await ctl<any>('/verify/token', { uid });
    expect(v.body.verified).toBe(true);
  });

  it('a patch that omits valid either leaves it alone or trips the known Citrine bug', async () => {
    await ctl('/emit/token', { uid, valid: true });
    const p = await ctl<any>('/emit/token-patch', { uid, patch: { language: 'en' } });
    expect(p.status).toBe(200);
    const v = await ctl<any>('/verify/token', { uid });
    expect(v.status).toBe(200);
    const validDrift = v.body.drift.filter((d: any) => d.field === 'valid');
    if (validDrift.length) {
      expect(validDrift[0]).toMatchObject({ served: false, isKnownCitrineBug: true });
    } else {
      expect(v.body.verified).toBe(true);
    }
  });

  it('restore the token', async () => {
    // Citrine keeps the language from the patch on a PUT that omits it, so
    // restore with it to get a clean readback
    const r = await ctl<any>('/emit/token', { uid, valid: true, language: 'en' });
    expect(r.status).toBe(200);
    const v = await ctl<any>('/verify/token', { uid });
    expect(v.body.verified).toBe(true);
  });
});
