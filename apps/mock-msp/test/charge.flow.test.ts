// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// The live-charging control flow, Citrine-free. Drives /_mock/discover/evse and
// /_mock/charge/start|stop against a stub CPO, and simulates Citrine's async
// CommandResult callback + the Session/CDR push so the orchestrator's awaits
// resolve. This is the hermetic mirror of the real EVerest end-to-end: only the
// stub swaps out for live CitrineOS + EVerest.
//
// It also pins the corrected command identity: the outbound START_SESSION must
// carry evse_uid 'cp001::1' (the seeded station EVerest registers as), not the
// old 'EVSE1' that resolved to no station and forced a REJECT.
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext, PendingCommand } from '../src/core/types.js';
import {
  makeServer,
  startStubCpo,
  ocpiEnvelope,
  authHeader,
  functionalHeaders,
  validSession,
  SEED_TOKEN_WE_ACCEPT,
  type StubCpo,
} from './harness.js';

const CONTROL = { 'content-type': 'application/json' };
function callbackHeaders(): Record<string, string> {
  return {
    authorization: authHeader(SEED_TOKEN_WE_ACCEPT),
    'content-type': 'application/json',
    'x-request-id': 'cb-req',
    'x-correlation-id': 'cb-cor',
  };
}

/** Poll the domain until sendCommand has recorded its PendingCommand (set synchronously). */
async function waitForPending(ctx: MockContext): Promise<PendingCommand> {
  for (let i = 0; i < 400; i++) {
    const pending = [...ctx.store.domain.commands.values()];
    if (pending.length > 0) return pending[pending.length - 1];
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error('command was never sent (no PendingCommand recorded)');
}

describe('live charging flow (discover + charge start/stop, Citrine-free)', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;
  let startSync: Record<string, unknown>;

  beforeEach(async () => {
    startSync = { result: 'ACCEPTED', timeout: 30 };
    cpo = await startStubCpo((req) => {
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/locations') {
        return {
          json: ocpiEnvelope([
            { id: '1', evses: [{ uid: 'cp001::1', connectors: [{ id: '1' }] }] },
          ]),
        };
      }
      if (req.method === 'POST' && req.path === '/ocpi/2.2.1/commands/START_SESSION') {
        return { json: ocpiEnvelope(startSync) };
      }
      if (req.method === 'POST' && req.path === '/ocpi/2.2.1/commands/STOP_SESSION') {
        return { json: ocpiEnvelope({ result: 'ACCEPTED', timeout: 30 }) };
      }
      return undefined;
    });
    ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  // ---- discovery ----------------------------------------------------------
  it('discover/evse returns the real id triple from a locations pull', async () => {
    const res = await app.inject({ method: 'GET', url: '/_mock/discover/evse', headers: CONTROL });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.discovered).toBe(true);
    expect(j.location_id).toBe('1');
    expect(j.evse_uid).toBe('cp001::1');
    expect(j.connector_id).toBe('1');
  });

  // ---- start: full ACCEPTED round-trip ------------------------------------
  it('charge/start: ACCEPTED sync, awaits async CommandResult and the pushed Session', async () => {
    const startP = app.inject({
      method: 'POST',
      url: '/_mock/charge/start',
      headers: CONTROL,
      payload: JSON.stringify({ timeoutMs: 4000 }),
    });

    // Once the command is on the wire, simulate Citrine's async callback + Session push.
    const pending = await waitForPending(ctx);
    const cbPath = new URL(pending.responseUrl).pathname;
    const cb = await app.inject({
      method: 'POST',
      url: cbPath,
      headers: callbackHeaders(),
      payload: JSON.stringify({ result: 'ACCEPTED' }),
    });
    expect(cb.statusCode).toBe(200);
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-1',
      headers: functionalHeaders(ctx.config),
      // Citrine echoes the started EVSE, so the pushed Session carries the same
      // evse_uid the command sent — which chargeStart now correlates on.
      payload: JSON.stringify(validSession({ evse_uid: 'cp001::1' })),
    });

    const res = await startP;
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.sync.result).toBe('ACCEPTED');
    expect(j.commandResult.result).toBe('ACCEPTED');
    expect(j.session.id).toBe('SESSION-1');

    // The corrected identity reached the wire (was 'EVSE1' -> now the seeded station).
    expect(j.sent.evse_uid).toBe('cp001::1');
    const outbound = ctx.store.query({ direction: 'outbound', operation: 'command.START_SESSION' });
    expect(outbound).toHaveLength(1);
    expect((outbound[0].request.body as { evse_uid?: string }).evse_uid).toBe('cp001::1');
    expect((outbound[0].request.body as { location_id?: string }).location_id).toBe('1');
    expect(((outbound[0].request.body as { token?: { uid?: string } }).token ?? {}).uid).toBe(
      'DEADBEEF',
    );
  });

  // ---- start: REJECTED is terminal (no callback wait) ---------------------
  it('charge/start: a REJECTED sync returns immediately without awaiting a CommandResult', async () => {
    startSync = { result: 'REJECTED', timeout: 30 };
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/charge/start',
      headers: CONTROL,
      payload: JSON.stringify({ timeoutMs: 4000 }),
    });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.sync.result).toBe('REJECTED');
    expect(j.commandResult).toBeUndefined();
    expect(j.session).toBeUndefined();
  });

  // ---- stop: awaits the CommandResult + the pushed CDR --------------------
  it('charge/stop: STOP_SESSION awaits the async CommandResult and the pushed CDR', async () => {
    const stopP = app.inject({
      method: 'POST',
      url: '/_mock/charge/stop',
      headers: CONTROL,
      payload: JSON.stringify({ session_id: 'SESSION-1', timeoutMs: 4000 }),
    });

    const pending = await waitForPending(ctx);
    const cbPath = new URL(pending.responseUrl).pathname;
    await app.inject({
      method: 'POST',
      url: cbPath,
      headers: callbackHeaders(),
      payload: JSON.stringify({ result: 'ACCEPTED' }),
    });
    await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/cdrs',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify({ id: 'CDR-1' }),
    });

    const res = await stopP;
    const j = res.json();
    expect(j.command).toBe('STOP_SESSION');
    expect(j.session_id).toBe('SESSION-1');
    expect(j.sync.result).toBe('ACCEPTED');
    expect(j.commandResult.result).toBe('ACCEPTED');
    expect(j.cdr.id).toBe('CDR-1');
  });

  // ---- stop with no session ----------------------------------------------
  it('charge/stop: with no active session and no session_id returns a clear 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/charge/stop',
      headers: CONTROL,
      payload: JSON.stringify({}),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('no_session');
  });
});
