// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// GET /_mock/probes — the semantic (non-schema) spec probes, driven against a
// local stub that plays both Hasura (POST /graphql) and Citrine's OCPI locations
// SENDER, and the mirroring of failing probes into /_mock/findings.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { Finding, MockContext } from '../src/core/types.js';
import { ModuleId } from '../src/ocpi/barrel.js';
import { makeServer, ocpiEnvelope } from './harness.js';

interface StubBehaviour {
  connectorStatus?: string; // what Hasura says the first connector is (undefined -> no rows)
  publishedEvseStatus: string; // evses[0].status on the pulled location
  totalCount?: string; // X-Total-Count on the locations list (undefined -> header absent)
  link?: string;
  loc1Status: number; // HTTP status for GET .../locations/LOC1
}

interface Stub {
  origin: string;
  behaviour: StubBehaviour;
  requests: { method: string; path: string }[];
  close(): Promise<void>;
}

// The harness stub cannot set response headers, and the pagination probe reads
// X-Total-Count / Link, so this one is hand-rolled.
async function startStub(behaviour: StubBehaviour): Promise<Stub> {
  const stub = { behaviour, requests: [] } as unknown as Stub;
  const server = http.createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      const path = (req.url ?? '').split('?')[0];
      stub.requests.push({ method: req.method ?? 'GET', path });
      const b = stub.behaviour;
      const send = (status: number, body: unknown, headers: Record<string, string> = {}) => {
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
        res.end(JSON.stringify(body));
      };
      if (req.method === 'POST' && path === '/graphql') {
        const rows = b.connectorStatus === undefined ? [] : [{ status: b.connectorStatus }];
        return send(200, { data: { Connectors: rows } });
      }
      if (req.method === 'GET' && path === '/ocpi/2.2.1/locations') {
        const headers: Record<string, string> = {};
        if (b.totalCount !== undefined) headers['X-Total-Count'] = b.totalCount;
        if (b.link) headers['Link'] = b.link;
        return send(
          200,
          ocpiEnvelope([{ id: '1', evses: [{ status: b.publishedEvseStatus }] }]),
          headers,
        );
      }
      if (req.method === 'GET' && path === '/ocpi/2.2.1/locations/LOC1') {
        return send(b.loc1Status, b.loc1Status === 404 ? ocpiEnvelope(undefined, 2003) : {});
      }
      return send(404, { error: 'stub_not_found', path });
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  stub.origin = `http://127.0.0.1:${port}`;
  stub.close = () =>
    new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  return stub;
}

const ALL_GREEN: StubBehaviour = {
  connectorStatus: 'Available',
  publishedEvseStatus: 'AVAILABLE',
  totalCount: '7',
  link: '<http://cpo/ocpi/2.2.1/locations?offset=2&limit=2>; rel="next"',
  loc1Status: 404,
};

interface ProbeRow {
  id: string;
  name: string;
  ok: boolean;
  expected: string;
  actual: string;
  detail: string;
  seq?: number;
}

describe('GET /_mock/probes', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let stub: Stub;

  afterEach(async () => {
    await app?.close();
    await stub?.close();
  });

  async function boot(behaviour: StubBehaviour): Promise<void> {
    stub = await startStub(behaviour);
    ({ app, ctx } = makeServer({
      citrineHasuraUrl: `${stub.origin}/graphql`,
      citrineOcpiBaseUrl: `${stub.origin}/ocpi`,
    }));
    await app.ready();
  }

  async function run(): Promise<{ probes: ProbeRow[]; failing: number; generatedAt: string }> {
    const res = await app.inject({ method: 'GET', url: '/_mock/probes' });
    expect(res.statusCode).toBe(200);
    return res.json();
  }

  const byId = (probes: ProbeRow[], id: string): ProbeRow => {
    const p = probes.find((x) => x.id === id);
    expect(p, `probe ${id}`).toBeDefined();
    return p!;
  };

  const probeFindings = (): Finding[] =>
    ctx.store.findings.filter((f) => f.detail.startsWith('Spec probe ['));

  it('all three probes pass against a well-behaved CPO', async () => {
    await boot(ALL_GREEN);
    const body = await run();

    expect(body.probes.map((p) => p.id)).toEqual([
      'evse-availability',
      'pagination-total',
      'string-location-id',
    ]);
    expect(body.probes.every((p) => p.ok)).toBe(true);
    expect(body.failing).toBe(0);
    expect(Number.isNaN(Date.parse(body.generatedAt))).toBe(false);

    const pagination = byId(body.probes, 'pagination-total');
    expect(pagination.actual).toBe('X-Total-Count = 7 (+ Link)');
    expect(byId(body.probes, 'string-location-id').actual).toBe('HTTP 404');
    expect(probeFindings()).toHaveLength(0);

    // each probe links to the outbound exchange it judged
    const outboundSeqs = ctx.store.query({ direction: 'outbound' }).map((e) => e.seq);
    for (const p of body.probes) expect(outboundSeqs).toContain(p.seq);
    expect(stub.requests.map((r) => r.path)).toEqual([
      '/graphql',
      '/ocpi/2.2.1/locations',
      '/ocpi/2.2.1/locations',
      '/ocpi/2.2.1/locations/LOC1',
    ]);
  });

  it('evse-availability fails when the DB says Occupied but UNKNOWN is published', async () => {
    await boot({ ...ALL_GREEN, connectorStatus: 'Occupied', publishedEvseStatus: 'UNKNOWN' });
    const body = await run();
    const p = byId(body.probes, 'evse-availability');
    expect(p.ok).toBe(false);
    expect(p.expected).toBe('OCCUPIED / CHARGING');
    expect(p.actual).toBe('UNKNOWN');
    expect(p.detail).toContain('"Occupied"');
    expect(body.failing).toBe(1);
  });

  it('evse-availability passes when a busy connector is published as CHARGING', async () => {
    await boot({ ...ALL_GREEN, connectorStatus: 'Occupied', publishedEvseStatus: 'CHARGING' });
    const p = byId((await run()).probes, 'evse-availability');
    expect(p.ok).toBe(true);
    expect(p.expected).toBe('OCCUPIED / CHARGING');
    expect(p.actual).toBe('CHARGING');
  });

  it('pagination-total fails when X-Total-Count is absent', async () => {
    await boot({ ...ALL_GREEN, totalCount: undefined, link: undefined });
    const body = await run();
    const p = byId(body.probes, 'pagination-total');
    expect(p.ok).toBe(false);
    expect(p.actual).toBe('X-Total-Count = absent (no Link)');
    expect(p.expected).toContain('X-Total-Count = 1'); // 1 location came back from the pull
  });

  it('pagination-total fails when X-Total-Count equals the page size', async () => {
    await boot({ ...ALL_GREEN, totalCount: '2' });
    const p = byId((await run()).probes, 'pagination-total');
    expect(p.ok).toBe(false);
    expect(p.actual).toBe('X-Total-Count = 2 (+ Link)');
  });

  it('string-location-id fails on a 500', async () => {
    await boot({ ...ALL_GREEN, loc1Status: 500 });
    const p = byId((await run()).probes, 'string-location-id');
    expect(p.ok).toBe(false);
    expect(p.actual).toBe('HTTP 500');
    expect(p.detail).toContain('location_id is a string');
  });

  it('string-location-id is inconclusive (ok:false) on a 401', async () => {
    await boot({ ...ALL_GREEN, loc1Status: 401 });
    const p = byId((await run()).probes, 'string-location-id');
    expect(p.ok).toBe(false);
    expect(p.actual).toContain('inconclusive');
    expect(p.detail).toContain('never reached the handler');
  });

  it('failing probes are mirrored into findings, replaced on re-run, and dropped once they pass', async () => {
    await boot({ ...ALL_GREEN, totalCount: undefined, loc1Status: 500 });
    const first = await run();
    expect(first.failing).toBe(2);

    let found = probeFindings();
    expect(found).toHaveLength(2);
    const byTag = (id: string) => found.find((f) => f.detail.startsWith(`Spec probe [${id}]`));
    const pag = byTag('pagination-total')!;
    expect(pag.severity).toBe('error');
    expect(pag.kind).toBe('body');
    expect(pag.module).toBe('locations');
    expect(pag.seq).toBe(byId(first.probes, 'pagination-total').seq);
    expect(pag.detail).toContain('expected X-Total-Count');
    expect(byTag('string-location-id')!.detail).toContain('got HTTP 500');
    expect(byTag('evse-availability')).toBeUndefined();

    // same failures again -> still exactly one finding per probe
    await run();
    found = probeFindings();
    expect(found).toHaveLength(2);
    expect(found.filter((f) => f.detail.includes('[pagination-total]'))).toHaveLength(1);

    // the CPO fixes pagination -> that finding disappears, the other stays
    stub.behaviour = { ...stub.behaviour, totalCount: '9' };
    const third = await run();
    expect(third.failing).toBe(1);
    found = probeFindings();
    expect(found).toHaveLength(1);
    expect(found[0].detail.startsWith('Spec probe [string-location-id]')).toBe(true);

    // non-probe findings are never touched by the dedupe
    ctx.store.addFinding({
      severity: 'warn',
      kind: 'status',
      module: ModuleId.Locations,
      seq: 0,
      detail: 'unrelated finding',
    });
    stub.behaviour = { ...stub.behaviour, loc1Status: 404 };
    expect((await run()).failing).toBe(0);
    expect(probeFindings()).toHaveLength(0);
    expect(ctx.store.findings.some((f) => f.detail === 'unrelated finding')).toBe(true);
  });

  it('/_mock/findings exposes the probe findings', async () => {
    await boot({ ...ALL_GREEN, loc1Status: 500 });
    await run();
    const res = await app.inject({ method: 'GET', url: '/_mock/findings' });
    const list = res.json() as Finding[];
    expect(list.filter((f) => f.detail.startsWith('Spec probe [string-location-id]'))).toHaveLength(
      1,
    );
  });
});
