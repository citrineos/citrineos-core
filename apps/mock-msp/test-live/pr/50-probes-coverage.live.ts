// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Spec probes, the coverage matrix after the files above, and the findings
// policy: every error-level finding must be a documented Citrine defect.
import { describe, expect, it } from 'vitest';
import { classify, unexpectedErrors } from '../support/known-findings.js';
import { ctlGet, exchanges, findings } from '../support/live-client.js';

describe('probes and coverage', () => {
  it('spec probes run and every failing one is a known defect', async () => {
    const r = await ctlGet<any>('/probes');
    expect(r.status).toBe(200);
    expect(r.body.probes).toHaveLength(3);
    expect(r.body.failing).toBe(r.body.probes.filter((p: any) => !p.ok).length);
    const mirrored = (await findings()).filter((f) => f.detail.startsWith('Spec probe ['));
    expect(mirrored).toHaveLength(r.body.failing);
    for (const f of mirrored) expect(classify(f)?.id, f.detail).toBeDefined();
  });

  it('coverage reflects what ran so far', async () => {
    const r = await ctlGet<any>('/coverage');
    expect(r.status).toBe(200);
    const cell = (m: string) => r.body.modules.find((x: any) => x.module === m);
    expect(r.body.modules).toHaveLength(9);
    expect(cell('locations').inbound.count).toBeGreaterThan(0);
    for (const m of ['locations', 'tariffs', 'sessions', 'cdrs', 'tokens', 'commands']) {
      expect(cell(m).outbound.count, m).toBeGreaterThan(0);
    }
    expect(cell('chargingprofiles').inbound.count).toBe(0);
    expect(cell('chargingprofiles').outbound.count).toBe(0);
  });

  it('no unexplained error findings', async () => {
    const bad = unexpectedErrors(await findings());
    expect(bad.map((f) => `${f.module}: ${f.detail}`)).toEqual([]);
  });

  it('exchange queries: limit and the json filter form', async () => {
    const two = await ctlGet<any[]>('/exchanges?limit=2');
    expect(two.body).toHaveLength(2);
    const a = await exchanges({ direction: 'outbound' });
    const b = await ctlGet<any[]>('/exchanges?direction=outbound');
    expect(a.map((e) => e.id)).toEqual(b.body.map((e) => e.id));
  });
});
