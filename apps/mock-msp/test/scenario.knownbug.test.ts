// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The shipped known-bugs/patch-omits-valid-blocks-token fixture, driven end to
// end against a stub CPO that reproduces Citrine's TokensMapper behaviour.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { loadScenario } from '../src/control/scenario.js';
import { makeServer, startStubCpo, ocpiEnvelope, type StubCpo } from './harness.js';

const CONTROL = { 'content-type': 'application/json' };
const FIXTURE = fileURLToPath(
  new URL('../scenarios/known-bugs/patch-omits-valid-blocks-token.json', import.meta.url),
);

describe('known bug: a PATCH omitting `valid` blocks the token', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;
  // The stub's token table. PATCH merges like Citrine's TokensMapper does: an
  // absent `valid` is mapped to false and applied unconditionally.
  let tokens: Map<string, Record<string, unknown>>;

  beforeEach(async () => {
    tokens = new Map();
    cpo = await startStubCpo((req) => {
      const m = req.path.match(/^\/ocpi\/2\.2\.1\/tokens\/[^/]+\/[^/]+\/([^/]+)$/);
      if (!m) return undefined;
      const uid = m[1];
      const body = (req.body ?? {}) as Record<string, unknown>;
      if (req.method === 'PUT') {
        tokens.set(uid, body);
        return { json: ocpiEnvelope(undefined) };
      }
      if (req.method === 'PATCH') {
        const existing = tokens.get(uid) ?? {};
        tokens.set(uid, { ...existing, ...body, valid: body.valid ?? false });
        return { json: ocpiEnvelope(undefined) };
      }
      if (req.method === 'GET') {
        const stored = tokens.get(uid);
        if (!stored) return { status: 404, json: { status_code: 2004 } };
        return { json: ocpiEnvelope(stored) };
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

  function control(url: string, body: unknown = {}) {
    return app.inject({ method: 'POST', url, headers: CONTROL, payload: JSON.stringify(body) });
  }

  it('fixture loads, applies over /_mock/scenario, and evaluate passes after the repro traffic', async () => {
    const scn = loadScenario(FIXTURE);
    expect(scn.name).toBe('patch-omits-valid-blocks-token');
    expect(scn.expect).toEqual([
      expect.objectContaining({ on: 'tokens.patch', assert: 'response.httpStatus == 200' }),
    ]);

    const applied = await control('/_mock/scenario', scn);
    expect(applied.statusCode).toBe(200);
    expect(applied.json().applied).toBe('patch-omits-valid-blocks-token');
    expect(applied.json().runtime.authorize.default).toBe('ALLOWED');
    expect(applied.json().runtime.strictInbound).toBe(false);

    // Repro, exactly as the fixture's detail describes it.
    const pushed = await control('/_mock/emit/token');
    expect(pushed.statusCode).toBe(200);
    const uid = pushed.json().tokenUid as string;
    expect(tokens.get(uid)?.valid).toBe(true);

    const patched = await control('/_mock/emit/token-patch', { patch: { language: 'en' } });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().uid).toBe(uid);
    expect(patched.json().sent).toEqual({ language: 'en' });
    expect(patched.json().expected.valid).toBe(true);
    // The legal PATCH was accepted by the CPO...
    const patchEx = ctx.store.query({ direction: 'outbound', operation: 'tokens.patch' });
    expect(patchEx).toHaveLength(1);
    expect(patchEx[0].response.httpStatus).toBe(200);
    expect(patchEx[0].response.ocpiStatusCode).toBe(1000);
    expect(patchEx[0].validation.ok).toBe(true);
    expect((patchEx[0].request.body as Record<string, unknown>).valid).toBeUndefined();
    // ...and the CPO silently blocked the token.
    expect(tokens.get(uid)?.valid).toBe(false);
    expect(tokens.get(uid)?.language).toBe('en');

    const verified = await control('/_mock/verify/token');
    expect(verified.statusCode).toBe(200);
    expect(verified.json().verified).toBe(false);
    const drift = verified.json().drift as Array<Record<string, unknown>>;
    expect(drift).toHaveLength(1);
    expect(drift[0]).toMatchObject({
      field: 'valid',
      severity: 'error',
      expected: true,
      served: false,
      isKnownCitrineBug: true,
    });
    const finding = ctx.store.findings.find((f) => f.isKnownCitrineBug);
    expect(finding).toBeDefined();
    expect(finding!.module).toBe('tokens');
    expect(finding!.severity).toBe('error');
    expect(finding!.detail).toContain("drift on 'valid'");
    expect(finding!.detail).toContain('TokensMapper');
    expect(finding!.seq).toBe(
      ctx.store.query({ direction: 'outbound', operation: 'tokens.get' }).at(-1)!.seq,
    );

    const report = await control('/_mock/scenarios/patch-omits-valid-blocks-token/evaluate');
    expect(report.statusCode).toBe(200);
    expect(report.json()).toEqual({
      scenario: 'patch-omits-valid-blocks-token',
      passed: true,
      total: 1,
      failures: 0,
      results: [
        {
          on: 'tokens.patch',
          assert: 'response.httpStatus == 200',
          detail: scn.expect![0].detail,
          pass: true,
          observed: 'response.httpStatus=200',
        },
      ],
    });
  });

  it('evaluate fails before the PATCH has been sent (nothing matches tokens.patch)', async () => {
    await control('/_mock/scenario', loadScenario(FIXTURE));
    await control('/_mock/emit/token');
    const report = await control('/_mock/scenarios/patch-omits-valid-blocks-token/evaluate');
    expect(report.json().passed).toBe(false);
    expect(report.json().results[0].observed).toBe('response.httpStatus=undefined');
  });

  it('a faithful CPO (valid untouched by the PATCH) shows no drift and no known-bug finding', async () => {
    await control('/_mock/scenario', loadScenario(FIXTURE));
    const uid = (await control('/_mock/emit/token')).json().tokenUid as string;
    await control('/_mock/emit/token-patch', { patch: { language: 'en' } });
    // Undo the stub's bug for this one readback.
    tokens.set(uid, { ...tokens.get(uid)!, valid: true });
    const verified = await control('/_mock/verify/token');
    expect(verified.json().verified).toBe(true);
    expect(verified.json().drift).toEqual([]);
    expect(ctx.store.findings.some((f) => f.isKnownCitrineBug)).toBe(false);
    const report = await control('/_mock/scenarios/patch-omits-valid-blocks-token/evaluate');
    expect(report.json().passed).toBe(true);
  });
});
