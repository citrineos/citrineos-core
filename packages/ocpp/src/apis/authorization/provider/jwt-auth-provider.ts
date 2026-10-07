// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { FastifyRequest } from 'fastify';
import type { ILogObj, Logger } from 'tslog';
import type { Algorithm, JwtPayload } from 'jsonwebtoken';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import JwksRsa from 'jwks-rsa';
import {
  ApiAuthenticationResult,
  ApiAuthorizationResult,
  childLogger,
  type IApiAuthProvider,
  notNull,
  type UserInfo,
} from '@citrineos/base';
import { createPublicKey, type KeyObject } from 'crypto';
import type { PolicyStore } from '../policy/policy-store.js';

export interface JwtAuthConfig {
  /** Omitted when `publicKey` is supplied, as localDev does. */
  jwksUri?: string;
  /** Verifies against this key instead of fetching a JWKS document. */
  publicKey?: KeyObject;
  issuer: string;
  /** When unset, any validly signed token from the issuer is accepted, including one minted for another client. */
  audience?: string;
  rolesClaim: string;
  tenantClaim: string;
  defaultTenantId: string;
  cacheTime?: number;
  rateLimit?: boolean;
}

const ALGORITHMS_BY_KEY_TYPE: Record<string, Algorithm[]> = {
  rsa: ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'],
  'rsa-pss': ['PS256', 'PS384', 'PS512'],
  ec: ['ES256', 'ES384', 'ES512'],
};

/**
 * Restricts verification to the algorithms the signing key can actually produce.
 */
function algorithmsFor(key: KeyObject): Algorithm[] {
  const allowed = key.asymmetricKeyType && ALGORITHMS_BY_KEY_TYPE[key.asymmetricKeyType];
  if (!allowed) {
    throw new Error(`Unsupported JWT signing key type: ${key.asymmetricKeyType ?? 'symmetric'}`);
  }
  return allowed;
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
        value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined,
      payload,
    );
}

export class JwtAuthProvider implements IApiAuthProvider {
  private readonly _config: JwtAuthConfig;
  private readonly _logger: Logger<ILogObj>;
  private readonly _jwksClient?: JwksRsa.JwksClient;
  private readonly _policyStore: PolicyStore;

  constructor(config: JwtAuthConfig, policyStore: PolicyStore, logger?: Logger<ILogObj>) {
    this._config = {
      cacheTime: 60 * 60 * 1000,
      rateLimit: true,
      ...config,
    };

    this._logger = childLogger(logger, this.constructor.name);
    this._policyStore = policyStore;

    if (!this._config.publicKey) {
      if (!this._config.jwksUri) {
        throw new Error('JwtAuthProvider needs either a jwksUri or a publicKey');
      }
      this._jwksClient = jwksClient({
        jwksUri: this._config.jwksUri,
        cache: true,
        cacheMaxAge: this._config.cacheTime,
        rateLimit: this._config.rateLimit,
        jwksRequestsPerMinute: 5,
      });
    }

    if (!this._config.audience) {
      this._logger.warn(
        'No audience configured: any validly signed token from this issuer will be accepted, including one minted for another of its clients',
      );
    }

    this._logger.info(
      this._config.publicKey
        ? 'JWT auth provider verifying against a supplied public key'
        : `JWT auth provider setup with jwksUri: ${this._config.jwksUri}`,
    );
  }

  async extractToken(request: FastifyRequest): Promise<string | null> {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this._logger.warn('No Bearer token found in request headers');
      return null;
    }
    return authHeader.slice(7).trim();
  }

  async authenticateToken(token: string): Promise<ApiAuthenticationResult> {
    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded !== 'object' || !decoded.header || !decoded.header.kid) {
        throw new Error('Invalid token format');
      }
      const publicKey = await this.resolveKey(decoded.header.kid);
      const payload = jwt.verify(token, publicKey, {
        algorithms: algorithmsFor(publicKey),
        issuer: this._config.issuer,
        ...(this._config.audience && { audience: this._config.audience }),
      }) as JwtPayload;

      const user: UserInfo = {
        id: payload.sub as string,
        name: payload.preferred_username || payload.name || payload.sub,
        email: payload.email || '',
        roles: this.extractRoles(payload),
        tenantId: String(
          readClaim(payload, this._config.tenantClaim) ?? this._config.defaultTenantId,
        ),
        metadata: {
          firstName: payload.given_name,
          lastName: payload.family_name,
          fullName: payload.name,
          emailVerified: payload.email_verified,
          locale: payload.locale || 'en-US',
        },
      };

      return ApiAuthenticationResult.success(user);
    } catch (error) {
      this._logger.error('Token authentication failed:', error);
      return ApiAuthenticationResult.failure(
        error instanceof Error ? error.message : 'Invalid token',
      );
    }
  }

  async authorizeUser(user: UserInfo, request: FastifyRequest): Promise<ApiAuthorizationResult> {
    try {
      const tenantId = user.tenantId;
      const requestedTenantId =
        (request.query as { tenantId?: string }).tenantId ??
        (request.body as { tenantId?: number | string } | undefined)?.tenantId;
      if (notNull(requestedTenantId) && String(requestedTenantId) !== tenantId) {
        return ApiAuthorizationResult.failure(
          `Token tenant ${tenantId} may not act on tenant ${requestedTenantId}`,
        );
      }

      const permission = (request.routeOptions?.config as { permission?: string } | undefined)
        ?.permission;
      if (!permission) {
        return ApiAuthorizationResult.failure(
          `No permission is declared for ${request.method} ${request.url}`,
        );
      }

      if (this._policyStore.hasPermission(user.roles, permission)) {
        return ApiAuthorizationResult.success();
      }

      return ApiAuthorizationResult.failure(`Missing permission ${permission}`);
    } catch (error) {
      this._logger.error('Authorization error:', error);
      return ApiAuthorizationResult.failure(
        `Authorization error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async resolveKey(kid: string): Promise<KeyObject> {
    if (this._config.publicKey) {
      return this._config.publicKey;
    }
    const jwksClientInstance = this._jwksClient;
    return new Promise<KeyObject>((resolve, reject) => {
      jwksClientInstance!.getSigningKey(kid, (err, key) => {
        if (err) {
          this._logger.error(`Error fetching signing key for kid: ${kid}`, err);
          return reject(err);
        }

        if (!key) {
          const error = new Error(`No signing key found for kid: ${kid}`);
          this._logger.error(error.message);
          return reject(error);
        }

        try {
          resolve(createPublicKey(key.getPublicKey()));
        } catch (keyError) {
          this._logger.error('Error extracting public key:', keyError);
          reject(keyError);
        }
      });
    });
  }

  private extractRoles(payload: JwtPayload): string[] {
    const claim = readClaim(payload, this._config.rolesClaim);
    return Array.isArray(claim) ? claim.map(String) : [];
  }
}
