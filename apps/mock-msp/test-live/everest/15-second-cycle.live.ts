// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// A second plug/start/stop/unplug cycle: the mock must hand back this cycle's
// Session, not the one already in its domain state (seq floors).
import { describe, expect, it } from 'vitest';
import { ctl, ctlGet, sleep } from '../support/live-client.js';

const LONG = 150_000;

describe('second cycle', () => {
  it(
    'start returns a new session, stop and unplug end it',
    async () => {
      const before = Object.keys((await ctlGet<any>('/state/sessions')).body);
      await sleep(5_000);
      const plug = await ctl<any>('/everest/plug', {});
      expect(plug.status, JSON.stringify(plug.body)).toBe(200);
      const r = await ctl<any>('/charge/start', { timeoutMs: 45_000 });
      expect(r.body.sync?.result, JSON.stringify(r.body)).toBe('ACCEPTED');
      expect(r.body.session, JSON.stringify(r.body)).toBeDefined();
      expect(before).not.toContain(r.body.session.id);
      await sleep(8_000);
      const s = await ctl<any>('/charge/stop', {
        session_id: r.body.session.id,
        timeoutMs: 45_000,
      });
      expect(s.body.sync?.result).toBe('ACCEPTED');
      expect((await ctl<any>('/everest/unplug', {})).status).toBe(200);
      await sleep(10_000);
    },
    LONG,
  );
});
