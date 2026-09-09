// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// The GET /_mock/coverage matrix — a pure read over the recorder that buckets
// every exchange by {module, direction} into a { count, lastOk } cell. These
// tests boot the in-process app (harness), drive a couple of real exchanges
// (one inbound push via app.inject, one outbound pull against a stub CPO), and
// assert the matrix shape, per-direction bucketing, lastOk semantics, and that
// an unexercised module reports count 0 / lastOk null.
// ============================================================================
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import {
  makeServer,
  functionalHeaders,
  validSession,
  startStubCpo,
  ocpiEnvelope,
  type StubCpo,
} from './harness.js';

// The modules the endpoint always enumerates (COVERAGE_MODULES in control-api.ts).
const ALL_MODULES = [
  'locations',
  'tariffs',
  'sessions',
  'cdrs',
  'tokens',
  'commands',
  'credentials',
  'versions',
  'chargingprofiles',
] as const;

interface Cell {
  count: number;
  lastOk: boolean | null;
}
interface Row {
  module: string;
  inbound: Cell;
  outbound: Cell;
}

describe('GET /_mock/coverage — module×direction matrix', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let cpo: StubCpo;

  beforeEach(async () => {
    // Stub Citrine's CPO SENDER endpoints so an outbound pull records a clean,
    // schema-valid (empty-list) response instead of hitting the unreachable
    // default citrineOcpiBaseUrl.
    cpo = await startStubCpo((req) => {
      if (req.method === 'GET' && req.path.startsWith('/ocpi/2.2.1/')) {
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

  function putSession(id: string, body?: Record<string, unknown>) {
    return app.inject({
      method: 'PUT',
      url: `/ocpi/2.2.1/emsp/sessions/US/TST/${id}`,
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(body ?? validSession({ id })),
    });
  }

  async function getCoverage(): Promise<{ modules: Row[]; generatedAt: string }> {
    const res = await app.inject({ method: 'GET', url: '/_mock/coverage' });
    expect(res.statusCode).toBe(200);
    return res.json();
  }

  const row = (rows: Row[], module: string): Row => {
    const r = rows.find((m) => m.module === module);
    expect(r, `module ${module} present in matrix`).toBeTruthy();
    return r as Row;
  };

  it('returns the full module list with well-formed inbound/outbound cells + generatedAt', async () => {
    const body = await getCoverage();
    expect(typeof body.generatedAt).toBe('string');
    expect(Number.isNaN(Date.parse(body.generatedAt))).toBe(false);
    expect(Array.isArray(body.modules)).toBe(true);

    const names = body.modules.map((m) => m.module);
    for (const m of ALL_MODULES) expect(names).toContain(m);
    // exactly one row per module, no extras
    expect(names.sort()).toEqual([...ALL_MODULES].sort());

    for (const m of body.modules) {
      for (const dir of ['inbound', 'outbound'] as const) {
        expect(m[dir]).toHaveProperty('count');
        expect(m[dir]).toHaveProperty('lastOk');
        expect(typeof m[dir].count).toBe('number');
      }
    }
  });

  it('reports count 0 / lastOk null on both directions for an unexercised module', async () => {
    const { modules } = await getCoverage();
    const cp = row(modules, 'chargingprofiles');
    expect(cp.inbound).toEqual({ count: 0, lastOk: null });
    expect(cp.outbound).toEqual({ count: 0, lastOk: null });
  });

  it('an inbound push lands in the exercised module’s INBOUND cell with lastOk=true', async () => {
    await putSession('COV-1');
    const sessions = row((await getCoverage()).modules, 'sessions');

    expect(sessions.inbound.count).toBeGreaterThan(0);
    expect(sessions.inbound.lastOk).toBe(true);
    // direction isolation: an inbound push must NOT bleed into the outbound cell
    expect(sessions.outbound).toEqual({ count: 0, lastOk: null });
  });

  it('an outbound pull lands in the OUTBOUND cell (direction is tracked separately)', async () => {
    const pull = await app.inject({ method: 'POST', url: '/_mock/pull/locations', payload: {} });
    expect(pull.statusCode).toBe(200);

    const loc = row((await getCoverage()).modules, 'locations');
    expect(loc.outbound.count).toBeGreaterThan(0);
    expect(loc.outbound.lastOk).toBe(true); // stubbed empty list is schema-valid
    expect(loc.inbound).toEqual({ count: 0, lastOk: null });
  });

  it('lastOk reflects the MOST RECENT exchange (a later invalid body flips it false)', async () => {
    await putSession('COV-OK'); // valid  -> validation.ok true
    await putSession('COV-BAD', { id: 'COV-BAD' }); // missing required -> ok false, newest

    const sessions = row((await getCoverage()).modules, 'sessions');
    expect(sessions.inbound.count).toBe(2);
    expect(sessions.inbound.lastOk).toBe(false);
  });
});
