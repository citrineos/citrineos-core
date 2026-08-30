// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import Fastify, { type FastifyInstance } from 'fastify';
import type { SystemConfig } from '@citrineos/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OIDCAuthProvider } from '@util/index.js';
import { registerSwaggerOidcLogin } from '@util/util/swaggerOidcLogin.js';

const oidcLoginConfig = {
  issuer: 'https://idp.example.com/realms/test',
  authorizationEndpoint: 'https://idp.example.com/realms/test/protocol/openid-connect/auth',
  tokenEndpoint: 'https://idp.example.com/realms/test/protocol/openid-connect/token',
  jwksUri: 'https://idp.example.com/realms/test/protocol/openid-connect/certs',
  clientId: 'internal',
  clientSecret: 'shh',
};

const mockSystemConfig = {
  modules: {},
  util: {
    swagger: {
      path: '/docs',
      logoPath: '',
      oidcLogin: oidcLoginConfig,
    },
  },
} as unknown as SystemConfig;

describe('registerSwaggerOidcLogin', () => {
  let server: FastifyInstance;

  beforeEach(() => {
    server = Fastify();
    registerSwaggerOidcLogin(mockSystemConfig, server);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await server.close();
  });

  it('does nothing when oidcLogin is not configured', async () => {
    const bare = Fastify();
    registerSwaggerOidcLogin(
      {
        modules: {},
        util: { swagger: { path: '/docs', logoPath: '' } },
      } as unknown as SystemConfig,
      bare,
    );
    bare.get('/docs', async () => ({ ok: true }));
    await bare.ready();
    const response = await bare.inject({ method: 'GET', url: '/docs' });
    expect(response.statusCode).toBe(200);
    await bare.close();
  });

  it('redirects unauthenticated requests under the swagger path to the authorization endpoint', async () => {
    server.get('/docs', async () => ({ ok: true }));
    await server.ready();

    const response = await server.inject({ method: 'GET', url: '/docs' });

    expect(response.statusCode).toBe(302);
    const location = new URL(response.headers['location'] as string);
    expect(`${location.origin}${location.pathname}`).toBe(oidcLoginConfig.authorizationEndpoint);
    expect(location.searchParams.get('client_id')).toBe(oidcLoginConfig.clientId);
    expect(location.searchParams.get('response_type')).toBe('code');
    expect(location.searchParams.get('redirect_uri')).toBe('http://localhost:80/docs/callback');
  });

  it('leaves requests outside the swagger path untouched', async () => {
    server.get('/health', async () => ({ ok: true }));
    await server.ready();

    const response = await server.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
  });

  it('callback rejects a request with no authorization code', async () => {
    await server.ready();

    const response = await server.inject({ method: 'GET', url: '/docs/callback' });

    expect(response.statusCode).toBe(400);
  });

  it('callback exchanges the code, verifies the token, and sets a session cookie', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'good-token', expires_in: 300 }),
      }),
    );
    vi.spyOn(OIDCAuthProvider.prototype, 'authenticateToken').mockResolvedValue({
      isAuthenticated: true,
      user: { id: 'u1', name: 'u1', email: '', roles: [], tenantId: '1', metadata: {} },
    } as any);
    await server.ready();

    const response = await server.inject({ method: 'GET', url: '/docs/callback?code=abc123' });

    expect(response.statusCode).toBe(302);
    expect(response.headers['location']).toBe('/docs');
    const cookie = response.headers['set-cookie'] as string;
    expect(cookie).toContain('citrineos_swagger_auth=good-token');
    expect(cookie).toContain('HttpOnly');
  });

  it('callback rejects a token that fails verification', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: 'bad-token', expires_in: 300 }),
      }),
    );
    vi.spyOn(OIDCAuthProvider.prototype, 'authenticateToken').mockResolvedValue({
      isAuthenticated: false,
      error: 'invalid signature',
    } as any);
    await server.ready();

    const response = await server.inject({ method: 'GET', url: '/docs/callback?code=abc123' });

    expect(response.statusCode).toBe(401);
  });

  it('allows a request bearing a valid session cookie through without redirecting', async () => {
    vi.spyOn(OIDCAuthProvider.prototype, 'authenticateToken').mockResolvedValue({
      isAuthenticated: true,
      user: { id: 'u1', name: 'u1', email: '', roles: [], tenantId: '1', metadata: {} },
    } as any);
    server.get('/docs', async () => ({ ok: true }));
    await server.ready();

    const response = await server.inject({
      method: 'GET',
      url: '/docs',
      headers: { cookie: 'citrineos_swagger_auth=good-token' },
    });

    expect(response.statusCode).toBe(200);
  });
});
