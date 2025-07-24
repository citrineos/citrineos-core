/*
 * // Copyright Contributors to the CitrineOS Project
 * //
 * // SPDX-License-Identifier: Apache 2.0
 *
 */

import { FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import jwt, { JwtPayload } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import JwksRsa from 'jwks-rsa';

import {
  ApiAuthenticationResult,
  ApiAuthorizationResult,
  IApiAuthProvider,
  UserInfo,
} from '@citrineos/base';
import { createPublicKey } from 'crypto';
import { RbacRulesLoader } from '../rbac/RbacRulesLoader';

export interface OIDCConfig {
  // JWKS URI for the public keys
  jwksUri: string;

  // Expected issuer of tokens
  issuer: string;

  // Expected audience of tokens (usually the client ID)
  audience?: string;

  // How long to cache keys (ms)
  cacheTime?: number;

  // Rate limiting for JWKS requests
  rateLimit?: boolean;
}

/**
 * OIDC authentication provider implementation
 */
export class OIDCAuthProvider implements IApiAuthProvider {
  private readonly _config: OIDCConfig;
  private readonly _logger: Logger<ILogObj>;
  private readonly _jkwsClient: JwksRsa.JwksClient;
  private readonly _rulesLoader: RbacRulesLoader;
  private readonly _defaultTenantId: string = '1'; //TODO get default from config

  /**
   * Creates a new Keycloak authentication provider
   *
   * @param config OIDC configuration
   * @param logger Optional logger instance
   */
  constructor(config: OIDCConfig, logger?: Logger<ILogObj>) {
    this._config = {
      cacheTime: 60 * 60 * 1000, // Default 1 hour cache
      rateLimit: true,
      ...config,
    };

    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._logger.info('OIDC auth provider config', this._config);
    // Create the JWKS client
    this._jkwsClient = jwksClient({
      jwksUri: this._config.jwksUri,
      cache: true,
      cacheMaxAge: this._config.cacheTime,
      rateLimit: this._config.rateLimit,
      jwksRequestsPerMinute: 5, // Limit requests to JWKS endpoint
    });

    this._rulesLoader = new RbacRulesLoader('rbac-rules.json', this._logger);

    this._logger.info(`OIDC auth provider setup with jwksUri: ${this._config.jwksUri}`);
  }

  async extractToken(request: FastifyRequest): Promise<string | null> {
    // Extract the Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this._logger.warn('No Bearer token found in request headers');
      return null;
    }

    // Return the token without the "Bearer " prefix
    const token = authHeader.slice(7).trim();
    this._logger.debug('Extracted token from request:', token);
    return token;
  }

  /**
   * Authenticates a JWT token from and OIDC provider
   *
   * @param token JWT token to authenticate
   * @returns Authentication result with user info if successful
   */
  async authenticateToken(token: string): Promise<ApiAuthenticationResult> {
    try {
      const decoded = jwt.decode(token, { complete: true });

      if (!decoded || typeof decoded !== 'object' || !decoded.header || !decoded.header.kid) {
        throw new Error('Invalid token format');
      }
      const publicKey = await this.fetchPublicKey(decoded.header.kid);
      // Verify the token with the public key
      const payload = jwt.verify(token, createPublicKey(publicKey)) as JwtPayload;

      // Extract user info from the decoded token
      const user: UserInfo = {
        id: payload.sub as string,
        name: payload.preferred_username || payload.name || payload.sub,
        email: payload.email || '',
        roles: this.extractRoles(payload),
        tenantId: payload.tenant_id || this._defaultTenantId,
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

  /**
   * Authorizes a user for a specific request
   * This implementation checks if the user has the required permissions
   * for the requested URL and method
   *
   * @param user User information
   * @param request Fastify request
   * @returns Authorization result
   */
  async authorizeUser(user: UserInfo, request: FastifyRequest): Promise<ApiAuthorizationResult> {
    try {
      // Get the requested resource and method
      const url = request.url;
      const method = request.method;
      const tenantId = (request.query as { tenantId?: string }).tenantId || this._defaultTenantId;

      const requiredRoles = this._rulesLoader.getRequiredRoles(tenantId, url, method);

      //If no role is found for the requested resource and tenant, decline access
      if (!requiredRoles || requiredRoles.length === 0) {
        return ApiAuthorizationResult.failure(
          `Tenant does not have access to this resource ${url}`,
        );
      }
      if (this.userHasRequiredRole(user, requiredRoles)) {
        return ApiAuthorizationResult.success();
      }

      return ApiAuthorizationResult.failure(
        `Missing required roles. Need one of: ${requiredRoles.join(', ')} for tenant ${tenantId}`,
      );
    } catch (error) {
      this._logger.error('Authorization error:', error);
      return ApiAuthorizationResult.failure(
        `Authorization error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Fetches the public key from OIDC provider
   * @param {string} kid Key ID from the JWT header
   * @returns {Promise<string>} Public key as a string
   * @private
   */
  private async fetchPublicKey(kid: string): Promise<string> {
    try {
      return new Promise<string>((resolve, reject) => {
        this._jkwsClient.getSigningKey(kid, (err, key) => {
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
            // Get the public key
            const signingKey = key.getPublicKey();
            resolve(signingKey);
          } catch (keyError) {
            this._logger.error('Error extracting public key:', keyError);
            reject(keyError);
          }
        });
      });
    } catch (error) {
      this._logger.error('Failed to fetch public key:', error);
      throw error;
    }
  }

  /**
   * Extracts roles from a decoded JWT token
   *
   * @param decoded The decoded JWT token
   * @returns Array of role strings
   * @private
   */
  private extractRoles(decoded: any): string[] {
    //Customize here to match your token structure
    return decoded.roles || [];
  }

  /**
   * Check if a user has any of the required roles for a specific tenant
   *
   * @param user User with roles
   * @param requiredRoles Array of role names (without tenant prefix)
   * @returns True if user has any of the required roles
   */
  private userHasRequiredRole(user: UserInfo, requiredRoles: string[]): boolean {
    return user.roles.some((userRole) => requiredRoles.includes(userRole));
  }
}
