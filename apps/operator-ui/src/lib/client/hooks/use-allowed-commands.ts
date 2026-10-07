// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { useAccessPermissions } from './use-access-permissions';

interface CommandLike {
  permission: string;
}

export interface AllowedCommands<T> {
  commands: Array<[string, T]>;
  isResolved: boolean;
}

export function useAllowedCommands<T extends CommandLike>(
  registry: Record<string, T>,
): AllowedCommands<T> {
  const { permissions, isResolved } = useAccessPermissions();
  const entries = Object.entries(registry);

  if (!permissions) {
    return { commands: [], isResolved };
  }

  if (!permissions.enforcing) {
    return { commands: entries, isResolved };
  }

  return {
    commands: entries.filter(([, command]) => permissions.permissions.includes(command.permission)),
    isResolved,
  };
}
