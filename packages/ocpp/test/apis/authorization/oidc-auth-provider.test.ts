// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { beforeAll, describe, expect, it } from 'vitest';
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
