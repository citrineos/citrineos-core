// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Inbound credentials beyond the initial POST handshake: PUT (re-register),
// DELETE (unregister + token rotation) and the GET CredentialsDTO shape.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { CredentialsDTOSchema } from '../src/ocpi/barrel.js';
import {
  makeServer,
  startStubCpo,
  authHeader,
  registrationHeaders,
  functionalHeaders,
  cpoCredentials,
  cpoVersionsPayloads,
  validSession,
  SEED_TOKEN_WE_ACCEPT,
  SEED_TOKEN_WE_PRESENT,
  type StubCpo,
} from './harness.js';

describe('inbound credentials: PUT / DELETE / GET', () => {
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
    // Seed state is already 'registered' with the bootstrap tokens.
    ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  function putSession(id: string, token: string) {
    return app.inject({
      method: 'PUT',
      url: `/ocpi/2.2.1/emsp/sessions/US/TST/${id}`,
      headers: functionalHeaders(ctx.config, token),
      payload: JSON.stringify(validSession({ id })),
    });
  }

  it('PUT re-registers while already registered: adopts the CPO token, rediscovers, rotates TOKEN_C', async () => {
    const reg = ctx.store.domain.registration;
    expect(reg.status).toBe('registered');
    expect(reg.cpoEndpoints).toEqual([]);

    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/credentials',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
      payload: JSON.stringify(cpoCredentials(`${cpo.baseUrl}/versions`, 'CPO-ROTATED-TOKEN')),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status_code).toBe(1000);
    const tokenC: string = body.data.token;
    expect(tokenC).not.toBe(SEED_TOKEN_WE_ACCEPT);
    expect(tokenC.length).toBeLessThanOrEqual(64);

    expect(reg.status).toBe('registered');
    expect(reg.tokenWePresent).toBe('CPO-ROTATED-TOKEN');
    expect(reg.tokenWeAccept).toBe(tokenC);
    expect(reg.cpoVersionsUrl).toBe(`${cpo.baseUrl}/versions`);
    expect(reg.cpoCredentialsUrl).toBe(`${cpo.baseUrl}/2.2.1/credentials`);
    expect(reg.cpoEndpoints.map((e) => e.identifier)).toEqual([
      'credentials',
      'locations',
      'commands',
    ]);

    // Discovery presented the token the CPO just handed us, not the old one.
    expect(cpo.requests.map((r) => r.path)).toEqual(['/ocpi/versions', '/ocpi/versions/2.2.1']);
    for (const r of cpo.requests) {
      expect(r.headers.authorization).toBe(authHeader('CPO-ROTATED-TOKEN'));
    }

    // The fresh TOKEN_C is what authenticates the CPO from now on.
    expect((await putSession('PUT-OLD', SEED_TOKEN_WE_ACCEPT)).statusCode).toBe(401);
    expect((await putSession('PUT-NEW', tokenC)).statusCode).toBe(200);
  });

  it('PUT with an invalid CredentialsDTO answers 2001 and leaves the registration untouched', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/credentials',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
      payload: JSON.stringify({ token: 'no-url-no-roles' }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(2001);
    const reg = ctx.store.domain.registration;
    expect(reg.tokenWeAccept).toBe(SEED_TOKEN_WE_ACCEPT);
    expect(reg.tokenWePresent).toBe(SEED_TOKEN_WE_PRESENT);
    expect(cpo.requests).toHaveLength(0);
    const ex = ctx.store.query({ direction: 'inbound', operation: 'credentials.put' }).at(-1)!;
    expect(ex.validation.ok).toBe(false);
  });

  it('DELETE wipes the registration, answers an empty envelope, and rotates tokenWeAccept', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/ocpi/2.2.1/credentials',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(1000);
    expect(res.json().data).toBeUndefined();

    const reg = ctx.store.domain.registration;
    expect(reg.status).toBe('unregistered');
    expect(reg.tokenWePresent).toBe('');
    expect(reg.tokenA).toBeUndefined();
    expect(reg.cpoEndpoints).toEqual([]);
    expect(reg.cpoCredentialsUrl).toBeUndefined();
    expect(reg.cpoVersionsUrl).toBeUndefined();
    expect(reg.registeredAt).toBeUndefined();
    expect(reg.tokenWeAccept).not.toBe(SEED_TOKEN_WE_ACCEPT);
    expect(reg.tokenWeAccept.length).toBeGreaterThan(0);

    const ex = ctx.store.query({ direction: 'inbound', operation: 'credentials.delete' }).at(-1)!;
    expect(ex.response.httpStatus).toBe(200);
    expect(ex.findings.filter((f) => f.severity === 'error')).toHaveLength(0);

    // The old TOKEN_C is dead; only the rotated one gets through.
    const stale = await putSession('DEL-OLD', SEED_TOKEN_WE_ACCEPT);
    expect(stale.statusCode).toBe(401);
    expect(stale.json().status_code).toBe(2002);
    expect((await putSession('DEL-NEW', reg.tokenWeAccept)).statusCode).toBe(200);
  });

  it('GET returns our CredentialsDTO: token we accept, versions url, single EMSP role', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ocpi/2.2.1/credentials',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data;
    expect(CredentialsDTOSchema.safeParse(data).success).toBe(true);
    expect(data.token).toBe(SEED_TOKEN_WE_ACCEPT);
    expect(data.url).toBe(`${ctx.config.publicBaseUrl}/versions`);
    expect(data.roles).toHaveLength(1);
    expect(data.roles[0]).toMatchObject({
      role: 'EMSP',
      party_id: ctx.config.partyId,
      country_code: ctx.config.countryCode,
      business_details: { name: ctx.identity.business_details.name },
    });
    // Registration endpoints are not subject to the routing-header check.
    const ex = ctx.store.query({ direction: 'inbound', operation: 'credentials.get' }).at(-1)!;
    expect(ex.findings).toHaveLength(0);
  });
});
