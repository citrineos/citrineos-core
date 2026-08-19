// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The degraded branches of /_mock/charge/start and /_mock/charge/stop: missing
// callbacks, missing pushes, the CDR pull fallbacks, and the seq floors that
// keep a second cycle from reusing the first cycle's Session/CDR.
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
  type StubCpoReply,
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

/** Poll until at least `count` PendingCommands exist, then return the newest. */
async function waitForPending(ctx: MockContext, count = 1): Promise<PendingCommand> {
  for (let i = 0; i < 400; i++) {
    const pending = [...ctx.store.domain.commands.values()];
    if (pending.length >= count) return pending[pending.length - 1];
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error(`command #${count} was never sent (no PendingCommand recorded)`);
}

describe('charge start/stop degraded branches', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;
  // What the stub CPO serves on GET /ocpi/2.2.1/cdrs (the pull fallback).
  let cdrPull: () => StubCpoReply;

  beforeEach(async () => {
    cdrPull = () => ({ json: ocpiEnvelope([]) });
    cpo = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path.startsWith('/ocpi/2.2.1/commands/')) {
        return { json: ocpiEnvelope({ result: 'ACCEPTED', timeout: 30 }) };
      }
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/cdrs') return cdrPull();
      return undefined;
    });
    ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  function chargeStart(body: Record<string, unknown>) {
    return app.inject({
      method: 'POST',
      url: '/_mock/charge/start',
      headers: CONTROL,
      payload: JSON.stringify(body),
    });
  }
  function chargeStop(body: Record<string, unknown>) {
    return app.inject({
      method: 'POST',
      url: '/_mock/charge/stop',
      headers: CONTROL,
      payload: JSON.stringify(body),
    });
  }
  async function sendCallback(pending: PendingCommand, result = 'ACCEPTED') {
    const res = await app.inject({
      method: 'POST',
      url: new URL(pending.responseUrl).pathname,
      headers: callbackHeaders(),
      payload: JSON.stringify({ result }),
    });
    expect(res.statusCode).toBe(200);
  }
  function pushSession(id: string, evseUid = 'cp001::1') {
    return app.inject({
      method: 'PUT',
      url: `/ocpi/2.2.1/emsp/sessions/US/TST/${id}`,
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validSession({ id, evse_uid: evseUid })),
    });
  }
  function pushCdr(id: string, sessionId: string) {
    return app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/cdrs',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify({ id, session_id: sessionId }),
    });
  }

  // ---- start --------------------------------------------------------------

  it('start: ACCEPTED but no CommandResult within timeoutMs -> commandResultError + sessionPending', async () => {
    const res = await chargeStart({ timeoutMs: 300 });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.sync.result).toBe('ACCEPTED');
    expect(j.commandResult).toBeUndefined();
    expect(j.commandResultError).toContain('timed out after 300ms');
    expect(j.session).toBeUndefined();
    expect(j.sessionPending).toBe(true);
  });

  it('start: CommandResult arrives but no Session push -> commandResult set, sessionPending', async () => {
    const startP = chargeStart({ timeoutMs: 300 });
    const pending = await waitForPending(ctx);
    await sendCallback(pending);
    const j = (await startP).json();
    expect(j.commandResult.result).toBe('ACCEPTED');
    expect(j.commandResultError).toBeUndefined();
    expect(j.session).toBeUndefined();
    expect(j.sessionPending).toBe(true);
  });

  it('start: a Session for a different EVSE does not satisfy the wait', async () => {
    const startP = chargeStart({ timeoutMs: 300 });
    const pending = await waitForPending(ctx);
    await sendCallback(pending);
    await pushSession('OTHER-EVSE', 'cp002::1');
    const j = (await startP).json();
    expect(j.session).toBeUndefined();
    expect(j.sessionPending).toBe(true);
  });

  // ---- stop: CDR sources -------------------------------------------------

  it('stop: a pushed CDR wins -> cdrSource push', async () => {
    const stopP = chargeStop({ session_id: 'SESSION-1', timeoutMs: 1000 });
    const pending = await waitForPending(ctx);
    await sendCallback(pending);
    await pushCdr('CDR-PUSHED', 'SESSION-1');
    const j = (await stopP).json();
    expect(j.commandResult.result).toBe('ACCEPTED');
    expect(j.cdr.id).toBe('CDR-PUSHED');
    expect(j.cdrSource).toBe('push');
    expect(j.cdrPending).toBeUndefined();
    // No pull was needed.
    expect(cpo.requests.filter((r) => r.method === 'GET')).toHaveLength(0);
  });

  it('stop: no push, pull serves a CDR for this session -> cdrSource pull', async () => {
    cdrPull = () => ({
      json: ocpiEnvelope([
        { id: 'CDR-OLD', session_id: 'SESSION-0' },
        { id: 'CDR-MATCH', session_id: 'SESSION-1' },
        { id: 'CDR-NEWER-OTHER', session_id: 'SESSION-9' },
      ]),
    });
    const stopP = chargeStop({ session_id: 'SESSION-1', timeoutMs: 300 });
    const pending = await waitForPending(ctx);
    await sendCallback(pending);
    const j = (await stopP).json();
    expect(j.cdr.id).toBe('CDR-MATCH');
    expect(j.cdrSource).toBe('pull');
    expect(j.cdrNote).toBeUndefined();
    const pull = cpo.requests.find((r) => r.method === 'GET');
    expect(pull?.path).toBe('/ocpi/2.2.1/cdrs');
    const pullEx = ctx.store.query({ direction: 'outbound', operation: 'pull.cdrs' }).at(-1)!;
    expect(pullEx.request.url).toContain('limit=1000');
  });

  it('stop: pull serves CDRs but none for this session -> pull-uncorrelated + cdrNote', async () => {
    cdrPull = () => ({
      json: ocpiEnvelope([
        { id: 'CDR-A', session_id: 'SESSION-A' },
        { id: 'CDR-B', session_id: 'SESSION-B' },
      ]),
    });
    const stopP = chargeStop({ session_id: 'SESSION-1', timeoutMs: 300 });
    const pending = await waitForPending(ctx);
    await sendCallback(pending);
    const j = (await stopP).json();
    expect(j.cdr.id).toBe('CDR-B');
    expect(j.cdrSource).toBe('pull-uncorrelated');
    expect(j.cdrNote).toContain('could not match session_id');
    expect(j.cdrPending).toBeUndefined();
  });

  it('stop: pull serves an empty page -> cdrPending', async () => {
    const stopP = chargeStop({ session_id: 'SESSION-1', timeoutMs: 300 });
    const pending = await waitForPending(ctx);
    await sendCallback(pending);
    const j = (await stopP).json();
    expect(j.cdr).toBeUndefined();
    expect(j.cdrSource).toBeUndefined();
    expect(j.cdrPending).toBe(true);
  });

  it('stop: pull fails (HTTP 500, non-JSON) -> cdrPending, failure visible on the pull exchange', async () => {
    cdrPull = () => ({ status: 500, text: 'boom' });
    const stopP = chargeStop({ session_id: 'SESSION-1', timeoutMs: 300 });
    const pending = await waitForPending(ctx);
    await sendCallback(pending);
    const j = (await stopP).json();
    expect(j.cdr).toBeUndefined();
    expect(j.cdrPending).toBe(true);
    const pullEx = ctx.store.query({ direction: 'outbound', operation: 'pull.cdrs' }).at(-1)!;
    expect(pullEx.response.httpStatus).toBe(500);
    expect(pullEx.findings.some((f) => f.detail.includes('HTTP 500'))).toBe(true);
  });

  it('stop: no CommandResult within timeoutMs -> commandResultError, CDR handling still runs', async () => {
    const stopP = chargeStop({ session_id: 'SESSION-1', timeoutMs: 300 });
    await waitForPending(ctx);
    const j = (await stopP).json();
    expect(j.sync.result).toBe('ACCEPTED');
    expect(j.commandResultError).toContain('timed out after 300ms');
    expect(j.cdrPending).toBe(true);
  });

  // ---- two cycles: seq floors --------------------------------------------

  it('a second start/stop cycle never returns the first cycle’s Session or CDR', async () => {
    // Cycle 1.
    const start1 = chargeStart({ timeoutMs: 2000 });
    await sendCallback(await waitForPending(ctx, 1));
    await pushSession('SESSION-A');
    expect((await start1).json().session.id).toBe('SESSION-A');

    const stop1 = chargeStop({ timeoutMs: 2000 });
    await sendCallback(await waitForPending(ctx, 2));
    await pushCdr('CDR-A', 'SESSION-A');
    const j1 = (await stop1).json();
    expect(j1.session_id).toBe('SESSION-A');
    expect(j1.cdr.id).toBe('CDR-A');
    expect(j1.cdrSource).toBe('push');

    // Cycle 2: the stale SESSION-A / CDR-A are still in the recorder, so a broken
    // floor would resolve to them before SESSION-B / CDR-B are injected.
    const start2 = chargeStart({ timeoutMs: 2000 });
    await sendCallback(await waitForPending(ctx, 3));
    await pushSession('SESSION-B');
    const j2 = (await start2).json();
    expect(j2.commandResult.result).toBe('ACCEPTED');
    expect(j2.session.id).toBe('SESSION-B');

    const stop2 = chargeStop({ timeoutMs: 2000 });
    await sendCallback(await waitForPending(ctx, 4));
    await pushCdr('CDR-B', 'SESSION-B');
    const j3 = (await stop2).json();
    expect(j3.session_id).toBe('SESSION-B');
    expect(j3.cdr.id).toBe('CDR-B');
    expect(j3.cdrSource).toBe('push');

    const starts = ctx.store.query({ direction: 'outbound', operation: 'command.START_SESSION' });
    const stops = ctx.store.query({ direction: 'outbound', operation: 'command.STOP_SESSION' });
    expect(starts).toHaveLength(2);
    expect(stops).toHaveLength(2);
    expect(stops[1].seq).toBeGreaterThan(starts[1].seq);
  });
});
