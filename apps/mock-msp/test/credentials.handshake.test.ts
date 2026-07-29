// ============================================================================
// FILE: apps/mock-msp/test/credentials.handshake.test.ts
// (1) Credentials handshake happy path, exercised in-process. The CPO (Citrine)
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
