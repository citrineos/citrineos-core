// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Pins the GraphQL the mock sends to Hasura against test/data/hasura-snapshot.ts,
// so a renamed Citrine table/column fails here instead of silently breaking the
// provoke / status / probe paths against the live stack.
import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { makeServer, ocpiEnvelope, startStubCpo, type StubCpo } from './harness.js';
import {
  CONNECTOR_STATUS_QUERY,
  HASURA_NAMES,
  LOCATION_ADD_QUERY,
  LOCATION_NUDGE_QUERY,
  LOCATION_NUDGE_VARIABLE_TYPES,
  NEXT_LOCATION_ID_QUERY,
  STATUS_QUERY,
  locationAddObject,
} from './data/hasura-snapshot.js';

const MAX_LOCATION_ID = 41;

interface GqlRequest {
  query: string;
  variables?: Record<string, unknown>;
}

const normalise = (s: string): string => s.replace(/\s+/g, ' ').trim();

function hasuraRoute(req: { path: string; body: unknown }) {
  if (req.path !== '/graphql') return { json: ocpiEnvelope([]) };
  const q = (req.body as GqlRequest).query;
  if (q.includes('Locations_aggregate')) {
    return {
      json: { data: { Locations_aggregate: { aggregate: { max: { id: MAX_LOCATION_ID } } } } },
    };
  }
  if (q.includes('insert_Locations_one')) {
    return { json: { data: { insert_Locations_one: { id: MAX_LOCATION_ID + 1, name: 'x' } } } };
  }
  if (q.includes('update_Locations')) {
    return { json: { data: { update_Locations: { affected_rows: 1, returning: [] } } } };
  }
  if (q.includes('MockMspStatus')) {
    return {
      json: {
        data: {
          ChargingStations: [{ id: 1, ocppConnectionName: 'cp001', isOnline: true }],
          Connectors: [{ id: 1, stationId: 1, status: 'Available' }],
          Transactions: [],
        },
      },
    };
  }
  return { json: { data: { Connectors: [{ status: 'Available' }] } } };
}

describe('Hasura GraphQL contract', () => {
  let app: FastifyInstance;
  let stub: StubCpo;

  afterEach(async () => {
    await app?.close();
    await stub?.close();
  });

  async function boot(): Promise<void> {
    stub = await startStubCpo(hasuraRoute);
    ({ app } = makeServer(
      { citrineHasuraUrl: `${stub.origin}/graphql`, citrineOcpiBaseUrl: `${stub.origin}/ocpi` },
      { everest: async () => ({ state: 'unavailable', detail: null }) },
    ));
    await app.ready();
  }

  const recorded = (): GqlRequest[] =>
    stub.requests.filter((r) => r.path === '/graphql').map((r) => r.body as GqlRequest);

  const expectNames = (key: keyof typeof HASURA_NAMES, queries: GqlRequest[]) => {
    const text = queries.map((q) => q.query).join('\n');
    for (const name of HASURA_NAMES[key]) expect(text).toContain(name);
  };

  it('location-nudge sends the update_Locations mutation with name/ts variables', async () => {
    await boot();
    const res = await app.inject({ method: 'POST', url: '/_mock/provoke/location-nudge' });
    expect(res.statusCode).toBe(200);

    const reqs = recorded();
    expect(reqs).toHaveLength(1);
    expect(normalise(reqs[0].query)).toBe(normalise(LOCATION_NUDGE_QUERY));
    const vars = reqs[0].variables!;
    expect(Object.keys(vars).sort()).toEqual(Object.keys(LOCATION_NUDGE_VARIABLE_TYPES).sort());
    for (const [k, t] of Object.entries(LOCATION_NUDGE_VARIABLE_TYPES))
      expect(typeof vars[k]).toBe(t);
    expect(Number.isNaN(Date.parse(vars.ts as string))).toBe(false);
    expect(vars.name).toBe(`Nudge probe ${vars.ts}`);
    expectNames('location-nudge', reqs);
  });

  it('location-add resolves the max id (no variables) then inserts the snapshot object', async () => {
    await boot();
    const res = await app.inject({ method: 'POST', url: '/_mock/provoke/location-add' });
    expect(res.statusCode).toBe(200);

    const reqs = recorded();
    expect(reqs).toHaveLength(2);
    const [aggregate, insert] = reqs;
    expect(normalise(aggregate.query)).toBe(normalise(NEXT_LOCATION_ID_QUERY));
    expect('variables' in aggregate).toBe(false);

    expect(normalise(insert.query)).toBe(normalise(LOCATION_ADD_QUERY));
    expect(Object.keys(insert.variables!)).toEqual(['obj']);
    const obj = insert.variables!.obj as Record<string, unknown>;
    expect(typeof obj.createdAt).toBe('string');
    expect(obj).toEqual(locationAddObject(MAX_LOCATION_ID + 1, obj.createdAt as string));
    expectNames('location-add', reqs);
  });

  it('status?fresh=1 sends the single MockMspStatus query (no variables)', async () => {
    await boot();
    const res = await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' });
    expect(res.statusCode).toBe(200);
    expect(res.json().citrine.hasura.state).toBe('up');

    const reqs = recorded();
    expect(reqs).toHaveLength(1);
    expect(normalise(reqs[0].query)).toBe(normalise(STATUS_QUERY));
    expect('variables' in reqs[0]).toBe(false);
    expectNames('status', reqs);
  });

  it('probes read the first connector status with the snapshot query (no variables)', async () => {
    await boot();
    const res = await app.inject({ method: 'GET', url: '/_mock/probes' });
    expect(res.statusCode).toBe(200);

    const reqs = recorded();
    expect(reqs).toHaveLength(1);
    expect(normalise(reqs[0].query)).toBe(normalise(CONNECTOR_STATUS_QUERY));
    expect('variables' in reqs[0]).toBe(false);
    expectNames('probes', reqs);
  });

  it('every request is a POST with a JSON {query[, variables]} body and nothing else', async () => {
    await boot();
    await app.inject({ method: 'POST', url: '/_mock/provoke/location-nudge' });
    await app.inject({ method: 'POST', url: '/_mock/provoke/location-add' });
    await app.inject({ method: 'GET', url: '/_mock/status?fresh=1' });
    await app.inject({ method: 'GET', url: '/_mock/probes' });

    const raw = stub.requests.filter((r) => r.path === '/graphql');
    expect(raw).toHaveLength(5);
    for (const r of raw) {
      expect(r.method).toBe('POST');
      expect(r.headers['content-type']).toBe('application/json');
      const keys = Object.keys(r.body as object)
        .sort()
        .join(',');
      expect(['query', 'query,variables']).toContain(keys);
    }
  });
});
