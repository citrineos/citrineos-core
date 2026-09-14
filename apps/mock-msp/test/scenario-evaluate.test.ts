// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// The expect[] assertion oracle, exercised against every shipped fixture.
//     Each scenario is loaded, the minimal OCPI traffic its expectation refers
//     to is driven, and evaluateExpectations(...) must report passed===true.
//     This guards the metric() grammar (dotted paths resolved against the last
//     matched exchange / the live domain state) that the fixtures rely on.
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import { loadScenario, applyScenario, evaluateExpectations } from '../src/control/scenario.js';
import {
  makeServer,
  startStubCpo,
  functionalHeaders,
  registrationHeaders,
  cpoCredentials,
  cpoVersionsPayloads,
  validLocationReferences,
  SEED_TOKEN_WE_ACCEPT,
  type StubCpo,
} from './harness.js';

function scenarioPath(rel: string): string {
  return fileURLToPath(new URL(`../scenarios/${rel}`, import.meta.url));
}

/** A stub CPO that serves version discovery (list + 2.2.1 details). */
async function startVersionsCpo(): Promise<StubCpo> {
  const self: StubCpo = await startStubCpo((req) => {
    const p = cpoVersionsPayloads(self.baseUrl);
    if (req.method === 'GET' && req.path === '/ocpi/versions') return { json: p.list };
    if (req.method === 'GET' && req.path === '/ocpi/versions/2.2.1') return { json: p.details };
    return undefined;
  });
  return self;
}

describe('expect[] oracle over the shipped scenario fixtures', () => {
  // ---- authorize-blocked: response.body.data.allowed == BLOCKED -------------
  describe('authorize-blocked', () => {
    let app: FastifyInstance;
    let ctx: MockContext;
    beforeEach(async () => {
      ({ app, ctx } = makeServer());
      await app.ready();
    });
    afterEach(async () => {
      await app.close();
    });

    it('evaluate passes: the blocked uid returns allowed=BLOCKED', async () => {
      const scn = loadScenario(scenarioPath('authorize-blocked.json'));
      applyScenario(ctx, scn);
      await app.inject({
        method: 'POST',
        url: '/ocpi/2.2.1/emsp/tokens/04E7F5A2B37C80/authorize?type=RFID',
        headers: functionalHeaders(ctx.config, SEED_TOKEN_WE_ACCEPT),
        payload: JSON.stringify(validLocationReferences()),
      });
      const report = evaluateExpectations(ctx, scn);
      expect(report.passed).toBe(true);
      expect(report.results[0].observed).toContain('BLOCKED');
    });
  });

  // ---- known-bugs: response.body.data.authorization_reference == undefined --
  describe('authorization-reference-required (known bug)', () => {
    let app: FastifyInstance;
    let ctx: MockContext;
    beforeEach(async () => {
      ({ app, ctx } = makeServer());
      await app.ready();
    });
    afterEach(async () => {
      await app.close();
    });

    it('evaluate passes: the fault drops data.authorization_reference', async () => {
      const scn = loadScenario(scenarioPath('known-bugs/authorization-reference-required.json'));
      applyScenario(ctx, scn);
      const res = await app.inject({
        method: 'POST',
        url: '/ocpi/2.2.1/emsp/tokens/RFID-1/authorize?type=RFID',
        headers: functionalHeaders(ctx.config, SEED_TOKEN_WE_ACCEPT),
        payload: JSON.stringify(validLocationReferences()),
      });
      // The armed fault stripped the field from the wire body.
      expect(res.json().data.authorization_reference).toBeUndefined();
      const report = evaluateExpectations(ctx, scn);
      expect(report.passed).toBe(true);
    });
  });

  // ---- preregistered: validation.ok == true (on versions.details) ----------
  describe('preregistered', () => {
    let app: FastifyInstance;
    let ctx: MockContext;
    let cpo: StubCpo;
    beforeEach(async () => {
      cpo = await startVersionsCpo();
      ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
      await app.ready();
    });
    afterEach(async () => {
      await app.close();
      await cpo.close();
    });

    it('evaluate passes: the CPO version details parse cleanly', async () => {
      const scn = loadScenario(scenarioPath('preregistered.json'));
      applyScenario(ctx, scn);
      // reregister re-fetches the CPO versions + 2.2.1 details, recording a
      // 'versions.details' exchange whose validation.ok is true.
      await ctx.client.reregister();
      const report = evaluateExpectations(ctx, scn);
      expect(report.passed).toBe(true);
    });
  });

  // ---- unregistered: registration.status == registered (on credentials.post)
  describe('unregistered', () => {
    let app: FastifyInstance;
    let ctx: MockContext;
    let cpo: StubCpo;
    beforeEach(async () => {
      cpo = await startVersionsCpo();
      ({ app, ctx } = makeServer({ citrineOcpiBaseUrl: cpo.baseUrl }));
      await app.ready();
    });
    afterEach(async () => {
      await app.close();
      await cpo.close();
    });

    it('evaluate passes: the handshake flips registration to registered', async () => {
      const scn = loadScenario(scenarioPath('unregistered.json'));
      applyScenario(ctx, scn); // installs 'unregistered' state
      await app.inject({
        method: 'POST',
        url: '/ocpi/2.2.1/credentials',
        headers: registrationHeaders(ctx.store.domain.registration.tokenWeAccept),
        payload: JSON.stringify(cpoCredentials(`${cpo.baseUrl}/versions`, 'CPO-ISSUED-TOKEN')),
      });
      expect(ctx.store.domain.registration.status).toBe('registered');
      const report = evaluateExpectations(ctx, scn);
      expect(report.passed).toBe(true);
    });
  });
});
