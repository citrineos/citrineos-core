// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

vi.mock('typedi', () => ({
  Service: () => () => undefined,
  Inject: () => () => undefined,
  Container: { get: () => undefined, set: () => undefined },
}));

import { PaginatedMiddleware } from '../../../src/util/middleware/paginated-middleware.js';

function aMiddleware() {
  return new PaginatedMiddleware({
    config: { defaultPageLimit: 50, maxPageLimit: 1000 },
  } as never);
}

function aContext(body: unknown, query: Record<string, unknown> = { limit: '10' }) {
  const set: Record<string, unknown> = {};
  return {
    ctx: {
      request: { protocol: 'https', host: 'cpo.test', url: '/ocpi/2.2.1/cdrs?limit=10', query },
      response: {
        body,
        set: (field: string, value: unknown) => {
          set[field] = value;
        },
      },
    } as any,
    set,
  };
}

const next = () => Promise.resolve();

function anEndpointEchoingTheLimit(ctx: any) {
  return () => {
    const limit = Number(ctx.request.query.limit);
    ctx.response.body = { data: [], total: 5000, limit, offset: 0 };
    return Promise.resolve(limit);
  };
}

describe('PaginatedMiddleware', () => {
  it('publishes the paging headers and strips the paging fields from the body', async () => {
    const body: any = { data: [1, 2], total: 30, limit: 10, offset: 0 };
    const { ctx, set } = aContext(body);

    await aMiddleware().use(ctx, next);

    expect(set['X-Total-Count']).toBe(30);
    expect(set['X-Limit']).toBe(10);
    expect(String(set['Link'])).toContain('offset=10');
    expect(body).not.toHaveProperty('total');
    expect(body).not.toHaveProperty('limit');
    expect(body).not.toHaveProperty('offset');
  });

  it('offers no next link on the last page', async () => {
    const { ctx, set } = aContext({ data: [1], total: 30, limit: 10, offset: 20 });

    await aMiddleware().use(ctx, next);

    expect(set).not.toHaveProperty('Link');
  });

  it('leaves a response that carries no paging alone', async () => {
    // The middleware is attached per endpoint, but an endpoint that throws is answered by the
    // exception handler with an OCPI error body, and a 204 has no body at all. Reading paging
    // fields off either threw a TypeError out of the middleware.
    const { ctx } = aContext(undefined);

    await expect(aMiddleware().use(ctx, next)).resolves.not.toThrow();
  });

  it('leaves an error response body alone', async () => {
    const errorBody: any = { status_code: 2001, status_message: 'Invalid parameters' };
    const { ctx, set } = aContext(errorBody);

    await aMiddleware().use(ctx, next);

    expect(errorBody).toEqual({ status_code: 2001, status_message: 'Invalid parameters' });
    expect(set).not.toHaveProperty('X-Total-Count');
  });

  it('caps a requested limit at maxPageLimit and reports the cap in X-Limit', async () => {
    const { ctx, set } = aContext(undefined, { limit: '100000' });

    await aMiddleware().use(ctx, anEndpointEchoingTheLimit(ctx));

    expect(Number(ctx.request.query.limit)).toBe(1000);
    expect(set['X-Limit']).toBe(1000);
  });

  it('applies defaultPageLimit when the request names no limit', async () => {
    const { ctx, set } = aContext(undefined, {});

    await aMiddleware().use(ctx, anEndpointEchoingTheLimit(ctx));

    expect(Number(ctx.request.query.limit)).toBe(50);
    expect(set['X-Limit']).toBe(50);
  });

  it('leaves a limit under the cap as requested', async () => {
    const { ctx, set } = aContext(undefined, { limit: '20', offset: '40' });

    await aMiddleware().use(ctx, anEndpointEchoingTheLimit(ctx));

    expect(ctx.request.query).toEqual({ limit: '20', offset: '40' });
    expect(set['X-Limit']).toBe(20);
  });
});
