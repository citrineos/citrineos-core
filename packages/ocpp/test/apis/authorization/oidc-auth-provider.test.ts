// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { generateKeyPairSync } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { UserInfo } from '@citrineos/base';
import { OIDCAuthProvider } from '@/apis/authorization/provider/oidc-auth-provider.js';

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

/**
 * Builds a provider whose JWKS lookup is short-circuited to the test key pair, so that the tests
 * exercise the verification options rather than the network.
 */
function aProvider() {
  const provider = new OIDCAuthProvider({
    jwksUri: 'http://jwks.invalid/keys',
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  (provider as unknown as { fetchPublicKey: (kid: string) => Promise<string> }).fetchPublicKey =
    async () => publicKey;
  return provider;
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

function givenRequiredRoles(provider: OIDCAuthProvider, roles: Record<string, string[]>) {
  const getRequiredRoles = vi.fn((tenantId: string) => roles[tenantId] ?? null);
  (
    provider as unknown as { _rulesLoader: { getRequiredRoles: typeof getRequiredRoles } }
  )._rulesLoader.getRequiredRoles = getRequiredRoles;
  return getRequiredRoles;
}

describe('OIDCAuthProvider.authenticateToken', () => {
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

describe('OIDCAuthProvider.authorizeUser', () => {
  const resetUrl = '/ocpp/2.0.1/configuration/reset';

  it('refuses a token for one tenant that names another tenant in the query', async () => {
    const provider = aProvider();
    givenRequiredRoles(provider, { '1': ['user'], '2': ['user'] });

    const result = await provider.authorizeUser(
      aUser('2'),
      aRequest({
        url: `${resetUrl}?identifier=CS-1&tenantId=1`,
        query: { identifier: 'CS-1', tenantId: '1' },
      }),
    );

    expect(result.isAuthorized).toBe(false);
  });

  it('looks up the rules of the token tenant when the request names no tenant', async () => {
    const provider = aProvider();
    const getRequiredRoles = givenRequiredRoles(provider, { '1': ['user'], '2': ['user'] });

    await provider.authorizeUser(
      aUser('2'),
      aRequest({ url: `${resetUrl}?identifier=CS-1`, query: { identifier: 'CS-1' } }),
    );

    expect(getRequiredRoles).toHaveBeenCalledWith('2', `${resetUrl}?identifier=CS-1`, 'POST');
  });

  it('refuses a token for one tenant that names another tenant in the body', async () => {
    const provider = aProvider();
    givenRequiredRoles(provider, { '1': ['user'], '2': ['user'] });

    const result = await provider.authorizeUser(
      aUser('2'),
      aRequest({
        url: '/commands/installRootCertificate',
        method: 'PUT',
        body: { tenantId: 1, ocppConnectionName: 'CS-1' },
      }),
    );

    expect(result.isAuthorized).toBe(false);
  });

  it('authorises a token whose tenant is the requested tenant', async () => {
    const provider = aProvider();
    givenRequiredRoles(provider, { '2': ['user'] });

    const result = await provider.authorizeUser(
      aUser('2'),
      aRequest({
        url: `${resetUrl}?identifier=CS-1&tenantId=2`,
        query: { identifier: 'CS-1', tenantId: '2' },
      }),
    );

    expect(result.isAuthorized).toBe(true);
  });
});
