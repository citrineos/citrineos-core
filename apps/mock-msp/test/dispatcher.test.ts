// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The dispatcher + conformance pipeline around every OCPI route: malformed
// bodies, message-id headers, header echo, routing rejection, strictInbound,
// the baseline self-check and the handler-throw safety net.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { applyScenario } from '../src/control/scenario.js';
import {
  makeServer,
  functionalHeaders,
  registrationHeaders,
  validSession,
  validLocationReferences,
} from './harness.js';

describe('dispatcher pipeline', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  function putSession(id: string, headers: Record<string, string>, payload?: string) {
    return app.inject({
      method: 'PUT',
      url: `/ocpi/2.2.1/emsp/sessions/US/TST/${id}`,
      headers,
      payload: payload ?? JSON.stringify(validSession({ id })),
    });
  }

  function lastSessionsPut() {
    return ctx.store.query({ direction: 'inbound', operation: 'sessions.put' }).at(-1)!;
  }

  it('malformed JSON is not 400ed by fastify: rawBody is kept and a body finding recorded', async () => {
    const raw = '{"id": "BAD-JSON", "kwh": ';
    const res = await putSession('BAD-JSON', functionalHeaders(ctx.config), raw);
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(1000);

    const ex = lastSessionsPut();
    expect(ex.request.rawBody).toBe(raw);
    expect(ex.request.body).toBeUndefined();
    const finding = ex.findings.find((f) => f.kind === 'body');
    expect(finding?.severity).toBe('error');
    expect(finding?.detail).toContain('expected a JSON body');
    expect(ctx.store.findings).toContain(finding);
  });

  it('missing X-Request-ID / X-Correlation-ID are warn header findings; the request is still handled', async () => {
    const headers = functionalHeaders(ctx.config);
    delete headers['x-request-id'];
    delete headers['x-correlation-id'];
    const res = await putSession('NO-IDS', headers);
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(1000);
    expect(ctx.store.domain.sessions.get('US/TST/NO-IDS')).toBeDefined();

    const ex = lastSessionsPut();
    const headerFindings = ex.findings.filter((f) => f.kind === 'header');
    expect(headerFindings).toHaveLength(2);
    expect(headerFindings.every((f) => f.severity === 'warn')).toBe(true);
    expect(headerFindings.map((f) => f.detail).join(' ')).toMatch(/X-Request-ID.*X-Correlation-ID/);
    expect(ex.validation.ok).toBe(true);

    // Fresh ids are minted on the reply when the caller sent none.
    expect(res.headers['x-request-id']).toEqual(expect.any(String));
    expect(res.headers['x-correlation-id']).toEqual(expect.any(String));
    expect(res.headers['x-request-id']).not.toBe('');
  });

  it('echoes X-Request-ID / X-Correlation-ID and propagates the OCPI routing headers as sent', async () => {
    const headers = functionalHeaders(ctx.config);
    const res = await putSession('ECHO', headers);
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-request-id']).toBe(headers['x-request-id']);
    expect(res.headers['x-correlation-id']).toBe(headers['x-correlation-id']);
    // Propagated, not swapped: from stays the CPO, to stays us.
    expect(res.headers['ocpi-from-country-code']).toBe(ctx.config.cpoCountryCode);
    expect(res.headers['ocpi-from-party-id']).toBe(ctx.config.cpoPartyId);
    expect(res.headers['ocpi-to-country-code']).toBe(ctx.config.countryCode);
    expect(res.headers['ocpi-to-party-id']).toBe(ctx.config.partyId);

    const ex = lastSessionsPut();
    expect(ex.request.ocpi.requestId).toBe(headers['x-request-id']);
    expect(ex.request.ocpi.from).toEqual({ cc: 'US', party: 'S44' });
    expect(ex.request.ocpi.to).toEqual({ cc: 'US', party: 'TST' });
    expect(ex.response.headers['X-Request-ID']).toBe(headers['x-request-id']);
    expect(ex.findings).toHaveLength(0);
  });

  it('a routing header mismatch is a 401 + header finding and the handler never runs', async () => {
    const headers = functionalHeaders(ctx.config);
    delete headers['ocpi-to-party-id'];
    const res = await putSession('BAD-ROUTE', headers);
    expect(res.statusCode).toBe(401);
    expect(res.json().status_code).toBe(2002);

    const ex = lastSessionsPut();
    expect(ex.response.httpStatus).toBe(401);
    expect(ex.findings.some((f) => f.kind === 'header' && f.severity === 'error')).toBe(true);
    expect(ctx.store.domain.sessions.has('US/TST/BAD-ROUTE')).toBe(false);
  });

  it('registration endpoints are exempt from the routing-header check', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(1000);
    const ex = ctx.store.query({ direction: 'inbound', operation: 'versions.list' }).at(-1)!;
    expect(ex.findings).toHaveLength(0);
    expect(res.headers['ocpi-from-party-id']).toBeUndefined();
  });

  it('strictInbound runtime rejects a schema-invalid body with 2001 and stores nothing', async () => {
    applyScenario(ctx, { name: 'strict', registration: 'preregistered', strictInbound: true });
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/locations/US/TST/LOC-X',
      headers: functionalHeaders(ctx.config, ctx.config.bootstrapTokenWeAccept),
      payload: JSON.stringify({ id: 'LOC-X' }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(2001);
    expect(ctx.store.domain.locations.has('US/TST/LOC-X')).toBe(false);

    const ex = ctx.store
      .query({ direction: 'inbound', operation: 'locations.put.location' })
      .at(-1)!;
    expect(ex.validation.ok).toBe(false);
    expect(ex.response.ocpiStatusCode).toBe(2001);
    expect(ex.findings.some((f) => f.kind === 'body' && f.severity === 'error')).toBe(true);
  });

  it('the baseline reply passes its own responseSchema self-check on a valid request', async () => {
    await putSession('SELF-1', functionalHeaders(ctx.config));
    const authorize = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/tokens/SELF-RFID/authorize?type=RFID',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validLocationReferences()),
    });
    expect(authorize.json().status_code).toBe(1000);

    const all = ctx.store.query({ direction: 'inbound' });
    expect(all).toHaveLength(2);
    for (const ex of all) {
      expect(ex.findings.filter((f) => f.detail.includes('mock bug'))).toHaveLength(0);
      expect(ex.findings).toHaveLength(0);
    }
    expect(ctx.store.findings).toHaveLength(0);
  });

  it('a throwing handler is caught: 3000 envelope, status finding, exchange still recorded', async () => {
    // Handlers are pure store writers, so a poisoned domain map is the way to make one throw.
    const poisoned = new Map<string, unknown>();
    poisoned.set = () => {
      throw new Error('boom');
    };
    ctx.store.domain.sessions = poisoned;

    const res = await putSession('THROW', functionalHeaders(ctx.config));
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(3000);
    expect(res.json().status_message).toBe('Internal mock error');

    const ex = lastSessionsPut();
    expect(ex.response.ocpiStatusCode).toBe(3000);
    const finding = ex.findings.find((f) => f.kind === 'status');
    expect(finding?.severity).toBe('error');
    expect(finding?.detail).toContain('Handler threw');
    expect(finding?.detail).toContain('boom');
    // The throw happened after validation, so the request itself was still judged valid.
    expect(ex.validation.ok).toBe(true);
  });
});
