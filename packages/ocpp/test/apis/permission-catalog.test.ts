// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { commandPermissionName, messagePermissionName } from '@citrineos/base';
import { buildPermissionCatalog, COMMAND_SURFACES, MESSAGE_ENDPOINTS } from '@/apis/register.js';
import { configSchema } from '@citrineos/types';

const commandPermissions = COMMAND_SURFACES.flatMap(([prefix, endpoints]) =>
  endpoints.map((endpointClass) => commandPermissionName(prefix, endpointClass.route)),
);

const catalog = buildPermissionCatalog();

const repoFile = (relative: string) =>
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../', relative);

interface RoleDefinition {
  resources: Record<string, string[]>;
  permissions: string[];
}

const seed: Record<string, RoleDefinition> = JSON.parse(
  fs.readFileSync(repoFile('apps/ocpp-server/src/assets/roles.seed.json'), 'utf8'),
);

describe('permission catalog', () => {
  it('resolves a permission name for every registered command endpoint', () => {
    expect(commandPermissions.filter((name) => name === '')).toEqual([]);
  });

  it('resolves a permission name for every registered message endpoint', () => {
    for (const endpointClass of MESSAGE_ENDPOINTS) {
      expect(messagePermissionName(endpointClass.route)).not.toBe('');
    }
  });

  it('gives each command route a distinct permission, so one grant cannot cover another', () => {
    expect(new Set(commandPermissions).size).toBe(commandPermissions.length);
  });

  it('shares one permission across protocol versions of the same action, and only then', () => {
    const actionsByName = new Map<string, Set<string>>();
    for (const endpointClass of MESSAGE_ENDPOINTS) {
      const name = messagePermissionName(endpointClass.route);
      const action = `${endpointClass.route.eventGroup}/${String(endpointClass.route.action)}`;
      actionsByName.set(name, (actionsByName.get(name) ?? new Set()).add(action));
    }

    const collisions = [...actionsByName.entries()].filter(([, actions]) => actions.size > 1);
    expect(collisions).toEqual([]);
  });

  it('names message permissions without the protocol version, so a grant spans versions', () => {
    for (const endpointClass of MESSAGE_ENDPOINTS) {
      expect(messagePermissionName(endpointClass.route)).not.toMatch(/\b\d+\.\d+/);
    }
  });
});

describe('operator UI permission constants', () => {
  const declared = [
    ...fs
      .readFileSync(repoFile('apps/operator-ui/src/lib/utils/permissions.ts'), 'utf8')
      .matchAll(/=\s*'([^']+)'/g),
  ].map((match) => match[1]);

  it('reads some constants, so a moved file fails rather than passing vacuously', () => {
    expect(declared.length).toBeGreaterThan(20);
  });

  it('names only permissions this build exposes', () => {
    expect(declared.filter((name) => !catalog.has(name))).toEqual([]);
  });
});

describe('permission catalog export', () => {
  it('covers every registered command and message permission', () => {
    const expected = [
      ...commandPermissions,
      ...MESSAGE_ENDPOINTS.map((endpointClass) => messagePermissionName(endpointClass.route)),
    ];

    expect(expected.filter((name) => !catalog.has(name))).toEqual([]);
    expect(catalog.size).toBe(new Set(expected).size);
  });
});

describe('role seed', () => {
  it('grants only permissions this build exposes', () => {
    const unknown = Object.entries(seed).flatMap(([role, definition]) =>
      definition.permissions.filter((name) => !catalog.has(name)).map((name) => `${role}: ${name}`),
    );

    expect(unknown).toEqual([]);
  });

  it('ships a common baseline this build exposes', () => {
    const common = configSchema.shape.roles.parse(undefined).common;

    expect(common).not.toEqual([]);
    expect(common.filter((name: string) => !catalog.has(name))).toEqual([]);
  });

  it('leaves the common baseline out of individual roles', () => {
    const duplicated = Object.entries(seed)
      .filter(([, definition]) => definition.permissions.includes('permissions.user.get'))
      .map(([role]) => role);

    expect(duplicated).toEqual([]);
  });
});

describe('role seed resource grants', () => {
  const accessTypes = fs.readFileSync(
    repoFile('apps/operator-ui/src/lib/utils/access-types.ts'),
    'utf8',
  );

  const accessValues = (enumName: string) => {
    const body = new RegExp(`export enum ${enumName} {([^}]*)}`).exec(accessTypes)?.[1] ?? '';
    return [...body.matchAll(/=\s*'([^']+)'/g)].map((match) => match[1]);
  };

  const subViews: Record<string, string[]> = {
    ChargingStations: accessValues('ChargingStationAccessType'),
    Transactions: accessValues('TransactionAccessType'),
  };

  it('reads the access types, so a moved file fails rather than passing vacuously', () => {
    for (const [resource, values] of Object.entries(subViews)) {
      expect(values, resource).not.toEqual([]);
    }
  });

  it('grants every sub-view to any role that can open the resource', () => {
    const missing: string[] = [];
    for (const [resource, values] of Object.entries(subViews)) {
      for (const [role, definition] of Object.entries(seed)) {
        const actions = definition.resources[resource];
        if (!actions?.includes('show')) {
          continue;
        }
        missing.push(
          ...values
            .filter((value) => !actions.includes(`access:${value}`))
            .map((value) => `${role}: ${resource} access:${value}`),
        );
      }
    }

    expect(missing).toEqual([]);
  });
});
