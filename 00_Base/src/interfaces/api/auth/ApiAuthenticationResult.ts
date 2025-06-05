/*
 * // Copyright Contributors to the CitrineOS Project
 * //
 * // SPDX-License-Identifier: Apache 2.0
 *
 */

import { UserInfo } from './UserInfo';

/**
 * Result of authentication process
 */
export class ApiAuthenticationResult {
  /**
   * Whether authentication was successful
   */
  isAuthenticated: boolean = false;

  /**
   * User information if authentication was successful
   */
  user?: UserInfo;

  /**
   * Error message if authentication failed
   */
  error?: string;

  /**
   * Creates a new successful authentication result
   *
   * @param user Authenticated user information
   * @returns Authentication result
   */
  static success(user: UserInfo): ApiAuthenticationResult {
    const result = new ApiAuthenticationResult();
    result.isAuthenticated = true;
    result.user = user;
    return result;
  }

  /**
   * Creates a new failed authentication result
   *
   * @param error Error message
   * @returns Authentication result
   */
  static failure(error: string): ApiAuthenticationResult {
    const result = new ApiAuthenticationResult();
    result.isAuthenticated = false;
    result.error = error;
    return result;
  }
}
