// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useQuery } from '@tanstack/react-query';
import {
  PERMISSIONS_CACHE_MS,
  PERMISSIONS_QUERY_KEY,
  fetchUserPermissions,
  type UserPermissions,
} from '@lib/utils/permissions-client';

export interface AccessPermissionsState {
  permissions?: UserPermissions;
  isResolved: boolean;
}

export function useAccessPermissions(): AccessPermissionsState {
  const { data } = useQuery({
    queryKey: PERMISSIONS_QUERY_KEY,
    queryFn: fetchUserPermissions,
    staleTime: PERMISSIONS_CACHE_MS,
  });

  return { permissions: data, isResolved: data !== undefined };
}
