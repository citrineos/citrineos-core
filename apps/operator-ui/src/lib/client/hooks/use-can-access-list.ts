// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ActionType, ResourceType } from '@lib/utils/access-types';
import { useAccessPermissions } from './use-access-permissions';

export interface CanAccessList<T> {
  items: T[];
  isResolved: boolean;
}

interface HasResource {
  resource?: ResourceType;
}

/**
 * Keeps the entries whose resource the signed-in user may take `action` on. Entries without a
 * resource always pass.
 */
export function useCanAccessList<T extends HasResource>(
  items: T[],
  action: ActionType,
): CanAccessList<T> {
  const { permissions, isResolved } = useAccessPermissions();

  if (!permissions) {
    return { items: [], isResolved };
  }

  if (!permissions.enforcing) {
    return { items, isResolved };
  }

  return {
    items: items.filter(
      (item) => !item.resource || permissions.resources[item.resource]?.includes(action),
    ),
    isResolved,
  };
}
