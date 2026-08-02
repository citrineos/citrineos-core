// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// ============================================================================
// FILE: apps/mock-msp/test/status.test.ts
// GET /_mock/status — the single 2s-poll aggregate powering the dashboard status
// strip + state-aware buttons. Hermetic: Hasura + Citrine-OCPI are stubbed via
// config URL overrides (a real http stub), the EVerest/docker probe is injected
// as a fake, and nothing here spawns docker or touches the live stack.
//
// Guarantees under test: always HTTP 200 with an `unknown` state for every dead
// source (never throws, never awaits outbound I/O on the poll path), ?fresh=1
// populates from ONE combined Hasura query, GraphQL errors[] degrade to unknown
// but still 200, the TTL cache suppresses repeat probe hits, the handler latency
// is independent of a slow source, `gen` cursors track recorded exchanges, and
// /status is never itself recorded in the OCPI trace.
// ============================================================================
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import type { MockContext } from '../src/core/types.js';
import type { StatusProbes } from '../src/control/statusCache.js';
import {
  makeServer,
  startStubCpo,
  functionalHeaders,
  validSession,
  type StubCpo,
} from './harness.js';

const EVEREST_UP: Partial<StatusProbes> = {
  everest: async () => ({ state: 'up', detail: null }),
};

/** A Hasura payload the combined status query expects: station + connector + active txn. */
function hasuraData(): Record<string, unknown> {
  return {
    data: {
      ChargingStations: [{ id: 1, ocppConnectionName: 'cp001', isOnline: true }],
      Connectors: [{ id: 1, stationId: 1, status: 'Occupied' }],
      Transactions: [
        { transactionId: 'T1', stationId: 1, chargingState: 'Charging', totalKwh: 1.5 },
      ],
    },
  };
}

/** One stub answering both the Hasura POST (/graphql) and the OCPI versions GET (/versions). */
async function startStatusStub(graphqlReply: () => Record<string, unknown>): Promise<StubCpo> {
  return startStubCpo((req) => {
    if (req.method === 'POST' && req.path === '/graphql') return { json: graphqlReply() };
    if (req.method === 'GET' && req.path === '/versions') return { json: { data: [] } };
    return undefined;
  });
}

function overrides(stub: StubCpo): Record<string, unknown> {
  return {
    citrineHasuraUrl: `${stub.origin}/graphql`,
    citrineVersionsUrl: `${stub.origin}/versions`,
  };
}

describe('GET /_mock/status — live aggregate', () => {
  let app: FastifyInstance;
  let ctx: MockContext;
  let stub: StubCpo | undefined;

  afterEach(async () => {
    await app?.close();
    await stub?.close();
    stub = undefined;
  });

  it('dead sources → HTTP 200, every remote field unknown, and it answers fast', async () => {
    // Unreachable URLs; no ?fresh, so probes are still in-flight when the handler returns.
    ({ app, ctx } = makeServer(
      {
        citrineHasuraUrl: 'http://127.0.0.1:1/graphql',
        citrineVersionsUrl: 'http://127.0.0.1:1/versions',
      },
      { everest: async () => ({ state: 'up', detail: null }) },
    ));
    await app.ready();
    const t0 = Date.now();
    const res = await app.inject({ method: 'GET', url: '/_mock/status' });
    const elapsed = Date.now() - t0;
    expect(res.statusCode).toBe(200);
    expect(elapsed).toBeLessThan(500); // snapshot never awaits outbound I/O
    const j = res.json();
    expect(j.degraded).toBe(true);
    expect(j.citrine.ocpi.state).toBe('unknown');
    expect(j.citrine.hasura.state).toBe('unknown');
    expect(j.citrine.station.state).toBe('unknown');
    expect(j.citrine.connector.state).toBe('unknown');
    expect(j.everest.state).toBe('unknown'); // first snapshot: probe not yet resolved
    expect(j.mock.registration).toBe('registered');
  });

  it('?fresh=1 populates station/connector/transaction from ONE combined Hasura query', async () => {
    stub = await startStatusStub(hasuraData);
    ({ app, ctx } = makeServer(overrides(stub), EVEREST_UP));
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.citrine.hasura.state).toBe('up');
    expect(j.citrine.station.state).toBe('online');
    expect(j.citrine.station.name).toBe('cp001');
    expect(j.citrine.connector.state).toBe('Occupied');
    expect(j.citrine.transaction.state).toBe('active');
    expect(j.citrine.transaction.transactionId).toBe('T1');
    expect(j.citrine.ocpi.state).toBe('up');
    expect(j.everest.state).toBe('up');
    // Exactly ONE GraphQL request, carrying all three roots.
    const gql = stub.requests.filter((r) => r.method === 'POST' && r.path === '/graphql');
    expect(gql).toHaveLength(1);
    const q = (gql[0].body as { query?: string }).query ?? '';
    expect(q).toContain('ChargingStations');
    expect(q).toContain('Connectors');
    expect(q).toContain('Transactions');
  });

  it('GraphQL errors[] → hasura down + domain fields unknown, still HTTP 200', async () => {
    stub = await startStatusStub(() => ({ errors: [{ message: 'boom' }] }));
    ({ app, ctx } = makeServer(overrides(stub), EVEREST_UP));
    await app.ready();
    const res = await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' });
    expect(res.statusCode).toBe(200);
    const j = res.json();
    expect(j.citrine.hasura.state).toBe('down');
    expect(j.citrine.station.state).toBe('unknown');
    expect(j.citrine.connector.state).toBe('unknown');
    expect(j.citrine.transaction.state).toBe('unknown');
  });

  it('TTL cache suppresses repeat Hasura hits within the window', async () => {
    stub = await startStatusStub(hasuraData);
    ({ app, ctx } = makeServer(overrides(stub), EVEREST_UP));
    await app.ready();
    await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' }); // 1 hit
    await app.inject({ method: 'GET', url: '/_mock/status' }); // cached
    await app.inject({ method: 'GET', url: '/_mock/status' }); // cached
    const gql = stub.requests.filter((r) => r.method === 'POST' && r.path === '/graphql');
    expect(gql).toHaveLength(1); // TTL (5s) not expired → no second query
  });

  it('handler latency is independent of a slow Hasura source', async () => {
    const slow = http.createServer((_req, res) => {
      setTimeout(() => {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(hasuraData()));
      }, 700);
    });
    await new Promise<void>((r) => slow.listen(0, '127.0.0.1', r));
    const { port } = slow.address() as AddressInfo;
    try {
      ({ app, ctx } = makeServer(
        {
          citrineHasuraUrl: `http://127.0.0.1:${port}/graphql`,
          citrineVersionsUrl: 'http://127.0.0.1:1/versions',
        },
        EVEREST_UP,
      ));
      await app.ready();
      // First plain call kicks the (slow) background refresh; the handler must not wait for it.
      const t0 = Date.now();
      await app.inject({ method: 'GET', url: '/_mock/status' });
      expect(Date.now() - t0).toBeLessThan(300);
      // Let the background fetch finish before we tear the server down.
      await new Promise((r) => setTimeout(r, 900));
    } finally {
      await new Promise<void>((r) => slow.close(() => r()));
    }
  });

  it('gen cursors track recorded exchanges', async () => {
    ({ app, ctx } = makeServer({}, EVEREST_UP));
    await app.ready();
    const before = (await app.inject({ method: 'GET', url: '/_mock/status' })).json();
    expect(before.gen.exchanges).toBe(0);
    expect(before.gen.maxSeq).toBe(0);
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/GEN-1',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(validSession({ id: 'GEN-1' })),
    });
    const after = (await app.inject({ method: 'GET', url: '/_mock/status' })).json();
    expect(after.gen.exchanges).toBe(1);
    expect(after.gen.maxSeq).toBeGreaterThan(0);
  });

  it('derives an ACTIVE session into mock.activeSession', async () => {
    ({ app, ctx } = makeServer({}, EVEREST_UP));
    await app.ready();
    await app.inject({
      method: 'PUT',
      url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESS-A',
      headers: functionalHeaders(ctx.config),
      payload: JSON.stringify(
        validSession({ id: 'SESS-A', status: 'ACTIVE', evse_uid: 'cp001::1' }),
      ),
    });
    const j = (await app.inject({ method: 'GET', url: '/_mock/status' })).json();
    expect(j.mock.activeSession).not.toBeNull();
    expect(j.mock.activeSession.id).toBe('SESS-A');
    expect(j.mock.activeSession.status).toBe('ACTIVE');
  });

  it('a fake docker probe surfaces up vs unavailable', async () => {
    ({ app, ctx } = makeServer({}, { everest: async () => ({ state: 'up', detail: null }) }));
    await app.ready();
    const up = (await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' })).json();
    expect(up.everest.state).toBe('up');
    await app.close();

    ({ app, ctx } = makeServer(
      {},
      { everest: async () => ({ state: 'unavailable', detail: 'no docker' }) },
    ));
    await app.ready();
    const un = (await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' })).json();
    expect(un.everest.state).toBe('unavailable');
  });

  it('/status is NOT recorded in the OCPI wire trace', async () => {
    ({ app, ctx } = makeServer({}, EVEREST_UP));
    await app.ready();
    await app.inject({ method: 'GET', url: '/_mock/status' });
    await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' });
    expect(ctx.store.query({}).length).toBe(0);
  });
});
