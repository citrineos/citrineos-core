// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Every FaultAction kind + scope guard, inbound (dispatcher) and outbound
// (OcpiClient). faults.test.ts already covers ocpiStatus/httpStatus/dropRequired/
// times:1/disarm, so those are not repeated here.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { FaultAction, FaultRule, MockContext } from '../src/core/types.js';
import { OVERSIZE_TOKEN } from '../src/core/faults.js';
import { decodeAuthHeader } from '../src/core/auth.js';
import { ModuleId } from '../src/ocpi/barrel.js';
import {
  authHeader,
  makeListeningServer,
  makeServer,
  ocpiEnvelope,
  registrationHeaders,
  startStubCpo,
  functionalHeaders,
  validSession,
  SEED_TOKEN_WE_ACCEPT,
  SEED_TOKEN_WE_PRESENT,
  type ListeningServer,
  type StubCpo,
} from './harness.js';

const VERSIONS_MATCH = { direction: 'inbound', module: 'versions', method: 'GET' } as const;

function rule(id: string, action: FaultAction, extra: Partial<FaultRule> = {}): FaultRule {
  return { id, enabled: true, match: VERSIONS_MATCH, action, ...extra };
}

describe('fault kinds — inbound (dispatcher)', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  const getVersions = () =>
    app.inject({ method: 'GET', url: '/ocpi/versions', headers: registrationHeaders() });
  const getCredentials = () =>
    app.inject({ method: 'GET', url: '/ocpi/2.2.1/credentials', headers: registrationHeaders() });
  const lastVersions = () =>
    ctx.store.query({ direction: 'inbound', operation: 'versions.list' }).at(-1)!;

  it('passthrough leaves the reply untouched but still stamps exchange.fault', async () => {
    ctx.faults.arm(rule('pass', { kind: 'passthrough' }));
    const res = await getVersions();
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(1000);
    expect(res.headers['x-request-id']).toBeDefined();
    const ex = lastVersions();
    expect(ex.fault).toEqual({
      ruleId: 'pass',
      kind: 'passthrough',
      detail: { kind: 'passthrough' },
    });
  });

  it('unauthorized answers 401 with a 2002 envelope even though the token was valid', async () => {
    ctx.faults.arm(rule('unauth', { kind: 'unauthorized' }));
    const res = await getVersions();
    expect(res.statusCode).toBe(401);
    expect(res.json().status_code).toBe(2002);
    expect(res.json().status_message).toBe('Not Authorized');
    const ex = lastVersions();
    expect(ex.request.ocpi.tokenValid).toBe(true); // auth itself passed; the fault did this
    expect(ex.fault?.kind).toBe('unauthorized');
    expect(ex.response.httpStatus).toBe(401);
  });

  it('httpStatus with a custom body sends exactly that body', async () => {
    const body = { oops: true, detail: 'teapot' };
    ctx.faults.arm(rule('teapot', { kind: 'httpStatus', status: 418, body }));
    const res = await getVersions();
    expect(res.statusCode).toBe(418);
    expect(res.json()).toEqual(body);
    const ex = lastVersions();
    expect(ex.response.httpStatus).toBe(418);
    expect(ex.response.ocpiStatusCode).toBeUndefined(); // custom body has no status_code
  });

  it('ocpiStatus overrides status_message alongside the code', async () => {
    ctx.faults.arm(
      rule('msg', { kind: 'ocpiStatus', status_code: 2001, status_message: 'injected message' }),
    );
    const res = await getVersions();
    expect(res.statusCode).toBe(200);
    expect(res.json().status_code).toBe(2001);
    expect(res.json().status_message).toBe('injected message');
    expect(res.json().data).toBeDefined(); // rest of the envelope intact
  });

  it('malformBody wrongType defaults to status_code and honours targetPath', async () => {
    ctx.faults.arm(rule('wt', { kind: 'malformBody', mutation: 'wrongType' }));
    const res = await getVersions();
    expect(res.json().status_code).toBe('not-a-number');

    ctx.faults.clear();
    ctx.faults.arm({
      id: 'wt-path',
      enabled: true,
      match: { direction: 'inbound', module: 'credentials', method: 'GET' },
      action: { kind: 'malformBody', mutation: 'wrongType', targetPath: 'data.token' },
    });
    const creds = await getCredentials();
    expect(creds.json().status_code).toBe(1000);
    expect(creds.json().data.token).toBe(12345); // string -> number
  });

  it('malformBody injectData adds an empty data object to an empty envelope', async () => {
    ctx.faults.arm({
      id: 'inject',
      enabled: true,
      match: { direction: 'inbound', module: ModuleId.Sessions, method: 'PUT' },
      action: { kind: 'malformBody', mutation: 'injectData' },
    });
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/INJ-1',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validSession({ id: 'INJ-1' })),
    });
    const body = res.json();
    expect(body.status_code).toBe(1000);
    expect(body.data).toEqual({});
  });

  it('malformBody emptyObject replaces the whole envelope with {}', async () => {
    ctx.faults.arm(rule('empty', { kind: 'malformBody', mutation: 'emptyObject' }));
    const res = await getVersions();
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({});
    expect(lastVersions().response.ocpiStatusCode).toBeUndefined();
  });

  it('malformBody notJson puts a non-JSON string on the wire', async () => {
    ctx.faults.arm(rule('notjson', { kind: 'malformBody', mutation: 'notJson' }));
    const res = await getVersions();
    expect(res.statusCode).toBe(200);
    expect(res.payload).toBe('not json at all');
    expect(() => res.json()).toThrow();
    expect(lastVersions().response.body).toBe('not json at all');
  });

  it('dropHeaders removes the named response headers (case-insensitive)', async () => {
    ctx.faults.arm(
      rule('drop', { kind: 'dropHeaders', headers: ['x-request-id', 'X-CORRELATION-ID'] }),
    );
    const res = await getVersions();
    expect(res.statusCode).toBe(200);
    expect(res.headers['x-request-id']).toBeUndefined();
    expect(res.headers['x-correlation-id']).toBeUndefined();
    expect(res.headers['content-type']).toContain('application/json');
    const ex = lastVersions();
    expect(ex.response.headers['X-Request-ID']).toBeUndefined();
  });

  it('oversizeToken makes the credentials GET advertise an 80-char token', async () => {
    ctx.faults.arm({
      id: 'big-token',
      enabled: true,
      match: { direction: 'inbound', module: 'credentials', method: 'GET' },
      action: { kind: 'oversizeToken' },
    });
    const res = await getCredentials();
    expect(res.statusCode).toBe(200);
    expect(res.json().data.token).toBe(OVERSIZE_TOKEN);
    expect(res.json().data.token).toHaveLength(80);
    // the real accepted token is untouched — only the wire copy is corrupted
    expect(ctx.store.domain.registration.tokenWeAccept).toBe(SEED_TOKEN_WE_ACCEPT);
  });

  it('enabled:false never fires', async () => {
    ctx.faults.arm(rule('off', { kind: 'unauthorized' }, { enabled: false }));
    for (let i = 0; i < 3; i++) {
      const res = await getVersions();
      expect(res.statusCode).toBe(200);
      expect(res.json().status_code).toBe(1000);
    }
    expect(lastVersions().fault).toBeUndefined();
    expect(ctx.faults.list().map((r) => r.id)).toEqual(['off']); // still armed, just inert
  });

  it('scope.afterSeq only fires on exchanges with seq > afterSeq', async () => {
    await getVersions();
    const first = lastVersions();
    // nothing else allocates a seq inside this test, so the next two requests
    // land on seq+1 (not > afterSeq) and seq+2 (> afterSeq)
    ctx.faults.arm(
      rule(
        'later',
        { kind: 'ocpiStatus', status_code: 3001 },
        { scope: { afterSeq: first.seq + 1 } },
      ),
    );
    const second = await getVersions();
    const secondEx = lastVersions();
    const third = await getVersions();
    const thirdEx = lastVersions();

    expect(secondEx.seq).toBe(first.seq + 1);
    expect(second.json().status_code).toBe(1000);
    expect(secondEx.fault).toBeUndefined();

    expect(thirdEx.seq).toBe(first.seq + 2);
    expect(third.json().status_code).toBe(3001);
    expect(thirdEx.fault?.ruleId).toBe('later');
  });

  it('scope.probability 0 never fires and 1 always fires', async () => {
    ctx.faults.arm(rule('never', { kind: 'unauthorized' }, { scope: { probability: 0 } }));
    for (let i = 0; i < 5; i++) expect((await getVersions()).statusCode).toBe(200);

    ctx.faults.clear();
    ctx.faults.arm(rule('always', { kind: 'unauthorized' }, { scope: { probability: 1 } }));
    for (let i = 0; i < 5; i++) expect((await getVersions()).statusCode).toBe(401);
  });

  it('a rule matched on module+direction+operation only hits that route', async () => {
    ctx.faults.arm({
      id: 'details-only',
      enabled: true,
      match: { direction: 'inbound', module: 'versions', operation: 'versions.details' },
      action: { kind: 'ocpiStatus', status_code: 3001 },
    });
    const list = await getVersions();
    expect(list.json().status_code).toBe(1000);
    expect(lastVersions().fault).toBeUndefined();

    const details = await app.inject({
      method: 'GET',
      url: '/ocpi/versions/2.2.1',
      headers: registrationHeaders(),
    });
    expect(details.json().status_code).toBe(3001);
    const ex = ctx.store.query({ direction: 'inbound', operation: 'versions.details' }).at(-1)!;
    expect(ex.fault).toEqual({
      ruleId: 'details-only',
      kind: 'ocpiStatus',
      detail: { kind: 'ocpiStatus', status_code: 3001 },
    });

    // an outbound-only rule never touches inbound traffic either
    ctx.faults.clear();
    ctx.faults.arm(rule('out', { kind: 'unauthorized' }, { match: { direction: 'outbound' } }));
    expect((await getVersions()).statusCode).toBe(200);
  });

  it('the 401 from a bad token is not a fault and faults do not run on it', async () => {
    ctx.faults.arm(rule('would-418', { kind: 'httpStatus', status: 418 }));
    const res = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders('wrong-token'),
    });
    expect(res.statusCode).toBe(401);
    expect(lastVersions().fault).toBeUndefined();
  });
});

describe('fault kinds — inbound over a real socket', () => {
  let srv: ListeningServer;

  beforeEach(async () => {
    srv = await makeListeningServer();
  });
  afterEach(async () => {
    await srv.close();
  });

  it('abort destroys the socket so the caller sees a connection error', async () => {
    srv.ctx.faults.arm(rule('abort', { kind: 'abort' }));
    await expect(
      fetch(`${srv.origin}/ocpi/versions`, { headers: registrationHeaders() }),
    ).rejects.toThrow();
    const ex = srv.ctx.store.query({ direction: 'inbound', operation: 'versions.list' }).at(-1)!;
    expect(ex.fault?.kind).toBe('abort');
    expect(ex.response.httpStatus).toBe(0);
    expect(ex.timing.respondedAt).toBeDefined();

    // disarmed -> the same socket-level call works again
    srv.ctx.faults.clear();
    const ok = await fetch(`${srv.origin}/ocpi/versions`, { headers: registrationHeaders() });
    expect(ok.status).toBe(200);
  });

  it('delay holds the response for at least the configured ms', async () => {
    srv.ctx.faults.arm(rule('slow', { kind: 'delay', ms: 300 }));
    const t0 = Date.now();
    const res = await fetch(`${srv.origin}/ocpi/versions`, { headers: registrationHeaders() });
    const elapsed = Date.now() - t0;
    expect(res.status).toBe(200);
    expect((await res.json()).status_code).toBe(1000); // delay only, body untouched
    expect(elapsed).toBeGreaterThanOrEqual(290); // setTimeout may fire ~1ms early
    const ex = srv.ctx.store.query({ direction: 'inbound', operation: 'versions.list' }).at(-1)!;
    expect(ex.fault?.kind).toBe('delay');
    expect(ex.timing.durationMs).toBeGreaterThanOrEqual(290);
  });
});

describe('fault kinds — outbound (OcpiClient)', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;

  beforeEach(async () => {
    cpo = await startStubCpo((req) => {
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/locations')
        return { json: ocpiEnvelope([]) };
      if (req.path.startsWith('/ocpi/2.2.1/tokens/')) return { json: ocpiEnvelope(undefined) };
      if (req.path === '/ocpi/2.2.1/credentials') return { json: ocpiEnvelope({ token: 'x' }) };
      return undefined;
    });
    ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  const outboundLocations = (id: string, action: FaultAction): FaultRule => ({
    id,
    enabled: true,
    match: { direction: 'outbound', module: ModuleId.Locations },
    action,
  });

  it('unauthorized corrupts the Authorization header the CPO receives', async () => {
    ctx.faults.arm(outboundLocations('bad-auth', { kind: 'unauthorized' }));
    const ex = await ctx.client.pull(ModuleId.Locations);
    expect(cpo.requests).toHaveLength(1);
    const sent = cpo.requests[0].headers.authorization as string;
    expect(sent).not.toBe(authHeader(SEED_TOKEN_WE_PRESENT));
    expect(sent.startsWith('Token ')).toBe(true);
    expect(decodeAuthHeader(sent).token).toMatch(/^invalid-/);
    // the recorded exchange shows the corrupted header, not the clean one
    expect(ex.request.headers.Authorization).toBe(sent);
    expect(ex.fault?.kind).toBe('unauthorized');
  });

  it('dropHeaders strips X-Request-ID from the outgoing request', async () => {
    ctx.faults.arm(
      outboundLocations('no-reqid', { kind: 'dropHeaders', headers: ['X-Request-ID'] }),
    );
    const ex = await ctx.client.pull(ModuleId.Locations);
    const h = cpo.requests[0].headers;
    expect(h['x-request-id']).toBeUndefined();
    expect(h['x-correlation-id']).toBeDefined();
    expect(h['authorization']).toBe(authHeader(SEED_TOKEN_WE_PRESENT));
    expect(ex.request.headers['X-Request-ID']).toBeUndefined();
    expect(ex.response.httpStatus).toBe(200);
  });

  it('delay adds latency before the request leaves', async () => {
    ctx.faults.arm(outboundLocations('slow-out', { kind: 'delay', ms: 300 }));
    const t0 = Date.now();
    const ex = await ctx.client.pull(ModuleId.Locations);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(290);
    expect(cpo.requests).toHaveLength(1);
    expect(ex.response.httpStatus).toBe(200);
    expect(ex.fault?.kind).toBe('delay');
  });

  it('abort skips the send and records a failed exchange instead of throwing', async () => {
    ctx.faults.arm(outboundLocations('abort-out', { kind: 'abort' }));
    const ex = await ctx.client.pull(ModuleId.Locations);
    expect(cpo.requests).toHaveLength(0);
    expect(ex.response.httpStatus).toBe(0);
    expect(ex.response.body).toBeUndefined();
    expect(ex.fault?.ruleId).toBe('abort-out');
    expect(ex.findings).toHaveLength(0); // skipped, not failed — no network finding
    expect(ctx.store.get(ex.id)).toBe(ex);
  });

  it('malformBody and oversizeToken corrupt the outgoing body', async () => {
    ctx.faults.arm({
      id: 'drop-uid',
      enabled: true,
      match: { direction: 'outbound', module: ModuleId.Tokens },
      action: { kind: 'malformBody', mutation: 'dropRequired', targetPath: 'uid' },
    });
    const push = await app.inject({
      method: 'POST',
      url: '/_mock/emit/token',
      headers: { 'content-type': 'application/json' },
      payload: '{}',
    });
    expect(push.statusCode).toBe(200);
    const tokenBody = cpo.requests.at(-1)!.body as Record<string, unknown>;
    expect(tokenBody.uid).toBeUndefined();
    expect(tokenBody.contract_id).toBeDefined();

    ctx.faults.clear();
    ctx.faults.arm({
      id: 'big',
      enabled: true,
      match: { direction: 'outbound', module: 'credentials' },
      action: { kind: 'oversizeToken' },
    });
    await ctx.client.call({
      method: 'POST',
      url: `${cpo.baseUrl}/2.2.1/credentials`,
      module: 'credentials',
      operation: 'credentials.post',
      functional: false,
      body: { token: 'short', url: 'http://x', roles: [] },
    });
    const credsBody = cpo.requests.at(-1)!.body as Record<string, unknown>;
    expect(credsBody.token).toBe(OVERSIZE_TOKEN);
  });

  it('httpStatus / ocpiStatus / passthrough are no-ops outbound', async () => {
    const kinds: FaultAction[] = [
      { kind: 'httpStatus', status: 503 },
      { kind: 'ocpiStatus', status_code: 3001 },
      { kind: 'passthrough' },
    ];
    for (const action of kinds) {
      ctx.faults.clear();
      ctx.faults.arm(outboundLocations(`noop-${action.kind}`, action));
      const before = cpo.requests.length;
      const ex = await ctx.client.pull(ModuleId.Locations);
      expect(cpo.requests).toHaveLength(before + 1);
      const sent = cpo.requests.at(-1)!;
      expect(sent.headers.authorization).toBe(authHeader(SEED_TOKEN_WE_PRESENT));
      expect(sent.headers['x-request-id']).toBeDefined();
      // the stub's real answer comes back untouched; only the decision is recorded
      expect(ex.response.httpStatus).toBe(200);
      expect(ex.response.ocpiStatusCode).toBe(1000);
      expect(ex.fault).toEqual({
        ruleId: `noop-${action.kind}`,
        kind: action.kind,
        detail: action,
      });
    }
  });

  it('an inbound-only rule never touches outbound traffic', async () => {
    ctx.faults.arm(rule('inbound-only', { kind: 'abort' }, { match: { direction: 'inbound' } }));
    const ex = await ctx.client.pull(ModuleId.Locations);
    expect(ex.fault).toBeUndefined();
    expect(ex.response.httpStatus).toBe(200);
  });
});
