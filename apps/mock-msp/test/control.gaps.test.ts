// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// Gap coverage for the /_mock control surface: rare query params, the JSON
// ?filter= form, per-module state slices, the GET /wait long-poll, the scoped
// control-secret guard, scenario apply + the full expect[] assert grammar,
// registration lifecycle error branches, authorize policy, command/token emit
// edges, provoke/discover/charge fault paths, the spec-probe suite, the
// probeOcpi short-circuit, statusCache inflight coalescing, and the dashboard
// routes. Hermetic: every remote is the harness stub CPO or an injected probe.
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
  registrationHeaders,
  validSession,
  SEED_TOKEN_WE_ACCEPT,
  type StubCpo,
} from './harness.js';

const CONTROL = { 'content-type': 'application/json' };
const tick = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

function callbackHeaders(): Record<string, string> {
  return {
    authorization: authHeader(SEED_TOKEN_WE_ACCEPT),
    'content-type': 'application/json',
    'x-request-id': 'cb-req',
    'x-correlation-id': 'cb-cor',
    'ocpi-from-country-code': 'US',
    'ocpi-from-party-id': 'S44',
    'ocpi-to-country-code': 'US',
    'ocpi-to-party-id': 'TST',
  };
}

/** Poll the domain until sendCommand has recorded its PendingCommand. */
async function waitForPending(ctx: MockContext): Promise<PendingCommand> {
  for (let i = 0; i < 400; i++) {
    const pending = [...ctx.store.domain.commands.values()];
    if (pending.length > 0) return pending[pending.length - 1];
    await new Promise((r) => setTimeout(r, 5));
  }
  throw new Error('command was never sent (no PendingCommand recorded)');
}

// ---------------------------------------------------------------------------
// Inspection: filter forms, per-module slices, GET /wait
// ---------------------------------------------------------------------------
describe('inspection routes: filters, slices, wait', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  function putSession(id: string, body?: Record<string, unknown>) {
    return app.inject({
      method: 'PUT',
      url: `/ocpi/2.2.1/emsp/sessions/US/TST/${id}`,
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(body ?? validSession({ id })),
    });
  }

  it('GET /_mock/exchanges?filter=<json> applies the parsed filter (limit included)', async () => {
    await putSession('F-OK');
    await putSession('F-BAD', { id: 'F-BAD' });
    const res = await app.inject({
      method: 'GET',
      url: '/_mock/exchanges',
      query: { filter: JSON.stringify({ module: 'sessions', limit: 1 }) },
    });
    const list = res.json();
    expect(list).toHaveLength(1); // limit=1 of the 2 recorded
    expect(list[0].module).toBe('sessions');
    expect(list[0].request.path).toContain('F-OK'); // oldest first
  });

  it('a malformed ?filter= JSON falls back to param parsing (returns everything)', async () => {
    await putSession('F2-A');
    await putSession('F2-B');
    const res = await app.inject({
      method: 'GET',
      url: '/_mock/exchanges',
      query: { filter: '{oops' },
    });
    expect(res.json()).toHaveLength(2);
  });

  it('rare query params: method (lowercased), validationOk, from/to, minSeq', async () => {
    await putSession('Q-OK');
    await putSession('Q-BAD', { id: 'Q-BAD' });

    const ok = await app.inject({
      method: 'GET',
      url: '/_mock/exchanges?method=put&validationOk=true&from.cc=US&from.party=S44&to.party=TST&minSeq=1',
    });
    expect(ok.json()).toHaveLength(1);
    expect(ok.json()[0].request.path).toContain('Q-OK');

    const bad = await app.inject({
      method: 'GET',
      url: '/_mock/exchanges?validationOk=false',
    });
    expect(bad.json()).toHaveLength(1);
    expect(bad.json()[0].request.path).toContain('Q-BAD');

    const none = await app.inject({
      method: 'GET',
      url: '/_mock/exchanges?ocpiStatusCode=9999&httpStatus=200',
    });
    expect(none.json()).toHaveLength(0);
  });

  it('GET /_mock/exchanges/:id returns the exchange; unknown id 404s', async () => {
    await putSession('ID-1');
    const listed = (await app.inject({ method: 'GET', url: '/_mock/exchanges' })).json();
    const id = listed[0].id as string;

    const found = await app.inject({ method: 'GET', url: `/_mock/exchanges/${id}` });
    expect(found.statusCode).toBe(200);
    expect(found.json().id).toBe(id);
    expect(found.json().request.path).toContain('ID-1');

    const missing = await app.inject({ method: 'GET', url: '/_mock/exchanges/nope' });
    expect(missing.statusCode).toBe(404);
    expect(missing.json().error).toBe('not_found');
  });

  it('GET /_mock/received/:module defaults to inbound; explicit direction wins', async () => {
    await putSession('RCV-1');
    await putSession('RCV-2');
    const inbound = (await app.inject({ method: 'GET', url: '/_mock/received/sessions' })).json();
    expect(inbound).toHaveLength(2);
    expect(inbound.every((e: { direction: string }) => e.direction === 'inbound')).toBe(true);
    expect(inbound.every((e: { module: string }) => e.module === 'sessions')).toBe(true);

    const outbound = (
      await app.inject({ method: 'GET', url: '/_mock/received/sessions?direction=outbound' })
    ).json();
    expect(outbound).toHaveLength(0);
  });

  it('GET /_mock/state/:module serves every slice; unknown module 404s', async () => {
    const reg = await app.inject({ method: 'GET', url: '/_mock/state/registration' });
    expect(reg.json().status).toBe('registered');
    for (const m of ['locations', 'cdrs', 'tariffs', 'tokens', 'authorizations', 'commands']) {
      const res = await app.inject({ method: 'GET', url: `/_mock/state/${m}` });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({});
    }
    const unknown = await app.inject({ method: 'GET', url: '/_mock/state/frobnicate' });
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json()).toEqual({ error: 'unknown_module', module: 'frobnicate' });
  });

  it('GET /_mock/wait resolves from query params when matching traffic arrives', async () => {
    const waitInject = app.inject({
      method: 'GET',
      url: '/_mock/wait?direction=inbound&module=sessions&method=PUT&timeoutMs=3000',
    });
    await tick();
    await putSession('GW-1');
    const res = await waitInject;
    expect(res.statusCode).toBe(200);
    expect(res.json().module).toBe('sessions');
    expect(res.json().request.path).toContain('GW-1');
  });

  it('GET /_mock/wait times out with 408 and echoes the parsed filter', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/_mock/wait?module=cdrs&timeoutMs=120',
    });
    expect(res.statusCode).toBe(408);
    expect(res.json().error).toBe('timeout');
    expect(res.json().filter.module).toBe('cdrs');
    expect(res.json().timeoutMs).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// Control secret preHandler (scoped to /_mock only)
// ---------------------------------------------------------------------------
describe('control secret guard', () => {
  let app: FastifyInstance;
  const FIXTURE_VALUE = 'test-value';

  beforeEach(async () => {
    ({ app } = makeServer({ controlSecret: FIXTURE_VALUE }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('rejects /_mock without the secret, accepts with it, and leaves /ocpi alone', async () => {
    const denied = await app.inject({ method: 'GET', url: '/_mock/health' });
    expect(denied.statusCode).toBe(401);
    expect(denied.json().error).toBe('unauthorized');

    const allowed = await app.inject({
      method: 'GET',
      url: '/_mock/health',
      headers: { 'x-mock-control-secret': FIXTURE_VALUE },
    });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json().status).toBe('up');

    // The guard is plugin-scoped: OCPI routes still use OCPI auth, not the secret.
    const ocpi = await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
    });
    expect(ocpi.statusCode).toBe(200);
    expect(ocpi.json().status_code).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// Scenario routes + the expect[] assert grammar
// ---------------------------------------------------------------------------
describe('scenario routes and expect[] grammar', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('POST /_mock/scenario rejects an invalid scenario with 400 + issues', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/scenario',
      payload: { registration: 'preregistered' }, // name missing
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_scenario');
    expect(res.json().issues.length).toBeGreaterThan(0);
  });

  it('applies identity/authorize/strictInbound and publishes them on the runtime', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/scenario',
      payload: {
        name: 'ident-override',
        registration: 'preregistered',
        identity: { party_id: 'ZZY' },
        authorize: { default: 'NO_CREDIT' },
        strictInbound: true,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().applied).toBe('ident-override');

    const rt = (await app.inject({ method: 'GET', url: '/_mock/scenario' })).json();
    expect(rt.name).toBe('ident-override');
    expect(rt.authorize.default).toBe('NO_CREDIT');
    expect(rt.strictInbound).toBe(true);
    expect(ctx.identity.party_id).toBe('ZZY');

    const health = (await app.inject({ method: 'GET', url: '/_mock/health' })).json();
    expect(health.party).toBe('US/ZZY');
    expect(health.scenario).toBe('ident-override');
  });

  it('POST /_mock/scenarios/:id/evaluate without an active scenario returns 409', async () => {
    const res = await app.inject({ method: 'POST', url: '/_mock/scenarios/x/evaluate' });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('no_active_scenario');
  });

  it('evaluate runs the full assert grammar over the trace', async () => {
    const expectations = [
      { on: 'sessions.put', assert: 'received' },
      { on: 'cdrs', assert: 'notReceived' },
      { on: 'sessions.put', assert: 'count == 2' },
      { on: 'sessions.put', assert: 'count >= 2' },
      { on: 'sessions.put', assert: 'count > 1' },
      { on: 'sessions.put', assert: 'count < 3' },
      { on: 'sessions.put', assert: 'count <= 2' },
      { on: 'sessions.put', assert: 'findings >= 1' },
      { on: 'sessions.put', assert: 'globalFindings >= 1' },
      { on: 'sessions.put', assert: 'validationOk == false' },
      { on: 'sessions.put', assert: 'validation.ok == false' },
      { on: 'sessions.put', assert: 'registration.status == registered' },
      { on: '{"module":"sessions","validationOk":true}', assert: 'httpStatus == 200' },
      { on: '{"module":"sessions","validationOk":true}', assert: 'httpStatus != 500' },
      { on: '{"module":"sessions","validationOk":true}', assert: 'ocpiStatusCode == 1000' },
      { on: 'sessions.put', assert: 'bogusmetric == 1' }, // unknown metric -> undefined lhs, fails
      { on: '{"module":"sessions","validationOk":true}', assert: 'response.httpStatus == 200' },
      { on: '{"module":"sessions","validationOk":true}', assert: 'count == 1' },
      { on: '{"module":"sessions","validationOk":true}', assert: 'valid' },
      { on: '{broken', assert: 'notReceived' }, // bad JSON on -> empty match set
      { on: 'sessions.put', assert: 'hasFinding' },
      { on: 'sessions.put', assert: 'hasError' },
      { on: 'sessions.put', assert: 'invalid' },
      { on: 'sessions.put', assert: 'frobnicate' }, // unsupported -> the only failure
    ];
    const applied = await app.inject({
      method: 'POST',
      url: '/_mock/scenario',
      payload: { name: 'gaps-oracle', registration: 'preregistered', expect: expectations },
    });
    expect(applied.statusCode).toBe(200);

    // One valid put, then one invalid put (newest) so last-exchange metrics see ok=false.
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/EV-OK',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validSession({ id: 'EV-OK' })),
    });
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/EV-BAD',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify({ id: 'EV-BAD' }),
    });

    const res = await app.inject({ method: 'POST', url: '/_mock/scenarios/gaps-oracle/evaluate' });
    expect(res.statusCode).toBe(200);
    const report = res.json();
    expect(report.scenario).toBe('gaps-oracle');
    expect(report.total).toBe(expectations.length);
    expect(report.failures).toBe(2);
    expect(report.passed).toBe(false);

    const failing = report.results.filter((r: { pass: boolean }) => !r.pass);
    expect(failing.map((r: { assert: string }) => r.assert)).toEqual([
      'bogusmetric == 1',
      'frobnicate',
    ]);
    expect(failing[0].observed).toBe('bogusmetric=undefined');
    expect(failing[1].observed).toBe('unsupported assert: frobnicate');

    const received = report.results.find((r: { assert: string }) => r.assert === 'received');
    expect(received.observed).toBe('count=2');
  });
});

// ---------------------------------------------------------------------------
// Registration lifecycle routes (CPO unreachable by default config)
// ---------------------------------------------------------------------------
describe('registration lifecycle routes', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('POST /_mock/register short-circuits when already registered (no outbound call)', async () => {
    const res = await app.inject({ method: 'POST', url: '/_mock/register', payload: {} });
    expect(res.statusCode).toBe(200);
    expect(res.json().registered).toBe(true);
    expect(res.json().alreadyRegistered).toBe(true);
    expect(res.json().registration.status).toBe('registered');
    expect(ctx.store.query({ direction: 'outbound' })).toHaveLength(0);
  });

  it('unregister clears the seeded registration; a fresh register then 502s', async () => {
    const un = await app.inject({ method: 'POST', url: '/_mock/unregister', payload: {} });
    expect(un.statusCode).toBe(200);
    expect(un.json().unregistered).toBe(true);
    expect(un.json().registration.status).toBe('unregistered');
    // No cpoCredentialsUrl was seeded, so no DELETE went out.
    expect(ctx.store.query({ direction: 'outbound' })).toHaveLength(0);

    const reg = await app.inject({ method: 'POST', url: '/_mock/register', payload: {} });
    expect(reg.statusCode).toBe(502);
    expect(reg.json().error).toBe('register_failed');
    expect(reg.json().message).toContain('generate-credentials-token-a');
  });

  it('POST /_mock/reregister surfaces a failed rotation as 502 reregister_failed', async () => {
    // Discovery resolves nothing (dead CPO), state stays registered, and the
    // rotation then throws for lack of a CPO credentials URL.
    const res = await app.inject({ method: 'POST', url: '/_mock/reregister', payload: {} });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('reregister_failed');
    expect(res.json().message).toContain('rotateCredentials requires');
  });
});

// ---------------------------------------------------------------------------
// Authorize policy route
// ---------------------------------------------------------------------------
describe('POST /_mock/authorize', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ app } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('rejects a non-enum default with 400 invalid_authorize', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/authorize',
      payload: { default: 'MAYBE' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_authorize');
    expect(res.json().issues.length).toBeGreaterThan(0);
  });

  it('sets the live policy; health reflects it', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/authorize',
      payload: { default: 'BLOCKED', byUid: { ABC123: 'EXPIRED' } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().authorize.default).toBe('BLOCKED');
    expect(res.json().authorize.byUid.ABC123).toBe('EXPIRED');

    const health = (await app.inject({ method: 'GET', url: '/_mock/health' })).json();
    expect(health.authorize).toBe('BLOCKED');
  });
});

// ---------------------------------------------------------------------------
// Command emit routes (stub CPO commands receiver)
// ---------------------------------------------------------------------------
describe('command emit routes', () => {
  let app: FastifyInstance;
  let cpo: StubCpo;

  beforeEach(async () => {
    cpo = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path.startsWith('/ocpi/2.2.1/commands/')) {
        return { json: ocpiEnvelope({ result: 'ACCEPTED', timeout: 30 }) };
      }
      return undefined;
    });
    ({ app } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
    await cpo.close();
  });

  it('POST /_mock/commands/:type rejects an unknown type without touching the CPO', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/commands/frobnicate',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('unknown_command_type');
    expect(res.json().got).toBe('frobnicate');
    expect(res.json().valid).toContain('START_SESSION');
    expect(cpo.requests).toHaveLength(0);
  });

  it('POST /_mock/emit/command without a type is a 400', async () => {
    const res = await app.inject({ method: 'POST', url: '/_mock/emit/command', payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('unknown_command_type');
  });

  it('a lowercase type normalizes and sends the schema-valid default payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/commands/start_session',
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.command).toBe('START_SESSION');
    expect(j.sync.result).toBe('ACCEPTED');
    expect(j.payloadValidation.ok).toBe(true);
    expect(typeof j.responseUrl).toBe('string');

    const sent = cpo.requests.filter((r) => r.path === '/ocpi/2.2.1/commands/START_SESSION');
    expect(sent).toHaveLength(1);
    const body = sent[0].body as Record<string, unknown>;
    expect(body.evse_uid).toBe('cp001::1'); // config default
    expect((body.token as { uid?: string }).uid).toBe('DEADBEEF');
    expect(String(body.response_url)).toContain('/2.2.1/emsp/commands/START_SESSION/');
  });

  it('emit/command alias: caller payload wins over the per-type default', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/emit/command',
      payload: { type: 'STOP_SESSION', payload: { session_id: 'S-9' } },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().command).toBe('STOP_SESSION');

    const sent = cpo.requests.filter((r) => r.path === '/ocpi/2.2.1/commands/STOP_SESSION');
    expect(sent).toHaveLength(1);
    expect((sent[0].body as { session_id?: string }).session_id).toBe('S-9');
  });

  it('an invalid explicit payload still sends but reports payloadValidation issues', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/commands/UNLOCK_CONNECTOR',
      payload: { connector_id: 42 }, // spec wants a string
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().payloadValidation.ok).toBe(false);
    expect(res.json().payloadValidation.issues.length).toBeGreaterThan(0);

    const sent = cpo.requests.filter((r) => r.path === '/ocpi/2.2.1/commands/UNLOCK_CONNECTOR');
    expect(sent).toHaveLength(1);
    expect((sent[0].body as { connector_id?: unknown }).connector_id).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// Token emit / verify edges + pull + fault edges
// ---------------------------------------------------------------------------
describe('token emit/verify, pull, fault edges', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('POST /_mock/emit/token rejects a schema-invalid token with 400 and stores nothing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/emit/token',
      payload: { type: 'BOGUS' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_token');
    expect(res.json().issues.length).toBeGreaterThan(0);
    expect(res.json().token.type).toBe('BOGUS');
    expect(ctx.store.domain.tokens.size).toBe(0);
  });

  it('POST /_mock/verify/token with nothing pushed returns 409 no_token', async () => {
    const res = await app.inject({ method: 'POST', url: '/_mock/verify/token', payload: {} });
    expect(res.statusCode).toBe(409);
    expect(res.json().error).toBe('no_token');
    expect(res.json().hint).toContain('Push a token first');
  });

  it('POST /_mock/pull/:module rejects an unknown module with the valid list', async () => {
    const res = await app.inject({ method: 'POST', url: '/_mock/pull/bogus', payload: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('unknown_module');
    expect(res.json().valid).toEqual(
      expect.arrayContaining(['locations', 'sessions', 'cdrs', 'tariffs']),
    );
  });

  it('POST /_mock/faults rejects a bad rule with 400 invalid_fault', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/faults',
      payload: { match: {}, action: { kind: 'explode' } },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_fault');
    expect(res.json().issues.length).toBeGreaterThan(0);
  });

  it('DELETE /_mock/faults/:id disarms just that rule', async () => {
    for (const id of ['f-keep', 'f-drop']) {
      await app.inject({
        method: 'POST',
        url: '/_mock/faults',
        payload: { id, match: { module: 'versions' }, action: { kind: 'abort' } },
      });
    }
    const del = await app.inject({ method: 'DELETE', url: '/_mock/faults/f-drop' });
    expect(del.statusCode).toBe(200);
    expect(del.json()).toEqual({ disarmed: 'f-drop' });

    const left = (await app.inject({ method: 'GET', url: '/_mock/faults' })).json();
    expect(left.map((r: { id: string }) => r.id)).toEqual(['f-keep']);
  });
});

// ---------------------------------------------------------------------------
// Provoke: location-add error branches (stub Hasura)
// ---------------------------------------------------------------------------
describe('provoke location-add error branches', () => {
  let app: FastifyInstance | undefined;
  let stub: StubCpo | undefined;

  afterEach(async () => {
    if (app) await app.close();
    if (stub) await stub.close();
    app = undefined;
    stub = undefined;
  });

  it('a failing aggregate query becomes 502 provoke_failed', async () => {
    stub = await startStubCpo(() => ({ json: { errors: [{ message: 'no such table' }] } }));
    ({ app } = makeServer({ citrineHasuraUrl: stub.origin }));
    await app.ready();

    const res = await app.inject({ method: 'POST', url: '/_mock/provoke/location-add' });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('provoke_failed');
    expect(res.json().message).toContain('aggregate');
    expect(stub.requests).toHaveLength(1); // failed before the insert
  });

  it('a failing insert becomes 502 hasura_error after a successful aggregate', async () => {
    stub = await startStubCpo((req) => {
      const q = (req.body as { query?: string } | undefined)?.query ?? '';
      if (q.includes('Locations_aggregate')) {
        return { json: { data: { Locations_aggregate: { aggregate: { max: { id: 3 } } } } } };
      }
      return { json: { errors: [{ message: 'insert denied' }] } };
    });
    ({ app } = makeServer({ citrineHasuraUrl: stub.origin }));
    await app.ready();

    const res = await app.inject({ method: 'POST', url: '/_mock/provoke/location-add' });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('hasura_error');
    expect(res.json().what).toBe('location-add');
    expect(res.json().issues).toHaveLength(1);

    expect(stub.requests).toHaveLength(2);
    const insert = stub.requests[1].body as { query: string; variables: { obj: { id: number } } };
    expect(insert.query).toContain('insert_Locations_one');
    expect(insert.variables.obj.id).toBe(4); // max 3 + 1
  });
});

// ---------------------------------------------------------------------------
// discover/evse edge paths
// ---------------------------------------------------------------------------
describe('GET /_mock/discover/evse edges', () => {
  let app: FastifyInstance | undefined;
  let cpo: StubCpo | undefined;

  afterEach(async () => {
    if (app) await app.close();
    if (cpo) await cpo.close();
    app = undefined;
    cpo = undefined;
  });

  async function boot(locationsReply: () => { status?: number; json?: unknown }): Promise<void> {
    cpo = await startStubCpo((req) => {
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/locations') return locationsReply();
      return undefined;
    });
    ({ app } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
    await app.ready();
  }

  it('an empty location list is a 404 no_evse_found with locationsSeen 0', async () => {
    await boot(() => ({ json: ocpiEnvelope([]) }));
    const res = await app!.inject({ method: 'GET', url: '/_mock/discover/evse' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error).toBe('no_evse_found');
    expect(res.json().locationsSeen).toBe(0);
  });

  it('an EVSE without connectors is skipped -> still no_evse_found', async () => {
    await boot(() => ({
      json: ocpiEnvelope([{ id: '1', evses: [{ uid: 'cp001::1', connectors: [] }] }]),
    }));
    const res = await app!.inject({ method: 'GET', url: '/_mock/discover/evse' });
    expect(res.statusCode).toBe(404);
    expect(res.json().locationsSeen).toBe(1);
  });

  it('a non-2xx pull is a 502 discover_failed carrying the status', async () => {
    await boot(() => ({ status: 500, json: { error: 'boom' } }));
    const res = await app!.inject({ method: 'GET', url: '/_mock/discover/evse' });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('discover_failed');
    expect(res.json().httpStatus).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Charge orchestration edge branches
// ---------------------------------------------------------------------------
describe('charge start/stop edge branches', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;
  let cdrList: Record<string, unknown>[];

  beforeEach(async () => {
    cdrList = [];
    cpo = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path.startsWith('/ocpi/2.2.1/commands/')) {
        return { json: ocpiEnvelope({ result: 'ACCEPTED', timeout: 30 }) };
      }
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/cdrs') {
        return { json: ocpiEnvelope(cdrList) };
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

  /** Stop with the CommandResult callback simulated; the CDR never arrives as a push. */
  async function stopWithCallback(sessionId: string): Promise<Record<string, unknown>> {
    const stopP = app.inject({
      method: 'POST',
      url: '/_mock/charge/stop',
      headers: CONTROL,
      payload: JSON.stringify({ session_id: sessionId, timeoutMs: 600 }),
    });
    const pending = await waitForPending(ctx);
    await app.inject({
      method: 'POST',
      url: new URL(pending.responseUrl).pathname,
      headers: callbackHeaders(),
      payload: JSON.stringify({ result: 'ACCEPTED' }),
    });
    const res = await stopP;
    expect(res.statusCode).toBe(200);
    return res.json();
  }

  it('charge/start: token_uid override; missing callback+push degrade to error fields', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/charge/start',
      headers: CONTROL,
      payload: JSON.stringify({ token_uid: 'ZZ99', timeoutMs: 250 }),
    });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.sync.result).toBe('ACCEPTED');
    expect(typeof j.commandResultError).toBe('string'); // no CommandResult in time
    expect(j.sessionPending).toBe(true); // no Session push in time
    expect(j.session).toBeUndefined();

    const sent = cpo.requests.filter((r) => r.path === '/ocpi/2.2.1/commands/START_SESSION');
    expect(sent).toHaveLength(1);
    expect(((sent[0].body as { token?: { uid?: string } }).token ?? {}).uid).toBe('ZZ99');
  });

  it('charge/stop: no CDR push -> pull fallback correlates on session_id', async () => {
    cdrList = [
      { id: 'CDR-A', session_id: 'S-1' },
      { id: 'CDR-B', session_id: 'S-2' },
    ];
    const j = await stopWithCallback('S-1');
    expect((j.commandResult as { result?: string }).result).toBe('ACCEPTED');
    expect((j.cdr as { id?: string }).id).toBe('CDR-A');
    expect(j.cdrSource).toBe('pull');

    const pull = ctx.store.query({ direction: 'outbound', operation: 'pull.cdrs' });
    expect(pull).toHaveLength(1);
    expect(pull[0].request.url).toContain('limit=1000');
  });

  it('charge/stop: an uncorrelated pull returns the newest CDR flagged for manual check', async () => {
    cdrList = [
      { id: 'CDR-A', session_id: 'S-1' },
      { id: 'CDR-B', session_id: 'S-2' },
    ];
    const j = await stopWithCallback('S-NOPE');
    expect((j.cdr as { id?: string }).id).toBe('CDR-B');
    expect(j.cdrSource).toBe('pull-uncorrelated');
    expect(String(j.cdrNote)).toContain('could not match session_id');
  });

  it('charge/stop: an empty CDR page leaves cdrPending', async () => {
    cdrList = [];
    const j = await stopWithCallback('S-1');
    expect(j.cdrPending).toBe(true);
    expect(j.cdr).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Status: probeOcpi short-circuit + statusCache inflight coalescing
// ---------------------------------------------------------------------------
describe('status probe internals', () => {
  let app: FastifyInstance | undefined;
  let stub: StubCpo | undefined;

  afterEach(async () => {
    if (app) await app.close();
    if (stub) await stub.close();
    app = undefined;
    stub = undefined;
  });

  it('a recent outbound exchange satisfies probeOcpi without a versions fetch', async () => {
    stub = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path === '/graphql') return { json: { data: {} } };
      if (req.method === 'GET' && req.path === '/versions') return { json: { data: [] } };
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/locations') {
        return { json: ocpiEnvelope([]) };
      }
      return undefined;
    });
    ({ app } = makeServer(
      {
        citrineOcpiBaseUrl: stub.baseUrl,
        citrineVersionsUrl: `${stub.origin}/versions`,
        citrineHasuraUrl: `${stub.origin}/graphql`,
      },
      { everest: async () => ({ state: 'up', detail: null }) },
    ));
    await app.ready();

    const pull = await app.inject({ method: 'POST', url: '/_mock/pull/locations', payload: {} });
    expect(pull.statusCode).toBe(200);

    const res = await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' });
    const j = res.json();
    expect(j.citrine.ocpi.state).toBe('up');
    expect(j.citrine.ocpi.httpStatus).toBe(200);
    expect(j.citrine.ocpi.latencyMs).toBeNull(); // recent-outbound path, no live fetch
    expect(stub.requests.filter((r) => r.path === '/versions')).toHaveLength(0);
  });

  it('refreshAll reuses a probe already in flight instead of re-running it', async () => {
    stub = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path === '/graphql') return { json: { data: {} } };
      if (req.method === 'GET' && req.path === '/versions') return { json: { data: [] } };
      return undefined;
    });
    let everestCalls = 0;
    ({ app } = makeServer(
      {
        citrineVersionsUrl: `${stub.origin}/versions`,
        citrineHasuraUrl: `${stub.origin}/graphql`,
      },
      {
        everest: async () => {
          everestCalls++;
          await tick(150);
          return { state: 'up', detail: null };
        },
      },
    ));
    await app.ready();

    // Plain poll kicks the background probe; ?fresh=1 must join it, not restart it.
    await app.inject({ method: 'GET', url: '/_mock/status' });
    const fresh = await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' });
    expect(everestCalls).toBe(1);
    expect(fresh.json().everest.state).toBe('up');
  });

  it('a throwing probe is captured as degraded, never a 500', async () => {
    stub = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path === '/graphql') return { json: { data: {} } };
      if (req.method === 'GET' && req.path === '/versions') return { json: { data: [] } };
      return undefined;
    });
    ({ app } = makeServer(
      {
        citrineVersionsUrl: `${stub.origin}/versions`,
        citrineHasuraUrl: `${stub.origin}/graphql`,
      },
      {
        everest: async () => {
          throw new Error('docker exploded');
        },
      },
    ));
    await app.ready();

    const res = await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' });
    expect(res.statusCode).toBe(200);
    expect(res.json().degraded).toBe(true);
    expect(res.json().everest.state).toBe('unknown'); // never-succeeded probe stays unknown
  });
});

// ---------------------------------------------------------------------------
// Spec probes: GET /_mock/probes
// ---------------------------------------------------------------------------
describe('GET /_mock/probes — semantic conformance checks', () => {
  let app: FastifyInstance | undefined;
  let ctx: MockContext | undefined;
  let cpo: StubCpo | undefined;

  afterEach(async () => {
    if (app) await app.close();
    if (cpo) await cpo.close();
    app = undefined;
    cpo = undefined;
  });

  interface ProbeRow {
    id: string;
    ok: boolean;
    expected: string;
    actual: string;
    detail: string;
  }
  const probe = (j: { probes: ProbeRow[] }, id: string): ProbeRow => {
    const p = j.probes.find((x) => x.id === id);
    expect(p, `probe ${id} present`).toBeTruthy();
    return p as ProbeRow;
  };

  async function boot(connectorStatus: string, loc1Status: number): Promise<void> {
    cpo = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path === '/graphql') {
        return { json: { data: { Connectors: [{ status: connectorStatus }] } } };
      }
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/locations') {
        return {
          json: ocpiEnvelope([
            { id: '1', evses: [{ uid: 'cp001::1', status: 'UNKNOWN', connectors: [{ id: '1' }] }] },
          ]),
        };
      }
      if (req.method === 'GET' && req.path === '/ocpi/2.2.1/locations/LOC1') {
        return { status: loc1Status, json: ocpiEnvelope({}) };
      }
      return undefined;
    });
    ({ app, ctx } = makeServer({
      citrineOcpiBaseUrl: cpo.baseUrl,
      citrineHasuraUrl: `${cpo.origin}/graphql`,
    }));
    await app.ready();
  }

  const taggedFindings = (id: string): number =>
    ctx!.store.findings.filter((f) => f.detail.includes(`[${id}]`)).length;

  it('busy connector published as UNKNOWN fails; missing X-Total-Count fails; LOC1 200 passes', async () => {
    await boot('Occupied', 200);
    const res = await app!.inject({ method: 'GET', url: '/_mock/probes' });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.probes).toHaveLength(3);
    expect(j.failing).toBe(2);

    const evse = probe(j, 'evse-availability');
    expect(evse.ok).toBe(false);
    expect(evse.expected).toBe('OCCUPIED / CHARGING');
    expect(evse.actual).toBe('UNKNOWN');
    expect(evse.detail).toContain('Occupied');

    const pag = probe(j, 'pagination-total');
    expect(pag.ok).toBe(false);
    expect(pag.actual).toContain('absent');

    const sid = probe(j, 'string-location-id');
    expect(sid.ok).toBe(true);
    expect(sid.actual).toBe('HTTP 200');

    // Failing probes land in the findings ledger, passing ones do not.
    expect(taggedFindings('evse-availability')).toBe(1);
    expect(taggedFindings('pagination-total')).toBe(1);
    expect(taggedFindings('string-location-id')).toBe(0);

    // Locations was fetched twice this run: availability pull + pagination probe.
    expect(cpo!.requests.filter((r) => r.path === '/ocpi/2.2.1/locations')).toHaveLength(2);

    // A re-run replaces each probe verdict instead of stacking duplicates.
    await app!.inject({ method: 'GET', url: '/_mock/probes' });
    expect(taggedFindings('evse-availability')).toBe(1);
    expect(taggedFindings('pagination-total')).toBe(1);
  });

  it('an Available connector expects AVAILABLE; a 401 on LOC1 is inconclusive (fails)', async () => {
    await boot('Available', 401);
    const j = (await app!.inject({ method: 'GET', url: '/_mock/probes' })).json();

    const evse = probe(j, 'evse-availability');
    expect(evse.ok).toBe(true); // not busy, so UNKNOWN is not the busy-mapping bug
    expect(evse.expected).toBe('AVAILABLE');

    const sid = probe(j, 'string-location-id');
    expect(sid.ok).toBe(false);
    expect(sid.actual).toContain('not authorized');
    expect(sid.detail).toContain('Re-register');
    expect(taggedFindings('string-location-id')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Dashboard routes
// ---------------------------------------------------------------------------
describe('dashboard routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ app } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('GET / and GET /_mock/ui serve the same static HTML', async () => {
    const root = await app.inject({ method: 'GET', url: '/' });
    expect(root.statusCode).toBe(200);
    expect(root.headers['content-type']).toContain('text/html');
    expect(root.body).toContain('<');

    const ui = await app.inject({ method: 'GET', url: '/_mock/ui' });
    expect(ui.statusCode).toBe(200);
    expect(ui.body).toBe(root.body);
  });

  it('GET /_mock/ui2 serves the redesign preview when the file is present', async () => {
    const res = await app.inject({ method: 'GET', url: '/_mock/ui2' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });
});
