// ============================================================================
// FILE: apps/mock-msp/test/provoke.test.ts
// POST /_mock/provoke/:what — the "both directions" proof. In production a
// provoke fires a raw fetch at Citrine's Hasura, whose DB write triggers a real
// OCPI push back to the mock. There is no live Hasura in-process, so we point
// config.citrineHasuraUrl at a tiny local stub server (the harness's
// startStubCpo, which records every request body) and assert on the exact
// GraphQL the mock emits — plus the error/edge paths. Fully hermetic; no
// dependency on the live Docker stack.
// ============================================================================
import { afterEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  makeServer,
  startStubCpo,
  type StubCpo,
  type StubCpoReply,
  type StubCpoRequest,
} from './harness.js';

type Route = (req: StubCpoRequest) => StubCpoReply;

const gqlQuery = (req: StubCpoRequest): string =>
  (req.body as { query?: string } | undefined)?.query ?? '';

describe('POST /_mock/provoke/:what — Hasura-driven Citrine push', () => {
  let app: FastifyInstance | undefined;
  let stub: StubCpo | undefined;

  afterEach(async () => {
    if (app) await app.close();
    if (stub) await stub.close();
    app = undefined;
    stub = undefined;
  });

  /** Start a stub Hasura with `route`, then boot the mock pointed at it. */
  async function boot(route: Route): Promise<void> {
    stub = await startStubCpo(route);
    // config.citrineHasuraUrl is the exact URL provoke() fetches; the stub
    // answers every path, so origin is enough.
    ({ app } = makeServer({ citrineHasuraUrl: stub.origin }));
    await app.ready();
  }

  it('location-nudge emits the update_Locations mutation and returns provoked:true', async () => {
    await boot(() => ({
      json: {
        data: {
          update_Locations: {
            affected_rows: 1,
            returning: [{ id: 2, name: 'x', updatedAt: 'now' }],
          },
        },
      },
    }));

    const res = await app!.inject({
      method: 'POST',
      url: '/_mock/provoke/location-nudge',
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.provoked).toBe(true);
    expect(body.what).toBe('location-nudge');
    expect(body.hasuraStatus).toBe(200);
    expect(body.mutationSummary).toContain('affected_rows=1');

    // exactly one GraphQL request reached Hasura, carrying the expected mutation
    expect(stub!.requests).toHaveLength(1);
    const gql = stub!.requests[0].body as { query: string; variables: Record<string, unknown> };
    expect(gql.query).toContain('update_Locations');
    expect(gql.query).toContain('id: { _eq: 2 }');
    expect(gql.query).toContain('_set: { name: $name, updatedAt: $ts }');
    // fresh values are passed as GraphQL variables, not string-interpolated
    expect(typeof gql.variables.name).toBe('string');
    expect(typeof gql.variables.ts).toBe('string');
  });

  it('location-add resolves the next id, then inserts it (two GraphQL calls) with native-JSON coords', async () => {
    await boot((req) => {
      const q = gqlQuery(req);
      if (q.includes('Locations_aggregate')) {
        return { json: { data: { Locations_aggregate: { aggregate: { max: { id: 7 } } } } } };
      }
      if (q.includes('insert_Locations_one')) {
        return { json: { data: { insert_Locations_one: { id: 8, name: 'Provoke Add 8' } } } };
      }
      return { json: {} };
    });

    const res = await app!.inject({
      method: 'POST',
      url: '/_mock/provoke/location-add',
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.provoked).toBe(true);
    expect(body.what).toBe('location-add');
    expect(body.mutationSummary).toContain('id=8'); // 7 (max) + 1

    // aggregate query first, then the insert using the resolved id
    expect(stub!.requests).toHaveLength(2);
    const aggregate = stub!.requests[0].body as { query: string };
    const insert = stub!.requests[1].body as {
      query: string;
      variables: { obj: { id: number; coordinates: unknown; facilities: unknown } };
    };
    expect(aggregate.query).toContain('Locations_aggregate');
    expect(insert.query).toContain('insert_Locations_one');
    expect(insert.variables.obj.id).toBe(8);
    // jsonb + geometry travel as native JSON (the mapper throws on quoted strings)
    expect(insert.variables.obj.coordinates).toEqual({
      type: 'Point',
      coordinates: [-122.4194, 37.7749],
    });
    expect(insert.variables.obj.facilities).toEqual(['Cafe']);
  });

  it('surfaces a GraphQL error (HTTP 200 with errors[]) as HTTP 502 hasura_error', async () => {
    await boot(() => ({
      json: { errors: [{ message: 'permission denied for table "Locations"' }] },
    }));

    const res = await app!.inject({
      method: 'POST',
      url: '/_mock/provoke/location-nudge',
      payload: {},
    });
    expect(res.statusCode).toBe(502);
    const body = res.json();
    expect(body.error).toBe('hasura_error');
    expect(body.what).toBe('location-nudge');
    expect(Array.isArray(body.issues)).toBe(true);
    expect(body.issues.length).toBeGreaterThan(0);
  });

  it('rejects an unknown provoke target with 400 + the valid list', async () => {
    await boot(() => ({ json: { data: {} } }));

    const res = await app!.inject({
      method: 'POST',
      url: '/_mock/provoke/frobnicate',
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe('unknown_provoke');
    expect(body.what).toBe('frobnicate');
    expect(body.valid).toEqual(expect.arrayContaining(['location-add', 'location-nudge']));
    // an unknown target must not touch Hasura at all
    expect(stub!.requests).toHaveLength(0);
  });

  it('surfaces an unreachable Hasura (network failure) as HTTP 502 provoke_failed', async () => {
    // No stub — point at a dead port so the fetch rejects.
    ({ app } = makeServer({ citrineHasuraUrl: 'http://127.0.0.1:1/v1/graphql' }));
    await app.ready();

    const res = await app.inject({
      method: 'POST',
      url: '/_mock/provoke/location-nudge',
      payload: {},
    });
    expect(res.statusCode).toBe(502);
    expect(res.json().error).toBe('provoke_failed');
  });
});
