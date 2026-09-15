// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Scenario hot-loading and the expect[] oracle against the live trace.
import { describe, expect, it } from 'vitest';
import { ctl, loadScenario, resetKeepingScenario } from '../support/live-client.js';

describe('scenarios', () => {
  it('authorize-blocked loads; without a charger its expectation stays unmet', async () => {
    const l = await loadScenario('authorize-blocked');
    expect(l.status).toBe(200);
    expect(l.body.applied).toBe('authorize-blocked');
    const r = await ctl<any>('/scenarios/authorize-blocked/evaluate', {});
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ total: 1, failures: 1, passed: false });
    expect(r.body.results[0].on).toBe('tokens.authorize');
  });

  it('preregistered passes once a re-handshake has fetched version details', async () => {
    await resetKeepingScenario('preregistered');
    const re = await ctl<any>('/reregister', { discoverOnly: true });
    expect(re.status).toBe(200);
    const r = await ctl<any>('/scenarios/preregistered/evaluate', {});
    expect(r.status).toBe(200);
    expect(r.body.passed, JSON.stringify(r.body.results)).toBe(true);
  });

  it('an impossible inline expectation fails with the observed value', async () => {
    const s = await ctl<any>('/scenario', {
      name: 'live-impossible',
      registration: 'preregistered',
      expect: [{ on: 'nothing.ever', assert: 'count > 0', detail: 'cannot happen' }],
    });
    expect(s.status).toBe(200);
    const r = await ctl<any>('/scenarios/live-impossible/evaluate', {});
    expect(r.body.passed).toBe(false);
    expect(r.body.results[0]).toMatchObject({ pass: false, observed: 'count=0' });
    await resetKeepingScenario('preregistered');
  });
});
