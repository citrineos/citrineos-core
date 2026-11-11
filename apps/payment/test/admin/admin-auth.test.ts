// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { generateKeyPairSync } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { AdminAuthenticator } from '../../src/admin/admin-auth.js';
import type { PaymentConfig } from '../../src/config/types.js';
import { PaymentError } from '../../src/services/errors.js';

const API_KEY = 'an-admin-api-key-that-is-long-enough';
const ISSUER = 'https://id.example.com';
const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const otherKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });

const JWT = {
  jwksUri: `${ISSUER}/jwks`,
  issuer: ISSUER,
  audience: 'payment',
  rolesClaim: 'realm_access.roles',
  tenantClaim: 'tenant_id',
  role: 'admin',
};

function aToken(claims: object, options: jwt.SignOptions = {}, key = keys.privateKey) {
  return jwt.sign(claims, key, {
    algorithm: 'RS256',
    keyid: 'key-1',
    issuer: ISSUER,
    audience: 'payment',
    expiresIn: 300,
    ...options,
  });
}

function anAuthenticator(config: PaymentConfig['admin'] = { apiKey: API_KEY, jwt: JWT }) {
  return new AdminAuthenticator(config, async (kid) => {
    if (kid !== 'key-1') {
      throw new Error(`Unknown key ${kid}`);
    }
    return keys.publicKey;
  });
}

async function refusal(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  if (!(error instanceof PaymentError)) {
    throw new Error(`Expected a PaymentError, got ${String(error)}`);
  }
  return error.code;
}

const admin = { realm_access: { roles: ['admin'] }, tenant_id: '3' };

describe('AdminAuthenticator', () => {
  it('grants the platform access to the API key', async () => {
    expect(await anAuthenticator().authenticate(`Bearer ${API_KEY}`)).toEqual({
      scope: 'platform',
    });
  });

  it('grants a tenant admin’s token access to that tenant', async () => {
    expect(await anAuthenticator().authenticate(`Bearer ${aToken(admin)}`)).toEqual({
      scope: 'tenant',
      tenantId: 3,
    });
  });

  it('reads roles given as a space-separated string', async () => {
    const token = aToken({ ...admin, realm_access: { roles: 'viewer admin' } });

    expect(await anAuthenticator().authenticate(`Bearer ${token}`)).toMatchObject({
      tenantId: 3,
    });
  });

  it.each([
    ['nothing', undefined, 'unauthorized'],
    ['no Bearer scheme', `Basic ${API_KEY}`, 'unauthorized'],
    ['a wrong API key', `Bearer ${API_KEY.replace('a', 'b')}`, 'forbidden'],
    [
      'a token without the role',
      `Bearer ${aToken({ ...admin, realm_access: { roles: ['viewer'] } })}`,
      'forbidden',
    ],
    [
      'a token without a tenant',
      `Bearer ${aToken({ realm_access: { roles: ['admin'] } })}`,
      'forbidden',
    ],
    ['a token for another audience', `Bearer ${aToken(admin, { audience: 'core' })}`, 'forbidden'],
    [
      'a token from another issuer',
      `Bearer ${aToken(admin, { issuer: 'https://evil.example.com' })}`,
      'forbidden',
    ],
    ['an expired token', `Bearer ${aToken(admin, { expiresIn: -10 })}`, 'forbidden'],
    [
      'a token signed with another key',
      `Bearer ${aToken(admin, {}, otherKeys.privateKey)}`,
      'forbidden',
    ],
    ['a token naming an unknown key', `Bearer ${aToken(admin, { keyid: 'key-2' })}`, 'forbidden'],
  ])('refuses %s', async (_name, authorization, code) => {
    expect(await refusal(anAuthenticator().authenticate(authorization))).toBe(code);
  });

  it('refuses tokens when only the API key is configured, and everything when nothing is', async () => {
    const keyOnly = anAuthenticator({ apiKey: API_KEY, jwt: undefined });
    const closed = new AdminAuthenticator({});

    expect(await refusal(keyOnly.authenticate(`Bearer ${aToken(admin)}`))).toBe('forbidden');
    expect(closed.enabled).toBe(false);
    expect(await refusal(closed.authenticate(`Bearer ${API_KEY}`))).toBe('forbidden');
  });
});
