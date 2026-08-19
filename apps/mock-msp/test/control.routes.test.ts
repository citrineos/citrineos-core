// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The /_mock routes control.test.ts does not touch: state slices, received/wait
// twins, exchange lookup + paging, scenario hot-load/evaluate, authorize policy,
// the registration/actor routes against a stub CPO, and the fault edge cases.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { CommandType, ModuleId } from '../src/ocpi/barrel.js';
import {
  makeServer,
  startStubCpo,
  functionalHeaders,
  cpoCredentials,
  cpoVersionsPayloads,
  ocpiEnvelope,
  validSession,
  validLocationReferences,
  SEED_TOKEN_WE_ACCEPT,
  type StubCpo,
  type StubCpoRequest,
  type StubCpoReply,
} from './harness.js';

const tick = (ms = 50): Promise<void> => new Promise((r) => setTimeout(r, ms));

const DOMAIN_MODULES = [
  'registration',
  'locations',
  'sessions',
  'cdrs',
  'tariffs',
  'tokens',
  'authorizations',
  'commands',
];

function versionsReply(req: StubCpoRequest, baseUrl: string): StubCpoReply | undefined {
  const payloads = cpoVersionsPayloads(baseUrl);
  if (req.method === 'GET' && req.path === '/ocpi/versions') return { json: payloads.list };
  if (req.method === 'GET' && req.path === '/ocpi/versions/2.2.1')
    return { json: payloads.details };
  return undefined;
}

describe('/_mock inspection routes', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  function putSession(id: string) {
    return app.inject({
      method: 'PUT',
      url: `/ocpi/2.2.1/emsp/sessions/US/TST/${id}`,
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validSession({ id })),
    });
  }

  it('GET /_mock/state returns the whole domain snapshot', async () => {
    await putSession('ST-1');
    const res = await app.inject({ method: 'GET', url: '/_mock/state' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Object.keys(body).sort()).toEqual([...DOMAIN_MODULES].sort());
    expect(body.registration.status).toBe('registered');
    expect(body.sessions['US/TST/ST-1'].id).toBe('ST-1');
    expect(body.cdrs).toEqual({});
  });

  it('GET /_mock/state/:module serves every slice and 404s an unknown one', async () => {
    await putSession('ST-2');
    for (const mod of DOMAIN_MODULES) {
      const res = await app.inject({ method: 'GET', url: `/_mock/state/${mod}` });
      expect(res.statusCode, mod).toBe(200);
      expect(typeof res.json(), mod).toBe('object');
    }
    const sessions = await app.inject({ method: 'GET', url: '/_mock/state/sessions' });
    expect(Object.keys(sessions.json())).toEqual(['US/TST/ST-2']);
    const reg = await app.inject({ method: 'GET', url: '/_mock/state/registration' });
    expect(reg.json().tokenWeAccept).toBe(SEED_TOKEN_WE_ACCEPT);

    const unknown = await app.inject({ method: 'GET', url: '/_mock/state/nope' });
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json()).toEqual({ error: 'unknown_module', module: 'nope' });
  });

  it('GET /_mock/received/:module defaults to inbound and honours ?direction=outbound', async () => {
    await putSession('RCV-1');
    ctx.store.record(
      ctx.store.open({
        direction: 'outbound',
        module: ModuleId.Sessions,
        operation: 'pull.sessions',
      }),
    );

    const inbound = await app.inject({ method: 'GET', url: '/_mock/received/sessions' });
    expect(inbound.json()).toHaveLength(1);
    expect(inbound.json()[0].direction).toBe('inbound');
    expect(inbound.json()[0].request.path).toContain('RCV-1');

    const outbound = await app.inject({
      method: 'GET',
      url: '/_mock/received/sessions?direction=outbound',
    });
    expect(outbound.json()).toHaveLength(1);
    expect(outbound.json()[0].operation).toBe('pull.sessions');
  });

  it('GET /_mock/wait resolves when matching traffic arrives', async () => {
    const waiting = app.inject({
      method: 'GET',
      url: '/_mock/wait?module=sessions&direction=inbound&method=PUT&timeoutMs=3000',
    });
    await tick();
    await putSession('GW-1');
    const res = await waiting;
    expect(res.statusCode).toBe(200);
    expect(res.json().module).toBe('sessions');
    expect(res.json().request.path).toContain('GW-1');
  });

  it('GET /_mock/wait times out with 408 + nearMisses', async () => {
    await putSession('GW-2');
    const res = await app.inject({
      method: 'GET',
      url: '/_mock/wait?module=cdrs&direction=inbound&timeoutMs=150',
    });
    expect(res.statusCode).toBe(408);
    const body = res.json();
    expect(body.error).toBe('timeout');
    expect(body.filter).toEqual({ module: 'cdrs', direction: 'inbound' });
    expect(body.timeoutMs).toBe(150);
    expect(body.nearMisses).toHaveLength(1);
    expect(body.nearMisses[0].differsBy).toContain('module=sessions');
  });

  it('GET /_mock/exchanges/:id returns one exchange or 404', async () => {
    await putSession('ID-1');
    const ex = ctx.store.query({ operation: 'sessions.put' }).at(-1)!;
    const found = await app.inject({ method: 'GET', url: `/_mock/exchanges/${ex.id}` });
    expect(found.statusCode).toBe(200);
    expect(found.json().id).toBe(ex.id);
    expect(found.json().seq).toBe(ex.seq);

    const missing = await app.inject({ method: 'GET', url: '/_mock/exchanges/0-missing' });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toEqual({ error: 'not_found' });
  });

  it('GET /_mock/exchanges pages with limit/offset and accepts ?filter=<json>', async () => {
    await putSession('PG-1');
    await putSession('PG-2');
    await putSession('PG-3');
    const all = ctx.store.query({ operation: 'sessions.put' });
    expect(all).toHaveLength(3);

    const page = await app.inject({
      method: 'GET',
      url: '/_mock/exchanges?module=sessions&limit=1&offset=1',
    });
    expect(page.json().map((e: { id: string }) => e.id)).toEqual([all[1].id]);

    const filter = encodeURIComponent(
      JSON.stringify({ direction: 'inbound', module: 'sessions', method: 'PUT' }),
    );
    const viaJson = await app.inject({ method: 'GET', url: `/_mock/exchanges?filter=${filter}` });
    const viaParams = await app.inject({
      method: 'GET',
      url: '/_mock/exchanges?direction=inbound&module=sessions&method=PUT',
    });
    const ids = (res: typeof viaJson) => res.json().map((e: { id: string }) => e.id);
    expect(ids(viaJson)).toEqual(all.map((e) => e.id));
    expect(ids(viaParams)).toEqual(ids(viaJson));
  });
});

describe('/_mock scenario + authorize routes', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('POST /_mock/scenario hot-loads a valid scenario into the runtime', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/scenario',
      payload: {
        name: 'hot-loaded',
        registration: 'preregistered',
        authorize: { default: 'BLOCKED', byUid: { 'UID-1': 'EXPIRED' } },
        strictInbound: true,
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.applied).toBe('hot-loaded');
    expect(body.runtime.name).toBe('hot-loaded');
    expect(body.runtime.authorize).toEqual({ default: 'BLOCKED', byUid: { 'UID-1': 'EXPIRED' } });
    expect(body.runtime.strictInbound).toBe(true);

    const runtime = await app.inject({ method: 'GET', url: '/_mock/scenario' });
    expect(runtime.json().activeScenario.name).toBe('hot-loaded');

    // The tokens module answers from the same runtime.
    const auth = await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/tokens/UID-1/authorize?type=RFID',
      headers: functionalHeaders(ctx.config, ctx.config.bootstrapTokenWeAccept),
      payload: JSON.stringify(validLocationReferences()),
    });
    expect(auth.json().data.allowed).toBe('EXPIRED');
  });

  it('POST /_mock/scenario rejects an invalid scenario with 400 invalid_scenario', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/scenario',
      payload: { name: 'broken', registration: 'sometimes' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('invalid_scenario');
    expect(res.json().issues.length).toBeGreaterThan(0);
    const runtime = await app.inject({ method: 'GET', url: '/_mock/scenario' });
    expect(runtime.json().name).toBeNull();
  });

  it('POST /_mock/scenarios/:id/evaluate: 409 without a scenario, report once one is loaded', async () => {
    await app.inject({ method: 'POST', url: '/_mock/reset', payload: {} });
    const none = await app.inject({ method: 'POST', url: '/_mock/scenarios/any/evaluate' });
    expect(none.statusCode).toBe(409);
    expect(none.json()).toEqual({ error: 'no_active_scenario' });

    await app.inject({
      method: 'POST',
      url: '/_mock/scenario',
      payload: {
        name: 'eval-me',
        registration: 'preregistered',
        expect: [
          { on: 'sessions.put', assert: 'received' },
          { on: 'cdrs', assert: 'notReceived' },
        ],
      },
    });
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/EV-1',
      headers: functionalHeaders(ctx.config, ctx.config.bootstrapTokenWeAccept),
      payload: JSON.stringify(validSession({ id: 'EV-1' })),
    });

    const res = await app.inject({ method: 'POST', url: '/_mock/scenarios/eval-me/evaluate' });
    expect(res.statusCode).toBe(200);
    const report = res.json();
    expect(report.scenario).toBe('eval-me');
    expect(report.passed).toBe(true);
    expect(report.total).toBe(2);
    expect(report.failures).toBe(0);
    expect(report.results.map((r: { pass: boolean }) => r.pass)).toEqual([true, true]);
  });

  it('POST /_mock/authorize sets the live policy; an invalid value is 400 invalid_authorize', async () => {
    const ok = await app.inject({
      method: 'POST',
      url: '/_mock/authorize',
      payload: { default: 'BLOCKED', byUid: { 'RFID-X': 'NO_CREDIT' } },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().authorize).toEqual({ default: 'BLOCKED', byUid: { 'RFID-X': 'NO_CREDIT' } });
    const health = await app.inject({ method: 'GET', url: '/_mock/health' });
    expect(health.json().authorize).toBe('BLOCKED');

    const bad = await app.inject({
      method: 'POST',
      url: '/_mock/authorize',
      payload: { default: 'MAYBE' },
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('invalid_authorize');
    expect(bad.json().issues.length).toBeGreaterThan(0);
    // Policy untouched by the rejected write.
    expect((await app.inject({ method: 'GET', url: '/_mock/health' })).json().authorize).toBe(
      'BLOCKED',
    );
  });
});

describe('/_mock registration routes against a stub CPO', () => {
  const TOKEN_A = 'TOKEN-A-FROM-CPO';
  const CPO_TOKEN = 'CPO-TOKEN-FOR-US';
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;
  let generateStatus: number;
  let postStatus: number;
  // what the CPO sees while it handles our credentials POST: is the token we
  // hand it already accepted on our side? Citrine calls our versions endpoint
  // with it before answering the POST.
  let acceptedDuringPost: boolean | undefined;

  beforeEach(async () => {
    generateStatus = 200;
    postStatus = 200;
    acceptedDuringPost = undefined;
    cpo = await startStubCpo((req) => {
      const versions = versionsReply(req, cpo.baseUrl);
      if (versions) return versions;
      const creds = (token: string) =>
        ocpiEnvelope(cpoCredentials(`${cpo.baseUrl}/versions`, token));
      if (
        req.method === 'POST' &&
        req.path === '/ocpi/2.2.1/credentials/generate-credentials-token-a'
      ) {
        if (generateStatus !== 200) return { status: generateStatus, json: { error: 'stub_down' } };
        return { json: creds(TOKEN_A) };
      }
      if (
        req.method === 'POST' &&
        req.path === '/ocpi/2.2.1/credentials/register-credentials-token-a'
      ) {
        return { json: creds('ignored') };
      }
      if (req.method === 'POST' && req.path === '/ocpi/2.2.1/credentials') {
        const offered = (req.body as { token?: string } | undefined)?.token;
        acceptedDuringPost = offered === ctx.store.domain.registration.tokenWeAccept;
        if (postStatus !== 200) return { status: postStatus, json: { error: 'stub_down' } };
        return { json: creds(CPO_TOKEN) };
      }
      if (req.method === 'DELETE' && req.path === '/ocpi/2.2.1/credentials') {
        return { json: ocpiEnvelope(undefined) };
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

  it('POST /_mock/register?mode=msp-initiated mints TOKEN_A, discovers, POSTs credentials', async () => {
    ctx.store.domain.registration.status = 'unregistered';
    const res = await app.inject({ method: 'POST', url: '/_mock/register?mode=msp-initiated' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.registered).toBe(true);
    expect(body.alreadyRegistered).toBeUndefined();
    expect(body.registration.status).toBe('registered');
    expect(body.registration.tokenWePresent).toBe(CPO_TOKEN);
    expect(body.registration.tokenA).toBeUndefined();

    const paths = cpo.requests.map((r) => `${r.method} ${r.path}`);
    expect(paths).toEqual([
      'POST /ocpi/2.2.1/credentials/generate-credentials-token-a',
      'GET /ocpi/versions',
      'GET /ocpi/versions/2.2.1',
      'POST /ocpi/2.2.1/credentials',
    ]);
    const post = cpo.requests.at(-1)!.body as { token: string; url: string; roles: unknown[] };
    expect(post.token).toBe(ctx.store.domain.registration.tokenWeAccept);
    expect(post.url).toBe(`${ctx.config.publicBaseUrl}/versions`);
    expect(post.roles).toHaveLength(1);
    expect(ctx.store.domain.registration.cpoCredentialsUrl).toBe(
      `${cpo.baseUrl}/2.2.1/credentials`,
    );
    expect(acceptedDuringPost).toBe(true);
  });

  it('msp-initiated: a failed credentials POST puts the previous inbound token back', async () => {
    ctx.store.domain.registration.status = 'unregistered';
    const before = ctx.store.domain.registration.tokenWeAccept;
    postStatus = 500;
    const res = await app.inject({ method: 'POST', url: '/_mock/register?mode=msp-initiated' });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('register_failed');
    expect(acceptedDuringPost).toBe(true);
    expect(ctx.store.domain.registration.tokenWeAccept).toBe(before);
    expect(ctx.store.domain.registration.status).toBe('unregistered');
  });

  it('POST /_mock/register?mode=cpo-initiated hands the CPO our TOKEN_A + versions url', async () => {
    ctx.store.domain.registration.status = 'unregistered';
    const res = await app.inject({ method: 'POST', url: '/_mock/register?mode=cpo-initiated' });
    expect(res.statusCode).toBe(200);
    expect(res.json().registered).toBe(true);
    expect(cpo.requests).toHaveLength(1);
    const sent = cpo.requests[0];
    expect(sent.path).toBe('/ocpi/2.2.1/credentials/register-credentials-token-a');
    const body = sent.body as { token: string; url: string; roles: Array<{ role: string }> };
    expect(body.token).toBe(res.json().registration.tokenA);
    expect(body.url).toBe(`${ctx.config.publicBaseUrl}/versions`);
    expect(body.roles[0].role).toBe('EMSP');
    // The rest of the handshake happens inbound, so the status is still pending here.
    expect(ctx.store.domain.registration.status).toBe('unregistered');
  });

  it('POST /_mock/register is a no-op when already registered', async () => {
    const res = await app.inject({ method: 'POST', url: '/_mock/register' });
    expect(res.statusCode).toBe(200);
    expect(res.json().registered).toBe(true);
    expect(res.json().alreadyRegistered).toBe(true);
    expect(res.json().registration.tokenWeAccept).toBe(SEED_TOKEN_WE_ACCEPT);
    expect(cpo.requests).toHaveLength(0);
  });

  it('POST /_mock/register answers 502 register_failed when the CPO cannot mint TOKEN_A', async () => {
    generateStatus = 500;
    ctx.store.domain.registration.status = 'unregistered';
    const res = await app.inject({ method: 'POST', url: '/_mock/register?mode=msp-initiated' });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('register_failed');
    expect(res.json().message).toMatch(/generate-credentials-token-a/);
    expect(ctx.store.domain.registration.status).toBe('unregistered');
  });

  it('POST /_mock/unregister DELETEs our credentials at the CPO and drops the registration', async () => {
    ctx.store.domain.registration.cpoCredentialsUrl = `${cpo.baseUrl}/2.2.1/credentials`;
    const res = await app.inject({ method: 'POST', url: '/_mock/unregister' });
    expect(res.statusCode).toBe(200);
    expect(res.json().unregistered).toBe(true);
    expect(res.json().registration.status).toBe('unregistered');
    expect(cpo.requests.map((r) => `${r.method} ${r.path}`)).toEqual([
      'DELETE /ocpi/2.2.1/credentials',
    ]);

    const reg = await app.inject({ method: 'GET', url: '/_mock/registration' });
    expect(reg.json().status).toBe('unregistered');
    expect(reg.json().tokenWePresent).toBe('');
    expect(reg.json().cpoEndpoints).toEqual([]);
    const health = await app.inject({ method: 'GET', url: '/_mock/health' });
    expect(health.json().registration.status).toBe('unregistered');
  });
});

describe('/_mock actor routes against a stub CPO', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;

  beforeEach(async () => {
    cpo = await startStubCpo((req) => {
      if (req.method === 'POST' && req.path === '/ocpi/2.2.1/commands/START_SESSION') {
        return { json: ocpiEnvelope({ result: 'ACCEPTED', timeout: 30 }) };
      }
      if (
        req.method === 'GET' &&
        /^\/ocpi\/2\.2\.1\/(locations|sessions|cdrs|tariffs)$/.test(req.path)
      ) {
        return { json: ocpiEnvelope([]) };
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

  it('POST /_mock/commands/:type rejects an unknown type with the valid list', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/commands/WARP_DRIVE',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: 'unknown_command_type',
      got: 'WARP_DRIVE',
      valid: Object.values(CommandType),
    });
    expect(cpo.requests).toHaveLength(0);
  });

  it('POST /_mock/emit/command {type,payload} sends the command and returns the sync reply', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/emit/command',
      payload: { type: 'START_SESSION', payload: { location_id: 'LOC-9' } },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.command).toBe('START_SESSION');
    expect(body.sync).toEqual({ result: 'ACCEPTED', timeout: 30 });
    expect(body.responseUrl).toContain('/2.2.1/emsp/commands/START_SESSION/');
    expect(body.payloadValidation).toEqual({ ok: true });

    expect(cpo.requests).toHaveLength(1);
    const sent = cpo.requests[0].body as {
      location_id: string;
      response_url: string;
      token: unknown;
    };
    expect(sent.location_id).toBe('LOC-9');
    expect(sent.response_url).toBe(body.responseUrl);
    expect(sent.token).toBeDefined(); // filled from the per-type defaults
    expect(ctx.store.domain.commands.size).toBe(1);
  });

  it('POST /_mock/pull/:module GETs the CPO SENDER endpoint for each pullable module', async () => {
    for (const mod of ['locations', 'sessions', 'cdrs', 'tariffs']) {
      const res = await app.inject({ method: 'POST', url: `/_mock/pull/${mod}` });
      expect(res.statusCode, mod).toBe(200);
      const body = res.json();
      expect(body.pulled).toBe(mod);
      expect(body.exchange.direction).toBe('outbound');
      expect(body.exchange.operation).toBe(`pull.${mod}`);
      expect(body.exchange.response.httpStatus).toBe(200);
      expect(body.exchange.validation.ok).toBe(true);
    }
    expect(cpo.requests.map((r) => r.path)).toEqual([
      '/ocpi/2.2.1/locations',
      '/ocpi/2.2.1/sessions',
      '/ocpi/2.2.1/cdrs',
      '/ocpi/2.2.1/tariffs',
    ]);
  });

  it('POST /_mock/pull/:module rejects an unknown module with 400', async () => {
    const res = await app.inject({ method: 'POST', url: '/_mock/pull/unicorns' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe('unknown_module');
    expect(res.json().valid).toEqual(['locations', 'sessions', 'cdrs', 'tariffs']);
    expect(cpo.requests).toHaveLength(0);
  });
});

describe('/_mock fault route edge cases', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    ({ app } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  it('DELETE /_mock/faults/:id is idempotent for an unknown id', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/_mock/faults/never-armed' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ disarmed: 'never-armed' });
  });

  it('POST /_mock/fault arms with a generated id, and rejects an invalid rule with 400', async () => {
    const armed = await app.inject({
      method: 'POST',
      url: '/_mock/fault',
      payload: { match: { direction: 'inbound', module: 'versions' }, action: { kind: 'abort' } },
    });
    expect(armed.statusCode).toBe(200);
    expect(armed.json().armed).toMatch(/^fault-/);
    expect(armed.json().rule.enabled).toBe(true);

    const bad = await app.inject({
      method: 'POST',
      url: '/_mock/fault',
      payload: { match: {}, action: { kind: 'teleport' } },
    });
    expect(bad.statusCode).toBe(400);
    expect(bad.json().error).toBe('invalid_fault');
    expect(bad.json().issues.length).toBeGreaterThan(0);
    const listed = await app.inject({ method: 'GET', url: '/_mock/faults' });
    expect(listed.json()).toHaveLength(1);
  });
});
