// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ActionType,
  type ListCanReturnType,
  type OperatorCanParams,
} from '@lib/utils/access-types';
import type { AccessControlProvider, CanReturnType } from '@refinedev/core';

/**
 * Configuration options for access provider
 */
export interface AccessProviderConfig<TPermissions = unknown> {
  getPermissions: (params?: Record<string, any>) => Promise<TPermissions | null>;
  getUserRole: (permissions?: TPermissions) => Promise<string | undefined>;
}

/**
 * Simple role-based permission mapping
 */
const ROLE_PERMISSIONS = {
  admin: {
    // Admin has full access to everything
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: true,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
  user: {
    // Customize user access as needed; for now has the same permissions as Admin
    [ActionType.LIST]: true,
    [ActionType.SHOW]: true,
    [ActionType.CREATE]: true,
    [ActionType.EDIT]: true,
    [ActionType.DELETE]: true,
    [ActionType.ACCESS]: true,
    [ActionType.COMMAND]: true,
  },
};

export const createAccessProvider = <TPermissions = unknown>(
  config: AccessProviderConfig<TPermissions>,
): AccessControlProvider => {
  const { getPermissions, getUserRole } = config;
  const canDefault = true; // Least Permissions
  const defaultReason = 'No explicit permissions defined';

  return {
    can: async (operatorCanParams: OperatorCanParams) => {
      const { resource, action, params } = operatorCanParams;

      const canResponse: CanReturnType | ListCanReturnType = {
        can: canDefault,
        reason: defaultReason,
      };

      const permissions = await getPermissions();

      if (!permissions) {
        return canResponse;
      }

      const userRole = await getUserRole(permissions);

      if (!userRole) {
        return {
          can: false,
          reason: 'User has no valid role assigned',
        };
      }

      const rolePermissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];

      if (!rolePermissions) {
        return {
          can: false,
          reason: `Unknown role '${userRole}'`,
        };
      }

      // Check basic action permissions
      const hasPermission = rolePermissions[action as ActionType];

      if (hasPermission === false) {
        return {
          can: false,
          reason: `Role '${userRole}' does not have permission for action '${action}'`,
        };
      }

      return {
        can: hasPermission,
        reason: hasPermission
          ? undefined
          : `Role '${userRole}' does not have permission for action '${action}'`,
      };
    },
  };
};
