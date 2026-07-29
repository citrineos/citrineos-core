// ============================================================================
// FILE: apps/mock-msp/test/modules.functional.test.ts
// (3) Two functional RECEIVER/SENDER modules validate a good payload and detect
//     a bad one. The mock reuses the SAME ocpi-base Zod schema Citrine parses
//     with, so validation.ok===false + an error Finding IS a detected contract
//     drift. Also proves auth + routing-header enforcement, and the strictInbound
//     scenario option that turns detection into an outright 2001 rejection.
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext, Scenario } from '../src/core/types.js';
import { applyScenario } from '../src/control/scenario.js';
import { makeServer, functionalHeaders, validSession, validLocationReferences } from './harness.js';

describe('functional module validation (record + detect drift)', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  // ---- Module A: Sessions (RECEIVER, full Session body) --------------------

  it('sessions PUT: a valid Session validates, is recorded, and is stored', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-1',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validSession()),
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(1000);
    expect(res.json().data).toBeUndefined(); // empty envelope

    const ex = ctx.store.query({ direction: 'inbound', operation: 'sessions.put' }).at(-1)!;
    expect(ex.validation.ok).toBe(true);
    expect(ex.findings.filter((f) => f.severity === 'error')).toHaveLength(0);
    expect(ctx.store.domain.sessions.get('US/TST/SESSION-1')).toBeDefined();
  });

  it('sessions PUT: an invalid Session is detected (validation.ok=false + error Finding)', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-2',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify({ id: 'SESSION-2' }), // missing every required field
    });

    // Default (record-and-accept): still 200, but the drift is flagged.
    expect(res.statusCode).toBe(200);
    const ex = ctx.store.query({ direction: 'inbound', operation: 'sessions.put' }).at(-1)!;
    expect(ex.validation.ok).toBe(false);
    expect(ex.findings.some((f) => f.severity === 'error' && f.kind === 'body')).toBe(true);
  });

  // ---- Module B: Tokens (SENDER, optional LocationReferences body) ---------

  it('tokens authorize: a valid LocationReferences validates; reply carries the 3 required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/tokens/RFID-TOKEN-1/authorize?type=RFID',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validLocationReferences()),
    });

    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    // Citrine's Zod REQUIRES allowed + full token + authorization_reference.
    expect(data.allowed).toBe('ALLOWED');
    expect(data.token).toBeDefined();
    expect(data.token.uid).toBe('RFID-TOKEN-1');
    expect(typeof data.authorization_reference).toBe('string');

    const ex = ctx.store.query({ direction: 'inbound', operation: 'tokens.authorize' }).at(-1)!;
    expect(ex.validation.ok).toBe(true);
    expect(ex.findings.filter((f) => f.severity === 'error')).toHaveLength(0);
  });

  it('tokens authorize: an invalid LocationReferences body is detected', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/tokens/RFID-TOKEN-2/authorize?type=RFID',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify({ location_id: 12345 }), // wrong type + missing evse_uids
    });

    expect(res.statusCode).toBe(200); // still answers ALLOWED baseline
    const ex = ctx.store.query({ direction: 'inbound', operation: 'tokens.authorize' }).at(-1)!;
    expect(ex.validation.ok).toBe(false);
    expect(ex.findings.some((f) => f.severity === 'error' && f.kind === 'body')).toBe(true);
  });

  // ---- Auth + routing-header enforcement ----------------------------------

  it('rejects a functional call with a bad token (401 / 2002)', async () => {
    const headers = functionalHeaders(ctx.config, 'WRONG-TOKEN');
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-9',
      headers,
      payload: JSON.stringify(validSession({ id: 'SESSION-9' })),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().status_code).toBe(2002);
  });

  it('rejects a functional call with wrong routing headers (401)', async () => {
    const headers = functionalHeaders(ctx.config);
    headers['ocpi-from-party-id'] = 'BAD'; // CPO party must be S44
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-8',
      headers,
      payload: JSON.stringify(validSession({ id: 'SESSION-8' })),
    });
    expect(res.statusCode).toBe(401);
    const ex = ctx.store.query({ direction: 'inbound', operation: 'sessions.put' }).at(-1)!;
    expect(ex.findings.some((f) => f.kind === 'header' && f.severity === 'error')).toBe(true);
  });

  // ---- strictInbound scenario: detection becomes rejection ------------------

  it('strictInbound scenario rejects an invalid body outright with 2001', async () => {
    const scn: Scenario = {
      name: 'strict',
      registration: 'preregistered',
      strictInbound: true,
    };
    applyScenario(ctx, scn);
    // preregistered installs the config bootstrap tokens; present that token.
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-7',
      headers: functionalHeaders(ctx.config, ctx.config.bootstrapTokenWeAccept),
      payload: JSON.stringify({ id: 'SESSION-7' }), // invalid
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(2001); // ClientInvalidOrMissingParameters
    // ... and the invalid body was NOT stored.
    expect(ctx.store.domain.sessions.get('US/TST/SESSION-7')).toBeUndefined();
  });

  it('strictInbound scenario still accepts a valid body (1000)', async () => {
    applyScenario(ctx, { name: 'strict', registration: 'preregistered', strictInbound: true });
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-6',
      headers: functionalHeaders(ctx.config, ctx.config.bootstrapTokenWeAccept),
      payload: JSON.stringify(validSession({ id: 'SESSION-6' })),
    });
    expect(res.json().status_code).toBe(1000);
    expect(ctx.store.domain.sessions.get('US/TST/SESSION-6')).toBeDefined();
  });
});
