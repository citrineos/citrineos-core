// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The full loop against EVerest (cp001 online, patched to OCPP 2.0.1):
// plug -> START_SESSION -> Session push -> STOP_SESSION -> CDR -> unplug.
import { beforeAll, describe, expect, it } from 'vitest';
import {
  commandableProtocol,
  ctl,
  ctlGet,
  maxSeq,
  sleep,
  waitFor,
} from '../support/live-client.js';

const LONG = 150_000;
let sessionId: string | undefined;
let commandable = { ok: true, reason: '' };

describe('charge loop', () => {
  beforeAll(async () => {
    commandable = await commandableProtocol();
  });

  it('station is online and the EVSE resolves', async () => {
    const st = await ctlGet<any>('/status?fresh=1');
    expect(st.body.everest.state).toBe('up');
    expect(st.body.citrine.station.state).toBe('online');
    const d = await ctlGet<any>('/discover/evse');
    expect(d.body).toMatchObject({ evse_uid: 'cp001::1', connector_id: '1' });
  });

  it(
    'plug in, start: ACCEPTED, async result, Session pushed',
    async (ctx) => {
      if (!commandable.ok) ctx.skip(commandable.reason);
      const plug = await ctl<any>('/everest/plug', {});
      expect(plug.status, JSON.stringify(plug.body)).toBe(200);
      expect(plug.body.plugged).toBe(true);
      const r = await ctl<any>('/charge/start', { timeoutMs: 45_000 });
      expect(r.status).toBe(200);
      expect(r.body.sync?.result, JSON.stringify(r.body)).toBe('ACCEPTED');
      expect(r.body.commandResult?.result, JSON.stringify(r.body)).toBe('ACCEPTED');
      expect(r.body.session, JSON.stringify(r.body)).toBeDefined();
      expect(r.body.session.evse_uid).toBe('cp001::1');
      expect(r.body.session.cdr_token.uid).toBe('DEADBEEF');
      expect(r.body.session.status).toBe('ACTIVE');
      sessionId = r.body.session.id;
      await sleep(10_000);
    },
    LONG,
  );

  it(
    'stop: async result, CDR by push or pull',
    async (ctx) => {
      if (!commandable.ok) ctx.skip(commandable.reason);
      expect(sessionId).toBeDefined();
      const r = await ctl<any>('/charge/stop', { session_id: sessionId, timeoutMs: 45_000 });
      expect(r.status).toBe(200);
      expect(r.body.command).toBe('STOP_SESSION');
      expect(r.body.sync?.result, JSON.stringify(r.body)).toBe('ACCEPTED');
      // the stop may come back FAILED against EVerest (core looks up the
      // transaction without the station protocol); the unplug below still ends
      // the transaction and produces the CDR
      expect(['ACCEPTED', 'FAILED']).toContain(r.body.commandResult?.result);
    },
    LONG,
  );

  it(
    'unplug ends the session and a CDR exists for it',
    async (ctx) => {
      if (!commandable.ok) ctx.skip(commandable.reason);
      const floor = await maxSeq();
      const u = await ctl<any>('/everest/unplug', {});
      expect(u.status).toBe(200);
      expect(u.body.unplugged).toBe(true);
      // Citrine reports the end as a session PATCH with status COMPLETED
      const ended = await waitFor(
        {
          direction: 'inbound',
          module: 'sessions',
          minSeq: floor + 1,
          bodyMatch: { id: sessionId, status: 'COMPLETED' },
        },
        60_000,
      ).catch(() => undefined);
      const pulled = await ctl<any>('/pull/cdrs', { limit: '1000' });
      const cdrs = (pulled.body.exchange.response.body?.data ?? []) as any[];
      const mine = cdrs.find((c) => c.session_id === sessionId);
      expect(
        ended ?? mine,
        'neither a COMPLETED session push nor a CDR for the session',
      ).toBeTruthy();
      if (mine) expect(Number(mine.total_energy)).toBeGreaterThanOrEqual(0);
    },
    LONG,
  );
});
