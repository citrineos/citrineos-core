// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Credentials lifecycle against the real CPO. Runs last because it rotates and
// deletes the partner registration. Citrine deletes the TenantPartner row on
// DELETE /credentials, and its generate-credentials-token-a only accepts a
// partner without an OCPI profile, so a bare row is re-inserted through Hasura
// before each fresh msp-initiated handshake. The mock is left registered.
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  BASE,
  ctl,
  exchanges,
  findings,
  hasura,
  health,
  loadScenario,
  maxSeq,
  waitFor,
} from '../support/live-client.js';

const APP_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

async function partnerRows(): Promise<number> {
  const r = await hasura<any>(
    '{ TenantPartners(where: {partyId: {_eq: "TST"}, countryCode: {_eq: "US"}}) { id } }',
  );
  return r.data.TenantPartners.length;
}

async function insertPartner(profile?: Record<string, unknown>): Promise<void> {
  const now = new Date().toISOString();
  const r = await hasura<any>(
    'mutation($obj: TenantPartners_insert_input!) { insert_TenantPartners_one(object: $obj) { id } }',
    {
      obj: {
        tenantId: 1,
        partyId: 'TST',
        countryCode: 'US',
        partnerProfileOCPI: profile ?? null,
        createdAt: now,
        updatedAt: now,
      },
    },
  );
  expect(r.errors, JSON.stringify(r.errors)).toBeUndefined();
}

function cli(arg: string, env: Record<string, string> = {}): number {
  try {
    execFileSync(
      process.execPath,
      [resolve(APP_DIR, 'node_modules/tsx/dist/cli.mjs'), 'scripts/register.ts', arg],
      {
        cwd: APP_DIR,
        stdio: 'pipe',
        timeout: 60_000,
        env: { ...process.env, MOCK_MSP_CONTROL_BASE: BASE, ...env },
      },
    );
    return 0;
  } catch (e) {
    return (e as { status?: number }).status ?? -1;
  }
}

describe('registration', () => {
  it('reregister rotates our credentials and the old token dies', async () => {
    const r = await ctl<any>('/reregister', {});
    expect(r.status).toBe(200);
    expect(r.body.registration.status).toBe('registered');
    expect(r.body.rotation).toMatchObject({
      rotated: true,
      cpoTokenChanged: true,
      staleTokenProbe: { httpStatus: 401, rejected: true },
    });
    const rotation = (await findings()).filter(
      (f) => f.detail.includes('did not rotate') || f.detail.includes('old token still accepted'),
    );
    expect(rotation).toEqual([]);
    expect((await ctl<any>('/pull/locations', {})).body.exchange.response.httpStatus).toBe(200);
  });

  it('unregister: Citrine drops the partner', async () => {
    const r = await ctl<any>('/unregister', {});
    expect(r.status).toBe(200);
    expect(r.body.unregistered).toBe(true);
    expect((await health()).registration.status).toBe('unregistered');
    expect(await partnerRows()).toBe(0);
  });

  it('msp-initiated handshake from a bare partner row', async () => {
    await insertPartner();
    expect((await loadScenario('unregistered')).status).toBe(200);
    const r = await ctl<any>('/register?mode=msp-initiated', {});
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.registered).toBe(true);
    expect(r.body.registration.status).toBe('registered');
    expect(r.body.registration.cpoEndpoints.length).toBeGreaterThan(0);
    expect((await health()).registration.status).toBe('registered');
    expect((await ctl<any>('/pull/locations', {})).body.exchange.response.httpStatus).toBe(200);
    const ev = await ctl<any>('/scenarios/unregistered/evaluate', {});
    expect(ev.body.passed, JSON.stringify(ev.body.results)).toBe(true);
  });

  it('Citrine talks to us with the new token', async () => {
    const floor = await maxSeq();
    expect((await ctl<any>('/provoke/location-nudge', {})).status).toBe(200);
    const ex = await waitFor(
      { direction: 'inbound', module: 'locations', method: 'PATCH', minSeq: floor + 1 },
      30_000,
    );
    expect(ex.request.ocpi.tokenValid).toBe(true);
    expect(ex.response.httpStatus).toBe(200);
  });

  it('cpo-initiated handshake', async () => {
    expect((await ctl<any>('/unregister', {})).status).toBe(200);
    expect(await partnerRows()).toBe(0);
    await insertPartner({ version: { version: '2.2.1' } });
    expect((await loadScenario('unregistered')).status).toBe(200);
    const floor = await maxSeq();
    const r = await ctl<any>('/register?mode=cpo-initiated', {});
    expect(r.status).toBe(200);
    const ex = (await exchanges({ operation: 'credentials.register-token-a' })).at(-1);
    expect(ex).toBeDefined();
    if (ex!.response.httpStatus === 200) {
      // Citrine finishes the handshake by POSTing its credentials to us
      await waitFor(
        { direction: 'inbound', operation: 'credentials.post', minSeq: floor + 1 },
        30_000,
      );
      expect((await health()).registration.status).toBe('registered');
      expect((await ctl<any>('/pull/locations', {})).body.exchange.response.httpStatus).toBe(200);
      return;
    }
    // Citrine's register-credentials-token-a declares versionUrl / cpoCountryCode /
    // cpoPartyId as route params on a route that has none, so no client can
    // satisfy it today. Pin that so a fix upstream shows up here.
    expect(ex!.response.httpStatus).toBe(500);
    expect(JSON.stringify(ex!.response.body)).toContain('versionUrl');
    expect((await health()).registration.status).toBe('unregistered');
  });

  it('register.ts drives the same handshake', async () => {
    const h = await health();
    if (h.registration.status === 'registered') {
      expect((await ctl<any>('/unregister', {})).status).toBe(200);
    }
    await hasura(
      'mutation { delete_TenantPartners(where: {partyId: {_eq: "TST"}, countryCode: {_eq: "US"}}) { affected_rows } }',
    );
    await insertPartner();
    expect((await loadScenario('unregistered')).status).toBe(200);
    expect(cli('msp-initiated')).toBe(0);
    expect((await health()).registration.status).toBe('registered');
    expect(cli('reregister')).toBe(0);
    expect(cli('reregister', { MOCK_MSP_CONTROL_BASE: 'http://127.0.0.1:1' })).not.toBe(0);
    expect((await ctl<any>('/pull/locations', {})).body.exchange.response.httpStatus).toBe(200);
  });
});
