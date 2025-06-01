/*
 * // Copyright Contributors to the CitrineOS Project
 * //
 * // SPDX-License-Identifier: Apache 2.0
 *
 */

// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import {
  ApiAuthenticationResult,
  ApiAuthorizationResult,
  IApiAuthProvider,
  UserInfo,
} from '@citrineos/base';

/**
 * A local bypass authentication provider that doesn't perform actual authentication
 * Only for development and testing environments
 */
export class LocalBypassAuthProvider implements IApiAuthProvider {
  private readonly _logger: Logger<ILogObj>;

  /**
   * Creates a new local bypass authentication provider
   *
   * @param logger Optional logger instance
   */
  constructor(logger?: Logger<ILogObj>) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._logger.warn(
      '⚠️ WARNING: Using LocalBypassAuthProvider - This should only be used in development environments',
    );
  }

  /**
   * Always returns a successful authentication with admin user
   *
   * @param token Ignored, can be any string
   * @returns Authentication result with admin user info
   */
  async authenticateToken(token: string): Promise<ApiAuthenticationResult> {
    this._logger.debug('LocalBypassAuthProvider.authenticateToken: Bypassing authentication');

    // Create a default admin user
    const user: UserInfo = {
      id: 'local-admin',
      name: 'Local Admin',
      email: 'admin@local',
      roles: ['admin', 'user'],
      groups: ['administrators'],
      tenantId: '1',
      metadata: {
        isLocalBypass: true,
      },
    };

    return ApiAuthenticationResult.success(user);
  }

  /**
   * Always returns a successful authorization
   *
   * @param user Ignored, can be any user
   * @param request Ignored, can be any request
   * @returns Always successful authorization
   */
  async authorizeUser(user: UserInfo, request: FastifyRequest): Promise<ApiAuthorizationResult> {
    this._logger.debug(
      `LocalBypassAuthProvider.authorizeUser: Bypassing authorization for ${request.method} ${request.url}`,
    );

    return ApiAuthorizationResult.success();
  }
}
