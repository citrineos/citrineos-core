// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ActionType, type OperatorCanParams } from '@lib/utils/access-types';
import {
  PERMISSIONS_CACHE_MS,
  PERMISSIONS_QUERY_KEY,
  fetchUserPermissions,
  type UserPermissions,
} from '@lib/utils/permissions-client';
import type { AccessControlProvider, CanReturnType } from '@refinedev/core';
import type { QueryClient } from '@tanstack/react-query';

export const createAccessProvider = (queryClient: QueryClient): AccessControlProvider => ({
  can: async ({ resource, action, params }: OperatorCanParams): Promise<CanReturnType> => {
    let permissions: UserPermissions;
    try {
      permissions = await queryClient.fetchQuery({
        queryKey: PERMISSIONS_QUERY_KEY,
        queryFn: fetchUserPermissions,
        staleTime: PERMISSIONS_CACHE_MS,
      });
    } catch (error) {
      return {
        can: false,
        reason: `Could not read permissions: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    if (!permissions.enforcing) {
      return { can: true };
    }

    if (!resource) {
      return { can: false, reason: 'No resource given' };
    }

    const granted = permissions.resources[resource] ?? [];

    if (action === ActionType.COMMAND) {
      if (!params?.permission) {
        return { can: false, reason: 'No permission given for this command' };
      }
      const required = Array.isArray(params.permission) ? params.permission : [params.permission];
      return required.some((name) => permissions.permissions.includes(name))
        ? { can: true }
        : { can: false, reason: `Missing ${required.join(' or ')}` };
    }

    if (action === ActionType.ACCESS && params?.accessType) {
      return granted.includes(`${ActionType.ACCESS}:${params.accessType}`)
        ? { can: true }
        : { can: false, reason: `Not permitted to open ${params.accessType} on ${resource}` };
    }

    return granted.includes(action)
      ? { can: true }
      : { can: false, reason: `Not permitted to ${action} ${resource}` };
  },

  options: {
    buttons: { enableAccessControl: true, hideIfUnauthorized: false },
    queryOptions: { staleTime: 0 },
  },
});
