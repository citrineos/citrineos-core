// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Credentials handshake happy path, exercised in-process. The CPO (Citrine)
//     POSTs its CredentialsDTO to our /ocpi/2.2.1/credentials; the mock stores
//     the CPO's token, calls the (stub) CPO back to discover its version
//     endpoints, mints a fresh TOKEN_C, marks itself registered, and answers with
//     its own CredentialsDTO. No live Citrine — a tiny stub CPO serves versions.
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import {
  makeServer,
  startStubCpo,
  registrationHeaders,
  cpoCredentials,
  cpoVersionsPayloads,
  ocpiEnvelope,
  SEED_TOKEN_WE_ACCEPT,
  type StubCpo,
} from './harness.js';

describe('credentials handshake (CPO-initiated, in-process)', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;

  beforeEach(async () => {
    cpo = await startStubCpo((req) => {
      const payloads = cpoVersionsPayloads(cpo.baseUrl);
      if (req.method === 'GET' && req.path === '/ocpi/versions') return { json: payloads.list };
      if (req.method === 'GET' && req.path === '/ocpi/versions/2.2.1')
        return { json: payloads.details };
      return undefined;
    });
    ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    // Start unregistered so the initial POST is accepted (not rejected as 2000).
    ctx.store.domain.registration.status = 'unregistered';
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  it('accepts the CPO credentials POST, mints TOKEN_C, and stores registration', async () => {
    const cpoToken = 'CPO-ISSUED-TOKEN-FOR-US';
    const res = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/credentials',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
      payload: JSON.stringify(cpoCredentials(`${cpo.baseUrl}/versions`, cpoToken)),
    });

    // ---- wire response: a valid CredentialsResponse envelope -------------
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status_code).toBe(1000);
    expect(body.data).toBeDefined();
    const tokenC: string = body.data.token;
    expect(typeof tokenC).toBe('string');
    expect(tokenC.length).toBeGreaterThan(0);
    expect(tokenC.length).toBeLessThanOrEqual(64); // credentials token max 64
    expect(body.data.roles[0].role).toBe('EMSP');
    expect(body.data.roles[0].party_id).toBe('TST');
    expect(body.data.url).toContain('/versions');

    // ---- registration state persisted -----------------------------------
    const reg = ctx.store.domain.registration;
    expect(reg.status).toBe('registered');
    expect(reg.tokenWePresent).toBe(cpoToken); // token we now present back to the CPO
    expect(reg.tokenWeAccept).toBe(tokenC); // TOKEN_C the CPO must present to us
    expect(reg.registeredAt).toBeTruthy();

    // ---- the mock discovered the CPO's endpoints via the outbound calls --
    expect(reg.cpoEndpoints.length).toBeGreaterThan(0);
    expect(reg.cpoCredentialsUrl).toBe(`${cpo.baseUrl}/2.2.1/credentials`);
    expect(cpo.requests.map((r) => r.path)).toContain('/ocpi/versions');
    expect(cpo.requests.map((r) => r.path)).toContain('/ocpi/versions/2.2.1');

    // ---- the outbound discovery calls were recorded as Exchanges --------
    const outbound = ctx.store.query({ direction: 'outbound', module: 'versions' });
    expect(outbound.length).toBe(2);
    expect(outbound.every((e) => e.validation.ok !== false)).toBe(true);
  });

  it('rejects a second registration POST once already registered (2000)', async () => {
    ctx.store.domain.registration.status = 'registered';
    const res = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/credentials',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
      payload: JSON.stringify(cpoCredentials(`${cpo.baseUrl}/versions`, 'X')),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(2000); // ClientGenericError: already registered
  });

  it('GET /ocpi/2.2.1/credentials returns our current CredentialsDTO', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ocpi/2.2.1/credentials',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status_code).toBe(1000);
    expect(body.data.roles[0].role).toBe('EMSP');
    expect(body.data.token).toBe(SEED_TOKEN_WE_ACCEPT);
  });

  it('rejects an unauthenticated credentials POST with 401 / 2002', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/credentials',
      headers: { 'content-type': 'application/json' }, // no Authorization
      payload: JSON.stringify(cpoCredentials(`${cpo.baseUrl}/versions`, 'X')),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().status_code).toBe(2002); // ClientNotEnoughInformation
  });
});

// ============================================================================
// Credentials ROTATION: rotateCredentials() PUTs a fresh token to the CPO,
//     adopts the CPO's newly-minted server token (only after a schema-valid
//     response), and probes that the OLD outbound token now 401s. The
//     /_mock/reregister route composes discovery + rotation.
// ============================================================================
describe('credentials rotation (rotateCredentials + /_mock/reregister)', () => {
  const NEW_SERVER_TOKEN = 'CPO-FRESH-SERVER-TOKEN';
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;
  // Per-test knobs for the stub's behavior:
  let putReplyToken: string; // token the stub's credentials PUT hands back
  let staleProbeStatus: number; // status for the GET credentials (stale-token) probe
  let putStatus: number;

  beforeEach(async () => {
    putReplyToken = NEW_SERVER_TOKEN;
    staleProbeStatus = 401;
    putStatus = 200;
    cpo = await startStubCpo((req) => {
      const payloads = cpoVersionsPayloads(cpo.baseUrl);
      if (req.method === 'GET' && req.path === '/ocpi/versions') return { json: payloads.list };
      if (req.method === 'GET' && req.path === '/ocpi/versions/2.2.1')
        return { json: payloads.details };
      if (req.method === 'PUT' && req.path === '/ocpi/2.2.1/credentials') {
        if (putStatus !== 200) return { status: putStatus, json: { error: 'stub_put_rejected' } };
        return {
          json: ocpiEnvelope(cpoCredentials(`${cpo.baseUrl}/versions`, putReplyToken)),
        };
      }
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/credentials') {
        if (staleProbeStatus === 200) {
          return { json: ocpiEnvelope(cpoCredentials(`${cpo.baseUrl}/versions`, putReplyToken)) };
        }
        return { status: staleProbeStatus, json: { status_code: 2002 } };
      }
      return undefined;
    });
    ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    const reg = ctx.store.domain.registration;
    reg.status = 'registered';
    reg.cpoCredentialsUrl = `${cpo.baseUrl}/2.2.1/credentials`;
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  it('rotates: PUTs a fresh token, adopts the CPO token, stale probe 401s warn-free', async () => {
    const oldPresent = ctx.store.domain.registration.tokenWePresent;
    const oldAccept = ctx.store.domain.registration.tokenWeAccept;

    const reg = await ctx.client.rotateCredentials();

    const put = cpo.requests.find((r) => r.method === 'PUT');
    expect(put).toBeDefined();
    const sentToken = (put!.body as { token: string }).token;
    expect(sentToken).not.toBe(oldAccept); // fresh token minted for the CPO
    expect(reg.tokenWeAccept).toBe(sentToken);
    expect(reg.tokenWePresent).toBe(NEW_SERVER_TOKEN);
    expect(reg.tokenWePresent).not.toBe(oldPresent);

    // Stale probe: recorded, 401, and NO warn finding (expectHttpStatus suppressed it).
    const probes = ctx.store.query({
      direction: 'outbound',
      operation: 'credentials.stale-token-probe',
    });
    expect(probes.length).toBe(1);
    expect(probes[0].response.httpStatus).toBe(401);
    expect(probes[0].findings.length).toBe(0);
    // No error findings at all on a clean rotation.
    expect(ctx.store.findings.filter((f) => f.severity === 'error').length).toBe(0);
  });

  it('keeps the working registration when the PUT fails (swap only after valid response)', async () => {
    putStatus = 500;
    const oldPresent = ctx.store.domain.registration.tokenWePresent;
    const oldAccept = ctx.store.domain.registration.tokenWeAccept;
    await expect(ctx.client.rotateCredentials()).rejects.toThrow(/credentials PUT/);
    expect(ctx.store.domain.registration.tokenWePresent).toBe(oldPresent);
    expect(ctx.store.domain.registration.tokenWeAccept).toBe(oldAccept);
  });

  it('flags a CPO that does not rotate its server token', async () => {
    putReplyToken = ctx.store.domain.registration.tokenWePresent; // echo the old token back
    await ctx.client.rotateCredentials();
    const finding = ctx.store.findings.find((f) => f.detail.includes('did not rotate'));
    expect(finding?.severity).toBe('error');
  });

  it('flags a CPO that still accepts the old token after rotation', async () => {
    staleProbeStatus = 200;
    await ctx.client.rotateCredentials();
    const finding = ctx.store.findings.find((f) => f.detail.includes('old token still accepted'));
    expect(finding?.severity).toBe('error');
    expect(finding?.kind).toBe('auth');
  });

  it('POST /_mock/reregister rotates and reports; {discoverOnly:true} does not PUT', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/reregister',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.rotation.rotated).toBe(true);
    expect(body.rotation.cpoTokenChanged).toBe(true);
    expect(body.rotation.staleTokenProbe.httpStatus).toBe(401);
    expect(body.rotation.staleTokenProbe.rejected).toBe(true);
    expect(body.registration.status).toBe('registered');

    const putsBefore = cpo.requests.filter((r) => r.method === 'PUT').length;
    const res2 = await app.inject({
      method: 'POST',
      url: '/_mock/reregister',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ discoverOnly: true }),
    });
    expect(res2.statusCode).toBe(200);
    expect(res2.json().rotation).toBeUndefined();
    expect(cpo.requests.filter((r) => r.method === 'PUT').length).toBe(putsBefore);
  });
});
