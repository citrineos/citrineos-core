// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IRoleProvider, UserInfo } from '@citrineos/base';
import { describe, expect, it } from 'vitest';
import { type ILogObj, Logger } from 'tslog';
import { PolicyStore } from '@/apis/authorization/policy/policy-store.js';
import { GetUserPermissionsEndpoint } from '@/apis/permissions/get-user-permissions-endpoint.js';
import { aSystemConfig } from '@test/providers/system-config.js';
import { mountEndpoint } from '@test/providers/endpoint-harness.js';

const logger = new Logger<ILogObj>({ type: 'hidden' });

const roleProvider: IRoleProvider = {
  listRoles: async () => ({
    operator: {
      resources: { Transactions: ['list', 'show'] },
      permissions: ['payment.checkouts.get'],
    },
  }),
};

const user: UserInfo = {
  id: 'u1',
  name: 'Operator',
  email: 'operator@example.com',
  roles: ['operator'],
  tenantId: '3',
};

async function aMountedEndpoint() {
  const config = aSystemConfig();
  const policyStore = new PolicyStore({
    config,
    roleProvider,
    permissionCatalog: new Set(['payment.checkouts.get', 'permissions.user.get']),
    logger,
  });
  await policyStore.refresh();
  const endpoint = new GetUserPermissionsEndpoint({ logger, config, policyStore });
  return mountEndpoint(endpoint, GetUserPermissionsEndpoint.route, '/permissions', (server) => {
    // Stands in for the auth plugin, which sets the caller it authenticated.
    server.addHook('onRequest', async (request) => {
      request.user = user;
    });
  });
}

describe('GetUserPermissionsEndpoint', () => {
  it('names the caller’s tenant with its roles and permissions, for other services to scope by', async () => {
    const { server } = await aMountedEndpoint();

    const response = await server.inject({ method: 'GET', url: '/permissions/user' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      tenantId: '3',
      roles: ['operator'],
      resources: { Transactions: ['list', 'show'] },
      permissions: expect.arrayContaining(['payment.checkouts.get', 'permissions.user.get']),
    });
  });
});
