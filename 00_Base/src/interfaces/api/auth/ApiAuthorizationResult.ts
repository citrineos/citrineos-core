/*
 * // Copyright Contributors to the CitrineOS Project
 * //
 * // SPDX-License-Identifier: Apache 2.0
 *
 */

/**
 * Result of authorization process
 */
export class ApiAuthorizationResult {
  /**
   * Whether authorization was successful
   */
  isAuthorized: boolean = false;

  /**
   * Error message if authorization failed
   */
  error?: string;

  /**
   * Creates a new successful authorization result
   *
   * @returns Authorization result
   */
  static success(): ApiAuthorizationResult {
    const result = new ApiAuthorizationResult();
    result.isAuthorized = true;
    return result;
  }

  /**
   * Creates a new failed authorization result
   *
   * @param error Error message
   * @returns Authorization result
   */
  static failure(error: string): ApiAuthorizationResult {
    const result = new ApiAuthorizationResult();
    result.isAuthorized = false;
    result.error = error;
    return result;
  }
}
