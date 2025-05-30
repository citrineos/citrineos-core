// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * Interface for user information extracted from authentication tokens
 */
export interface UserInfo {
  /**
   * The user ID.
   */
  id: string;

  /**
   * The username.
   */
  name: string;

  /**
   * The user email.
   */
  email: string;

  /**
   * The user roles.
   */
  roles: string[];

  /**
   * Tenant ID associated with the user.
   */
  tenantId: string;

  /**
   * Additional fields associated with the user
   */
  [key: string]: any;
}
