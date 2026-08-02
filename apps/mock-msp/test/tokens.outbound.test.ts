// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/test/tokens.outbound.test.ts
// Outbound token lifecycle against a stub CPO: PUSH (PUT) -> BLOCK (PATCH,
// default {valid:false}) -> VERIFY (GET + field-level drift vs our stored
// copy). Includes the known-Citrine-bug detector: a PATCH that omits `valid`
// coming back as valid:false is flagged isKnownCitrineBug (TokensMapper maps
// an absent `valid` to status Invalid).
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { makeServer, startStubCpo, ocpiEnvelope, type StubCpo } from './harness.js';

describe('outbound tokens: push -> patch -> verify', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;
  // What the stub serves on GET .../tokens/US/TST/:uid — tests point this at the
  // mock's own expected copy (faithful CPO) or a mutated clone (drifting CPO).
  let served: Record<string, unknown> | undefined;

  beforeEach(async () => {
    served = undefined;
    cpo = await startStubCpo((req) => {
      if (req.path.startsWith('/ocpi/2.2.1/tokens/')) {
        if (req.method === 'PUT' || req.method === 'PATCH')
          return { json: ocpiEnvelope(undefined) };
        if (req.method === 'GET') {
          if (!served) return { status: 404, json: { status_code: 2004 } };
          return { json: ocpiEnvelope(served) };
        }
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

  async function pushOne(): Promise<string> {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/emit/token',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect(res.statusCode).toBe(200);
    return res.json().tokenUid as string;
  }

  it('409s the patch when no token was pushed yet', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/emit/token-patch',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('no_token');
  });

  it('default patch blocks the newest pushed token with {valid:false} + stamped last_updated', async () => {
    const uid = await pushOne();
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/emit/token-patch',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.patched).toBe(true);
    expect(body.uid).toBe(uid);
    expect(body.expected.valid).toBe(false); // local expected copy updated

    const patch = cpo.requests.find((r) => r.method === 'PATCH');
    expect(patch).toBeDefined();
    expect(patch!.path).toContain(`/tokens/US/TST/${uid}`);
    const sent = patch!.body as Record<string, unknown>;
    expect(sent.valid).toBe(false);
    expect(typeof sent.last_updated).toBe('string'); // ISO stamp, on the wire as a string
    // Functional routing headers present (from=us, to=CPO).
    expect(patch!.headers['ocpi-from-party-id']).toBe('TST');
    expect(patch!.headers['ocpi-to-party-id']).toBe('S44');

    const exchanges = ctx.store.query({ direction: 'outbound', operation: 'tokens.patch' });
    expect(exchanges.length).toBe(1);
    expect(exchanges[0].validation.ok).toBe(true);
  });

  it('omitLastUpdated sends no last_updated (the known-bug trigger shape)', async () => {
    await pushOne();
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/emit/token-patch',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ patch: { language: 'en' }, omitLastUpdated: true }),
    });
    expect(res.statusCode).toBe(200);
    const patch = cpo.requests.find((r) => r.method === 'PATCH');
    const sent = patch!.body as Record<string, unknown>;
    expect(sent.language).toBe('en');
    expect(sent.last_updated).toBeUndefined();
  });

  it('verify: faithful readback -> verified:true, zero drift, zero findings', async () => {
    const uid = await pushOne();
    // Faithful CPO: serve exactly what the mock believes the token is.
    served = JSON.parse(JSON.stringify(ctx.store.domain.tokens.get(uid))) as Record<
      string,
      unknown
    >;
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/verify/token',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.uid).toBe(uid);
    expect(body.verified).toBe(true);
    expect(body.drift).toEqual([]);
    expect(ctx.store.findings.filter((f) => f.severity === 'error').length).toBe(0);
  });

  it('verify: a mutated readback -> verified:false + error drift + finding', async () => {
    const uid = await pushOne();
    served = JSON.parse(JSON.stringify(ctx.store.domain.tokens.get(uid))) as Record<
      string,
      unknown
    >;
    served.issuer = 'EVIL-ISSUER';
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/verify/token',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    const body = res.json();
    expect(body.verified).toBe(false);
    const issuerDrift = (body.drift as Array<Record<string, unknown>>).find(
      (d) => d.field === 'issuer',
    );
    expect(issuerDrift?.severity).toBe('error');
    expect(issuerDrift?.served).toBe('EVIL-ISSUER');
    const finding = ctx.store.findings.find((f) => f.detail.includes("drift on 'issuer'"));
    expect(finding?.severity).toBe('error');
  });

  it('verify flags the Citrine PATCH-omits-valid bug: served valid:false is isKnownCitrineBug', async () => {
    const uid = await pushOne();
    // A benign patch that never touches `valid` — expected stays valid:true.
    await app.inject({
      method: 'POST',
      url: '/_mock/emit/token-patch',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ patch: { language: 'en' } }),
    });
    // Citrine's mapper bug: the readback now serves valid:false anyway.
    served = JSON.parse(JSON.stringify(ctx.store.domain.tokens.get(uid))) as Record<
      string,
      unknown
    >;
    served.valid = false;

    const res = await app.inject({
      method: 'POST',
      url: '/_mock/verify/token',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    const body = res.json();
    expect(body.verified).toBe(false);
    const validDrift = (body.drift as Array<Record<string, unknown>>).find(
      (d) => d.field === 'valid',
    );
    expect(validDrift?.isKnownCitrineBug).toBe(true);
    const finding = ctx.store.findings.find((f) => f.isKnownCitrineBug);
    expect(finding).toBeDefined();
    expect(finding!.detail).toContain('TokensMapper');
  });
});
