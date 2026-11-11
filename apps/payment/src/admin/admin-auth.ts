// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KeyObject } from 'node:crypto';
import { createPublicKey, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Algorithm, JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import type { PaymentConfig } from '../config/types.js';
import { PaymentError } from '../services/errors.js';

/** Who is calling the admin API: the platform, for every tenant, or one tenant's admin. */
export type AdminPrincipal = { scope: 'platform' } | { scope: 'tenant'; tenantId: number };

export interface IAdminAuthenticator {
  /** Throws `unauthorized` without credentials and `forbidden` for ones that do not grant access. */
  authenticate(authorization: string | undefined): Promise<AdminPrincipal>;
}

export type AdminJwtConfig = NonNullable<PaymentConfig['admin']['jwt']>;

/** Finds the public key a token was signed with, by its `kid`. */
export type SigningKeyResolver = (kid: string) => Promise<KeyObject>;

export function jwksResolver(jwksUri: string): SigningKeyResolver {
  const client = jwksClient({ jwksUri, cache: true, rateLimit: true, jwksRequestsPerMinute: 5 });
  return async (kid) => createPublicKey((await client.getSigningKey(kid)).getPublicKey());
}

/** Reads a dotted claim path, so nested shapes like `resource_access.<client>.roles` resolve. */
function readClaim(payload: JwtPayload, path: string): unknown {
  if (path in payload) {
    return payload[path];
  }
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        typeof value === 'object' && value !== null && key in value
          ? Object.entries(value).find(([name]) => name === key)?.[1]
          : undefined,
      payload,
    );
}

function algorithmsFor(key: KeyObject): Algorithm[] {
  return key.asymmetricKeyType === 'ec' ? ['ES256', 'ES384', 'ES512'] : ['RS256', 'RS384', 'RS512'];
}

/**
 * Accepts the platform's API key, or a JWT from the issuer Core trusts in auth mode jwt with the
 * admin role, which grants access to the tenant it names. Core's own localDev tokens are signed
 * with a key that never leaves Core, so local development uses the API key.
 */
export class AdminAuthenticator implements IAdminAuthenticator {
  private readonly _apiKey?: Buffer;
  private readonly _jwt?: AdminJwtConfig;
  private readonly _resolveKey?: SigningKeyResolver;

  constructor(
    config: PaymentConfig['admin'],
    resolveKey: SigningKeyResolver | undefined = config.jwt && jwksResolver(config.jwt.jwksUri),
  ) {
    this._apiKey = config.apiKey ? Buffer.from(config.apiKey) : undefined;
    this._jwt = config.jwt;
    this._resolveKey = resolveKey;
  }

  get enabled(): boolean {
    return this._apiKey !== undefined || this._jwt !== undefined;
  }

  async authenticate(authorization: string | undefined): Promise<AdminPrincipal> {
    const match = /^Bearer\s+(\S+)$/i.exec(authorization ?? '');
    if (!match) {
      throw new PaymentError('unauthorized', 'An Authorization: Bearer header is required');
    }
    const credential = match[1];
    if (this._isApiKey(credential)) {
      return { scope: 'platform' };
    }
    if (!this._jwt || !this._resolveKey || credential.split('.').length !== 3) {
      throw new PaymentError('forbidden', 'These credentials do not grant admin access');
    }
    return this._tenantOf(credential, this._jwt, this._resolveKey);
  }

  private _isApiKey(credential: string): boolean {
    if (!this._apiKey) {
      return false;
    }
    const given = Buffer.from(credential);
    return given.length === this._apiKey.length && timingSafeEqual(given, this._apiKey);
  }

  private async _tenantOf(
    token: string,
    config: AdminJwtConfig,
    resolveKey: SigningKeyResolver,
  ): Promise<AdminPrincipal> {
    let payload: JwtPayload;
    try {
      const decoded = jwt.decode(token, { complete: true });
      const kid = decoded?.header.kid;
      if (!kid) {
        throw new Error('The token names no signing key');
      }
      const key = await resolveKey(kid);
      const verified = jwt.verify(token, key, {
        algorithms: algorithmsFor(key),
        issuer: config.issuer,
        ...(config.audience && { audience: config.audience }),
      });
      if (typeof verified === 'string') {
        throw new Error('The token has no claims');
      }
      payload = verified;
    } catch (error) {
      throw new PaymentError('forbidden', `Invalid token: ${String(error)}`);
    }

    const roles = readClaim(payload, config.rolesClaim);
    const roleList = Array.isArray(roles)
      ? roles
      : typeof roles === 'string'
        ? roles.split(' ')
        : [];
    if (!roleList.includes(config.role)) {
      throw new PaymentError('forbidden', `The token lacks the ${config.role} role`);
    }
    const tenantId = Number(readClaim(payload, config.tenantClaim));
    if (!Number.isInteger(tenantId) || tenantId < 1) {
      throw new PaymentError('forbidden', 'The token names no tenant');
    }
    return { scope: 'tenant', tenantId };
  }
}
