// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { createPublicKey, createSecretKey, generateKeyPairSync, type KeyObject } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { UserInfo } from '@citrineos/base';
import { JwtAuthProvider } from '@/apis/authorization/provider/jwt-auth-provider.js';
import type { PolicyStore } from '@/apis/authorization/policy/policy-store.js';

const ISSUER = 'https://idp.example.test/realms/citrineos';
const AUDIENCE = 'citrineos-central-system';
const KID = 'test-key';

let privateKey: string;
let publicKey: string;

beforeAll(() => {
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  privateKey = pair.privateKey;
  publicKey = pair.publicKey;
});

function aPolicyStore(granted: boolean): PolicyStore {
  return {
    hasPermission: vi.fn(() => granted),
    permissionsFor: vi.fn(() => ({ resources: {}, permissions: [] })),
  } as unknown as PolicyStore;
}

/**
 * The key is supplied directly, so the tests exercise the verification options rather than the
 * network. This is the same path localDev takes.
 */
function aProvider(
  overrides: {
    audience?: string;
    granted?: boolean;
    rolesClaim?: string;
    publicKey?: KeyObject;
  } = {},
) {
  return new JwtAuthProvider(
    {
      publicKey: overrides.publicKey ?? createPublicKey(publicKey),
      issuer: ISSUER,
      audience: 'audience' in overrides ? overrides.audience : AUDIENCE,
      rolesClaim: overrides.rolesClaim ?? 'roles',
      tenantClaim: 'tenant_id',
      defaultTenantId: '1',
    },
    aPolicyStore(overrides.granted ?? true),
  );
}

function aTokenSignedBy(payload: Record<string, unknown>) {
  return jwt.sign(payload, privateKey, { algorithm: 'RS256', keyid: KID });
}

function aUser(tenantId: string, roles: string[] = ['user']): UserInfo {
  return { id: 'user-1', name: 'user-1', email: '', roles, tenantId };
}

function aRequest(override: {
  url: string;
  method?: string;
  query?: Record<string, string>;
  body?: unknown;
}): FastifyRequest {
  return { method: 'POST', query: {}, ...override } as unknown as FastifyRequest;
}

function aRouteRequest(
  override: Parameters<typeof aRequest>[0],
  permission = 'ocpp.configuration.reset',
) {
  const request = aRequest(override);
  (request as { routeOptions?: unknown }).routeOptions = { config: { permission } };
  return request;
}

describe('JwtAuthProvider.authenticateToken', () => {
  it('accepts a token issued for this audience by the configured issuer', async () => {
    const token = aTokenSignedBy({ sub: 'user-1', iss: ISSUER, aud: AUDIENCE, roles: ['admin'] });

    const result = await aProvider().authenticateToken(token);

    expect(result.isAuthenticated).toBe(true);
    expect(result.user?.id).toBe('user-1');
  });

  it('rejects a token minted for a different audience', async () => {
    // The identity provider signs tokens for every client in the realm with the same keys, so a
    // token issued to an unrelated service verifies against the JWKS. Without an audience check
    // that token authenticates here, granting its bearer whatever roles it happens to carry.
    const token = aTokenSignedBy({
      sub: 'user-1',
      iss: ISSUER,
      aud: 'some-other-service',
      roles: ['admin'],
    });

    const result = await aProvider().authenticateToken(token);

    expect(result.isAuthenticated).toBe(false);
  });

  it('rejects a token from a different issuer', async () => {
    const token = aTokenSignedBy({
      sub: 'user-1',
      iss: 'https://attacker.example.test/realms/citrineos',
      aud: AUDIENCE,
      roles: ['admin'],
    });

    const result = await aProvider().authenticateToken(token);

    expect(result.isAuthenticated).toBe(false);
  });

  it('rejects an expired token', async () => {
    const token = aTokenSignedBy({
      sub: 'user-1',
      iss: ISSUER,
      aud: AUDIENCE,
      exp: Math.floor(Date.now() / 1000) - 60,
    });

    const result = await aProvider().authenticateToken(token);

    expect(result.isAuthenticated).toBe(false);
  });
});

describe('JwtAuthProvider.authorizeUser', () => {
  const resetUrl = '/ocpp/2.0.1/configuration/reset';

  it('refuses a token for one tenant that names another tenant in the query', async () => {
    const result = await aProvider().authorizeUser(
      aUser('2'),
      aRouteRequest({
        url: `${resetUrl}?identifier=CS-1&tenantId=1`,
        query: { identifier: 'CS-1', tenantId: '1' },
      }),
    );

    expect(result.isAuthorized).toBe(false);
  });

  it('refuses a token for one tenant that names another tenant in the body', async () => {
    const result = await aProvider().authorizeUser(
      aUser('2'),
      aRouteRequest({
        url: '/commands/installRootCertificate',
        method: 'PUT',
        body: { tenantId: 1, ocppConnectionName: 'CS-1' },
      }),
    );

    expect(result.isAuthorized).toBe(false);
  });

  it('authorises a token whose tenant is the requested tenant', async () => {
    const result = await aProvider().authorizeUser(
      aUser('2'),
      aRouteRequest({
        url: `${resetUrl}?identifier=CS-1&tenantId=2`,
        query: { identifier: 'CS-1', tenantId: '2' },
      }),
    );

    expect(result.isAuthorized).toBe(true);
  });

  it('compares a numeric tenant claim with the requested tenant as strings', async () => {
    const provider = aProvider();
    const token = aTokenSignedBy({
      sub: 'user-1',
      iss: ISSUER,
      aud: AUDIENCE,
      roles: ['user'],
      tenant_id: 2,
    });
    const authentication = await provider.authenticateToken(token);
    expect(authentication.user?.tenantId).toBe('2');

    const result = await provider.authorizeUser(
      authentication.user as UserInfo,
      aRouteRequest({
        url: `${resetUrl}?identifier=CS-1&tenantId=2`,
        query: { identifier: 'CS-1', tenantId: '2' },
      }),
    );

    expect(result.isAuthorized).toBe(true);
  });

  it('refuses a route that declares no permission', async () => {
    const result = await aProvider().authorizeUser(
      aUser('1'),
      aRequest({ url: '/somewhere/unmapped' }),
    );

    expect(result.isAuthorized).toBe(false);
  });

  it('refuses when the policy store does not grant the route permission', async () => {
    const result = await aProvider({ granted: false }).authorizeUser(
      aUser('1'),
      aRouteRequest({ url: resetUrl }),
    );

    expect(result.isAuthorized).toBe(false);
  });
});

describe('JwtAuthProvider claim paths', () => {
  it('reads roles from a nested claim path', async () => {
    const provider = aProvider({ rolesClaim: 'resource_access.operator-ui.roles' });
    const token = aTokenSignedBy({
      sub: 'user-1',
      iss: ISSUER,
      aud: AUDIENCE,
      resource_access: { 'operator-ui': { roles: ['partner'] } },
    });

    const result = await provider.authenticateToken(token);

    expect(result.user?.roles).toEqual(['partner']);
  });

  it('yields no roles when the configured claim is absent', async () => {
    const provider = aProvider({ rolesClaim: 'resource_access.operator-ui.roles' });
    const token = aTokenSignedBy({ sub: 'user-1', iss: ISSUER, aud: AUDIENCE, roles: ['admin'] });

    const result = await provider.authenticateToken(token);

    expect(result.user?.roles).toEqual([]);
  });

  it('accepts a token for any audience when none is configured', async () => {
    const provider = aProvider({ audience: undefined });
    const token = aTokenSignedBy({
      sub: 'user-1',
      iss: ISSUER,
      aud: 'some-other-service',
      roles: ['admin'],
    });

    const result = await provider.authenticateToken(token);

    expect(result.isAuthenticated).toBe(true);
  });
});

describe('JwtAuthProvider algorithm pinning', () => {
  it('refuses a symmetric key, which could mint the tokens it verifies', async () => {
    const secret = createSecretKey(Buffer.from('shared-secret-value-32-bytes-long'));
    const token = jwt.sign({ sub: 'anyone', iss: ISSUER, aud: AUDIENCE }, secret, {
      algorithm: 'HS256',
      keyid: KID,
    });

    const result = await aProvider({ publicKey: secret }).authenticateToken(token);

    expect(result.isAuthenticated).toBe(false);
  });

  it('accepts every signing algorithm an RSA key supports', async () => {
    const token = jwt.sign(
      { sub: 'user-1', iss: ISSUER, aud: AUDIENCE, roles: ['admin'] },
      privateKey,
      {
        algorithm: 'PS512',
        keyid: KID,
      },
    );

    const result = await aProvider().authenticateToken(token);

    expect(result.isAuthenticated).toBe(true);
  });

  it('accepts a token from an EC signing key', async () => {
    const pair = generateKeyPairSync('ec', {
      namedCurve: 'P-256',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const token = jwt.sign(
      { sub: 'user-1', iss: ISSUER, aud: AUDIENCE, roles: ['admin'] },
      pair.privateKey,
      {
        algorithm: 'ES256',
        keyid: KID,
      },
    );

    const result = await aProvider({
      publicKey: createPublicKey(pair.publicKey),
    }).authenticateToken(token);

    expect(result.isAuthenticated).toBe(true);
  });
});
