// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// The expect[] grammar of evaluateExpectations (bare asserts, metrics with every
// operator, dotted paths, registration.*, the three `on` selector forms) driven
// through /_mock/scenario + /_mock/scenarios/:id/evaluate, plus loadScenario.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import type { MockContext, Scenario } from '../src/core/types.js';
import { loadScenario, type EvaluationReport } from '../src/control/scenario.js';
import {
  makeServer,
  functionalHeaders,
  registrationHeaders,
  validSession,
  validLocationReferences,
  SEED_TOKEN_WE_ACCEPT,
} from './harness.js';

const CONTROL = { 'content-type': 'application/json' };

type Expectation = NonNullable<Scenario['expect']>[number];

describe('expect[] grammar', () => {
  let app: FastifyInstance;
  let ctx: MockContext;

  beforeEach(async () => {
    ({ app, ctx } = makeServer());
    await app.ready();
  });
  afterEach(async () => {
    await app.close();
  });

  async function applyInline(expectations: Expectation[], extra: Partial<Scenario> = {}) {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/scenario',
      headers: CONTROL,
      payload: JSON.stringify({
        name: 'inline-grammar',
        registration: 'preregistered',
        expect: expectations,
        ...extra,
      }),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().applied).toBe('inline-grammar');
  }

  async function evaluate(): Promise<EvaluationReport> {
    const res = await app.inject({
      method: 'POST',
      url: '/_mock/scenarios/inline-grammar/evaluate',
      headers: CONTROL,
    });
    expect(res.statusCode).toBe(200);
    return res.json() as EvaluationReport;
  }

  function row(report: EvaluationReport, on: string, assert: string) {
    const r = report.results.find((x) => x.on === on && x.assert === assert);
    expect(r, `no result row for on=${on} assert=${assert}`).toBeDefined();
    return r!;
  }

  /** One valid + one invalid sessions PUT, one authorize, one versions GET. */
  async function driveTraffic() {
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-1',
      headers: functionalHeaders(ctx.config, SEED_TOKEN_WE_ACCEPT),
      payload: JSON.stringify(validSession({ id: 'SESSION-1' })),
    });
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-2',
      headers: functionalHeaders(ctx.config, SEED_TOKEN_WE_ACCEPT),
      payload: JSON.stringify({ id: 'SESSION-2' }),
    });
    await app.inject({
      method: 'POST',
      url: '/ocpi/2.2.1/emsp/tokens/RFID-1/authorize?type=RFID',
      headers: functionalHeaders(ctx.config, SEED_TOKEN_WE_ACCEPT),
      payload: JSON.stringify(validLocationReferences()),
    });
    await app.inject({
      method: 'GET',
      url: '/ocpi/versions',
      headers: registrationHeaders(SEED_TOKEN_WE_ACCEPT),
    });
  }

  it('bare asserts: received / notReceived / hasFinding / hasError / valid / invalid', async () => {
    const expectations: Expectation[] = [
      { on: 'sessions.put', assert: 'received' },
      { on: 'cdrs.post', assert: 'notReceived' },
      { on: 'sessions.put', assert: 'hasFinding' },
      { on: 'sessions.put', assert: 'hasError' },
      { on: 'tokens.authorize', assert: 'valid' },
      { on: 'sessions.put', assert: 'invalid' },
      // aliases
      { on: 'versions.list', assert: 'exists' },
      { on: 'tariffs.put', assert: 'none' },
      { on: 'sessions.put', assert: 'validationFailed' },
      { on: 'versions.list', assert: 'validationOk' },
    ];
    await applyInline(expectations);
    await driveTraffic();
    const report = await evaluate();
    expect(report.scenario).toBe('inline-grammar');
    expect(report.total).toBe(expectations.length);
    expect(report.failures).toBe(0);
    expect(report.passed).toBe(true);
    expect(row(report, 'sessions.put', 'received').observed).toBe('count=2');
    expect(row(report, 'cdrs.post', 'notReceived').observed).toBe('count=0');
    expect(row(report, 'sessions.put', 'hasFinding').observed).toMatch(/^findings=[1-9]/);
    expect(row(report, 'sessions.put', 'hasError').observed).toMatch(/^errorFindings=[1-9]/);
    expect(row(report, 'tokens.authorize', 'valid').observed).toBe('ok=1/1');
    expect(row(report, 'sessions.put', 'invalid').observed).toBe('invalid=1');
  });

  it('bare asserts fail with the observed count / ratio, and the report says so', async () => {
    const expectations: Expectation[] = [
      { on: 'cdrs.post', assert: 'received', detail: 'we never pushed a CDR' },
      { on: 'sessions.put', assert: 'notReceived' },
      { on: 'tokens.authorize', assert: 'hasError' },
      { on: 'sessions.put', assert: 'valid' },
      { on: 'tokens.authorize', assert: 'invalid' },
      { on: 'cdrs.post', assert: 'valid' },
      { on: 'sessions.put', assert: 'frobnicate' },
    ];
    await applyInline(expectations);
    await driveTraffic();
    const report = await evaluate();
    expect(report.passed).toBe(false);
    expect(report.failures).toBe(expectations.length);
    expect(report.results.every((r) => r.pass === false)).toBe(true);
    const missing = row(report, 'cdrs.post', 'received');
    expect(missing.observed).toBe('count=0');
    expect(missing.detail).toBe('we never pushed a CDR');
    expect(row(report, 'sessions.put', 'notReceived').observed).toBe('count=2');
    expect(row(report, 'tokens.authorize', 'hasError').observed).toBe('errorFindings=0');
    expect(row(report, 'sessions.put', 'valid').observed).toBe('ok=1/2');
    expect(row(report, 'tokens.authorize', 'invalid').observed).toBe('invalid=0');
    // `valid` over an empty selection is a failure, not a vacuous pass.
    expect(row(report, 'cdrs.post', 'valid').observed).toBe('ok=0/0');
    expect(row(report, 'sessions.put', 'frobnicate').observed).toBe(
      'unsupported assert: frobnicate',
    );
  });

  it('metrics with every operator: count / findings / globalFindings / httpStatus / ocpiStatusCode / validationOk', async () => {
    const expectations: Expectation[] = [
      { on: 'sessions.put', assert: 'count == 2' },
      { on: 'sessions.put', assert: 'count != 3' },
      { on: 'sessions.put', assert: 'count > 1' },
      { on: 'sessions.put', assert: 'count >= 2' },
      { on: 'sessions.put', assert: 'count < 3' },
      { on: 'sessions.put', assert: 'count <= 2' },
      { on: 'sessions.put', assert: 'findings >= 1' },
      { on: 'tokens.authorize', assert: 'findings == 0' },
      { on: 'tokens.authorize', assert: 'globalFindings > 0' },
      { on: 'sessions.put', assert: 'httpStatus == 200' },
      { on: 'sessions.put', assert: 'ocpiStatusCode == 1000' },
      { on: 'sessions.put', assert: 'ocpiStatusCode < 2000' },
      // The last matched sessions.put is the invalid one.
      { on: 'sessions.put', assert: 'validationOk == false' },
      { on: 'tokens.authorize', assert: 'validationOk == true' },
      // Metric names are case-insensitive; whitespace around the operator is optional.
      { on: 'sessions.put', assert: 'COUNT==2' },
      { on: 'sessions.put', assert: 'HttpStatus  !=  500' },
    ];
    await applyInline(expectations);
    await driveTraffic();
    const report = await evaluate();
    const failed = report.results.filter((r) => !r.pass);
    expect(failed, JSON.stringify(failed)).toHaveLength(0);
    expect(row(report, 'sessions.put', 'count == 2').observed).toBe('count=2');
    expect(row(report, 'sessions.put', 'httpStatus == 200').observed).toBe('httpStatus=200');
    expect(row(report, 'sessions.put', 'validationOk == false').observed).toBe(
      'validationOk=false',
    );
    expect(row(report, 'tokens.authorize', 'globalFindings > 0').observed).toMatch(
      /^globalFindings=[1-9]/,
    );
  });

  it('metric comparisons report the observed value on failure', async () => {
    const expectations: Expectation[] = [
      { on: 'sessions.put', assert: 'count == 5' },
      { on: 'sessions.put', assert: 'count > 2' },
      { on: 'sessions.put', assert: 'count < 2' },
      { on: 'sessions.put', assert: 'count >= 3' },
      { on: 'sessions.put', assert: 'count <= 1' },
      { on: 'sessions.put', assert: 'count != 2' },
      { on: 'tokens.authorize', assert: 'httpStatus == 401' },
      { on: 'cdrs.post', assert: 'httpStatus == 200' },
      // Only dotted paths resolve against the exchange; a bare top-level field is unknown.
      { on: 'sessions.put', assert: 'direction == inbound' },
    ];
    await applyInline(expectations);
    await driveTraffic();
    const report = await evaluate();
    expect(report.passed).toBe(false);
    expect(report.failures).toBe(expectations.length);
    expect(row(report, 'sessions.put', 'count == 5').observed).toBe('count=2');
    expect(row(report, 'tokens.authorize', 'httpStatus == 401').observed).toBe('httpStatus=200');
    // Nothing matched: the metric is undefined, which JSON.stringify drops.
    expect(row(report, 'cdrs.post', 'httpStatus == 200').observed).toBe('httpStatus=undefined');
    expect(row(report, 'sessions.put', 'direction == inbound').observed).toBe(
      'direction=undefined',
    );
  });

  it('dotted paths resolve against the last matched exchange; registration.* against domain state', async () => {
    const expectations: Expectation[] = [
      { on: 'sessions.put', assert: 'response.httpStatus == 200' },
      { on: 'sessions.put', assert: "request.body.id == 'SESSION-2'" },
      { on: 'sessions.put', assert: 'request.body.id != SESSION-1' },
      { on: 'sessions.put', assert: 'validation.ok == false' },
      { on: 'sessions.put', assert: 'request.method == PUT' },
      { on: 'tokens.authorize', assert: 'response.body.data.allowed == ALLOWED' },
      { on: 'tokens.authorize', assert: 'response.body.data.token.uid == "RFID-1"' },
      { on: 'tokens.authorize', assert: 'response.body.status_code == 1000' },
      { on: 'tokens.authorize', assert: 'request.ocpi.from.party == S44' },
      { on: 'tokens.authorize', assert: 'response.body.data.missing == undefined' },
      { on: 'versions.list', assert: 'response.body.data.0.version == 2.2.1' },
      { on: 'sessions.put', assert: 'registration.status == registered' },
      { on: 'cdrs.post', assert: 'registration.status == registered' },
      { on: 'cdrs.post', assert: `registration.tokenWeAccept == ${SEED_TOKEN_WE_ACCEPT}` },
      { on: 'cdrs.post', assert: 'registration.cpoEndpoints.length == 0' },
    ];
    await applyInline(expectations);
    await driveTraffic();
    const report = await evaluate();
    const failed = report.results.filter((r) => !r.pass);
    expect(failed, JSON.stringify(failed)).toHaveLength(0);
    expect(row(report, 'sessions.put', "request.body.id == 'SESSION-2'").observed).toBe(
      'request.body.id="SESSION-2"',
    );
    expect(row(report, 'sessions.put', 'registration.status == registered').observed).toBe(
      'registration.status="registered"',
    );
  });

  it('dotted paths against a selection with no exchanges are undefined (fail unless compared to undefined)', async () => {
    await applyInline([
      { on: 'cdrs.post', assert: 'response.httpStatus == 200' },
      { on: 'cdrs.post', assert: 'response.httpStatus == undefined' },
    ]);
    const report = await evaluate();
    expect(row(report, 'cdrs.post', 'response.httpStatus == 200').pass).toBe(false);
    expect(row(report, 'cdrs.post', 'response.httpStatus == 200').observed).toBe(
      'response.httpStatus=undefined',
    );
    expect(row(report, 'cdrs.post', 'response.httpStatus == undefined').pass).toBe(true);
  });

  it('`on` selects by exact operation, operation substring, module name, or a JSON ExchangeFilter', async () => {
    const jsonValid = JSON.stringify({
      direction: 'inbound',
      operation: 'sessions.put',
      validationOk: true,
    });
    const jsonPath = JSON.stringify({ pathMatches: 'SESSION-2$' });
    const expectations: Expectation[] = [
      { on: 'sessions.put', assert: 'count == 2' },
      { on: 'authorize', assert: 'count == 1' },
      { on: 'sessions', assert: 'count == 2' },
      { on: 'tokens', assert: 'count == 1' },
      { on: 'versions', assert: 'count == 1' },
      { on: jsonValid, assert: 'count == 1' },
      { on: jsonValid, assert: 'request.body.id == SESSION-1' },
      { on: jsonPath, assert: 'request.body.id == SESSION-2' },
      { on: '{"direction":"outbound"}', assert: 'notReceived' },
      { on: '{not json', assert: 'notReceived' },
      { on: 'nothing.like.this', assert: 'count == 0' },
    ];
    await applyInline(expectations);
    await driveTraffic();
    const report = await evaluate();
    const failed = report.results.filter((r) => !r.pass);
    expect(failed, JSON.stringify(failed)).toHaveLength(0);
  });

  it('applyScenario merges the identity override, visible in /_mock/health', async () => {
    await applyInline([], { identity: { country_code: 'DE', party_id: 'XYZ' } });
    expect(ctx.identity.country_code).toBe('DE');
    expect(ctx.identity.party_id).toBe('XYZ');
    expect(ctx.identity.role).toBe('EMSP');
    expect(ctx.identity.business_details.name).toBe('TestMobilitySolutions');
    const health = await app.inject({ method: 'GET', url: '/_mock/health' });
    expect(health.json().party).toBe('DE/XYZ');
    expect(health.json().scenario).toBe('inline-grammar');
    // Routing headers are checked against config, not identity, so CPO traffic still lands.
    const res = await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-1',
      headers: functionalHeaders(ctx.config, SEED_TOKEN_WE_ACCEPT),
      payload: JSON.stringify(validSession()),
    });
    expect(res.statusCode).toBe(200);
  });

  it('evaluate 409s when no scenario is active; an empty expect[] passes trivially', async () => {
    const none = await app.inject({
      method: 'POST',
      url: '/_mock/scenarios/anything/evaluate',
      headers: CONTROL,
    });
    expect(none.statusCode).toBe(409);
    expect(none.json().error).toBe('no_active_scenario');

    await applyInline([]);
    const report = await evaluate();
    expect(report).toEqual({
      scenario: 'inline-grammar',
      passed: true,
      total: 0,
      failures: 0,
      results: [],
    });
  });
});

describe('loadScenario', () => {
  const fixtureAbs = fileURLToPath(new URL('../scenarios/authorize-blocked.json', import.meta.url));
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'mock-msp-scenario-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('resolves a relative path against the current working directory', () => {
    const rel = relative(process.cwd(), fixtureAbs);
    const scn = loadScenario(rel);
    expect(scn.name).toBe('authorize-blocked');
    expect(scn.registration).toBe('preregistered');
    expect(scn.authorize?.byUid?.['04E7F5A2B37C80']).toBe('BLOCKED');
    expect(scn.expect).toHaveLength(1);
  });

  it('throws on unparsable JSON', () => {
    const p = join(dir, 'broken.json');
    writeFileSync(p, '{ "name": "broken", ');
    expect(() => loadScenario(p)).toThrow(SyntaxError);
  });

  it('throws when the JSON is not a valid Scenario', () => {
    const p = join(dir, 'invalid.json');
    writeFileSync(p, JSON.stringify({ name: 'x', registration: 'sort-of' }));
    expect(() => loadScenario(p)).toThrow();
  });

  it('throws on a missing file', () => {
    expect(() => loadScenario(join(dir, 'nope.json'))).toThrow(/ENOENT/);
  });
});
