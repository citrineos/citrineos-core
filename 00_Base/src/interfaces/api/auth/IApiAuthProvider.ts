// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { UserInfo } from './UserInfo.js';
import type { FastifyRequest } from 'fastify';
import { ApiAuthorizationResult } from './ApiAuthorizationResult.js';
import { ApiAuthenticationResult } from './ApiAuthenticationResult.js';

/**
 * Interface for authentication providers
 */
export interface IApiAuthProvider {
  /**
   * Extracts the authentication token from the request
   * @param request
   */
  extractToken(request: FastifyRequest): Promise<string | null>;

  /**
   * Authenticates a token and extracts user information
   *
   * @param token JWT or other token to authenticate
   * @returns Authentication result with user info if successful
   */
  authenticateToken(token: string): Promise<ApiAuthenticationResult>;

  /**
   * Authorizes a user for a specific request
   *
   * @param user User information
   * @param request Fastify request
   * @returns Authorization result
   */
  authorizeUser(user: UserInfo, request: FastifyRequest): Promise<ApiAuthorizationResult>;
}
