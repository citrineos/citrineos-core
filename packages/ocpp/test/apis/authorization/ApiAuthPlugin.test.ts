// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IApiAuthProvider } from '@citrineos/base';
import { apiAuthPluginFp } from '@/apis/authorization/ApiAuthPlugin.js';

/**
 * An auth provider that refuses everything, so that any route reaching the provider is observable as a
 * 401 and any route skipping it is observable as a 200.
 */
function aRefusingProvider() {
  return {
    extractToken: vi.fn().mockResolvedValue(undefined),
    authenticateToken: vi.fn().mockResolvedValue({ isAuthenticated: false, error: 'no token' }),
    authorizeUser: vi.fn().mockResolvedValue({ isAuthorized: false, error: 'denied' }),
  } as unknown as IApiAuthProvider & {
    extractToken: ReturnType<typeof vi.fn>;
    authenticateToken: ReturnType<typeof vi.fn>;
    authorizeUser: ReturnType<typeof vi.fn>;
  };
}

async function anAuthenticatedServer(provider: ReturnType<typeof aRefusingProvider>) {
  const app = Fastify();
  await app.register(apiAuthPluginFp, {
    provider,
    options: { excludedRoutes: ['/health', '/health/live', '/health/ready', '/docs'] },
  });
  app.get('/health', async () => ({ ok: true }));
  app.get('/health/live', async () => ({ ok: true }));
  app.get('/data/transactions/transaction', async () => ({ data: [] }));
  await app.ready();
  return app;
}

describe('apiAuthPlugin', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
    vi.restoreAllMocks();
  });

  it('protects a route that is not excluded', async () => {
    const provider = aRefusingProvider();
    app = await anAuthenticatedServer(provider);

    const response = await app.inject({ method: 'GET', url: '/data/transactions/transaction' });

    expect(response.statusCode).toBe(401);
  });

  it('skips authentication for an excluded route', async () => {
    const provider = aRefusingProvider();
    app = await anAuthenticatedServer(provider);

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(provider.extractToken).not.toHaveBeenCalled();
  });

  it('skips authentication for an excluded route that carries a query string', async () => {
    const provider = aRefusingProvider();
    app = await anAuthenticatedServer(provider);

    // Load balancers and probes routinely append a cache-busting parameter. Matching the exclusion
    // list against the raw url - which includes '?...' - made every such probe fail closed with 401.
    const response = await app.inject({ method: 'GET', url: '/health?cache-bust=1' });

    expect(response.statusCode).toBe(200);
    expect(provider.extractToken).not.toHaveBeenCalled();
  });

  it('skips authentication for an excluded route prefix that carries a query string', async () => {
    const provider = aRefusingProvider();
    app = await anAuthenticatedServer(provider);

    const response = await app.inject({ method: 'GET', url: '/health/live?probe=kubelet' });

    expect(response.statusCode).toBe(200);
  });

  it('does not attempt authorization once authentication has already answered the request', async () => {
    const provider = aRefusingProvider();
    app = await anAuthenticatedServer(provider);

    const response = await app.inject({ method: 'GET', url: '/data/transactions/transaction' });

    // authenticate() answers the request and returns; authorize() must not then consult the
    // provider for a caller that never authenticated.
    expect(response.statusCode).toBe(401);
    expect(provider.authorizeUser).not.toHaveBeenCalled();
    expect(JSON.parse(response.body).message).toBe('Missing or invalid authorization header');
  });
});
