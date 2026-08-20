// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

// These middlewares carry a bare @Service(), which typedi evaluates as the class is defined and
// which needs design:type metadata esbuild does not emit. They take no constructor dependencies,
// so the decorator can be inert here.
vi.mock('typedi', () => ({
  Service: () => () => undefined,
  Inject: () => () => undefined,
  Container: { get: () => undefined, set: () => undefined },
}));

import { OcpiHeaderMiddleware } from '../../../src/util/middleware/OcpiHeaderMiddleware.js';
import { UniqueMessageIdsMiddleware } from '../../../src/util/middleware/UniqueMessageIdsMiddleware.js';

/** Mirrors the parts of the Koa context these middlewares touch, recording what they set. */
function aContext(headers: Record<string, string>) {
  const set: Record<string, unknown> = {};
  return {
    ctx: {
      req: { headers },
      response: {
        set: (field: string, value: unknown) => {
          set[field] = value;
        },
      },
    } as never,
    set,
  };
}

const next = () => Promise.resolve();

describe('UniqueMessageIdsMiddleware', () => {
  it('echoes the request and correlation ids back', async () => {
    const { ctx, set } = aContext({
      'x-request-id': 'req-1',
      'x-correlation-id': 'corr-1',
    });

    await new UniqueMessageIdsMiddleware().use(ctx, next);

    expect(set['X-Request-ID']).toBe('req-1');
    expect(set['X-Correlation-ID']).toBe('corr-1');
  });

  it('omits an id the caller did not send rather than echoing the string "undefined"', async () => {
    // Koa stringifies a non-string header value, so setting an absent header put the six
    // characters u-n-d-e-f-i-n-e-d on the response - which a partner validating the echoed id
    // reads as a mismatch.
    const { ctx, set } = aContext({});

    await new UniqueMessageIdsMiddleware().use(ctx, next);

    expect(set).not.toHaveProperty('X-Request-ID');
    expect(set).not.toHaveProperty('X-Correlation-ID');
  });
});

describe('OcpiHeaderMiddleware', () => {
  it('swaps the from and to routing headers on the response', async () => {
    const { ctx, set } = aContext({
      'ocpi-from-country-code': 'GB',
      'ocpi-from-party-id': 'MSP',
      'ocpi-to-country-code': 'NL',
      'ocpi-to-party-id': 'CPO',
    });

    await new OcpiHeaderMiddleware().use(ctx, next);

    expect(set['OCPI-from-country-code']).toBe('NL');
    expect(set['OCPI-from-party-id']).toBe('CPO');
    expect(set['OCPI-to-country-code']).toBe('GB');
    expect(set['OCPI-to-party-id']).toBe('MSP');
  });

  it('omits routing headers the caller did not send', async () => {
    const { ctx, set } = aContext({});

    await new OcpiHeaderMiddleware().use(ctx, next);

    expect(Object.keys(set)).toHaveLength(0);
  });
});
