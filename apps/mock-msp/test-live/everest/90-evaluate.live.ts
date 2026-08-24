// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// After the cycles: status, coverage and the findings policy.
import { beforeAll, describe, expect, it } from 'vitest';
import { unexpectedErrors } from '../support/known-findings.js';
import { commandableProtocol, ctl, ctlGet, findings } from '../support/live-client.js';

describe('after the charge loop', () => {
  let commandable = { ok: true, reason: '' };

  beforeAll(async () => {
    commandable = await commandableProtocol();
  });

  it('status: charger up, station online, no active session left', async () => {
    const r = await ctlGet<any>('/status?fresh=1');
    expect(r.body.everest.state).toBe('up');
    expect(r.body.citrine.station.state).toBe('online');
    // the last cycle's COMPLETED push can still be in flight after the unplug
    await expect
      .poll(async () => (await ctlGet<any>('/status?fresh=1')).body.mock.activeSession, {
        timeout: 60_000,
        interval: 2_000,
      })
      .toBeNull();
  });

  it('coverage: sessions and command results came in, commands went out', async (ctx) => {
    if (!commandable.ok) ctx.skip(commandable.reason);
    const r = await ctlGet<any>('/coverage');
    const cell = (m: string) => r.body.modules.find((x: any) => x.module === m);
    expect(cell('sessions').inbound.count).toBeGreaterThan(0);
    expect(cell('commands').inbound.count).toBeGreaterThan(0);
    expect(cell('commands').outbound.count).toBeGreaterThan(0);
    expect(cell('cdrs').inbound.count + cell('cdrs').outbound.count).toBeGreaterThan(0);
  });

  it('preregistered scenario evaluates clean and no unexplained error findings', async () => {
    await ctl('/reregister', { discoverOnly: true });
    const r = await ctl<any>('/scenarios/preregistered/evaluate', {});
    expect(r.body.passed, JSON.stringify(r.body.results)).toBe(true);
    const bad = unexpectedErrors(await findings());
    expect(bad.map((f) => `${f.module}: ${f.detail}`)).toEqual([]);
  });
});
