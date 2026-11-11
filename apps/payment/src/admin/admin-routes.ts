// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { CheckoutStatus } from '../types/index.js';
import { CheckoutStatus as Status } from '../types/index.js';
import type { AdminPrincipal, IAdminAuthenticator } from './admin-auth.js';
import type { AdminService, PaymentAccountInput } from './admin-service.js';

const id = { type: 'integer', minimum: 1 } as const;
const uuid = { type: 'string', format: 'uuid' } as const;
const tenantParams = {
  type: 'object',
  properties: { tenantId: id },
  required: ['tenantId'],
} as const;
const checkoutParams = {
  type: 'object',
  properties: { publicId: uuid },
  required: ['publicId'],
} as const;

const STATUSES: readonly string[] = Object.values(Status);

function isStatus(value: string): value is CheckoutStatus {
  return STATUSES.includes(value);
}

/** /api/admin: every route needs the platform's API key or a tenant admin's token. */
export function registerAdminRoutes(
  app: FastifyInstance,
  authenticator: IAdminAuthenticator,
  service: AdminService,
): void {
  app.register(async (admin) => {
    const principals = new WeakMap<FastifyRequest, AdminPrincipal>();
    admin.addHook('onRequest', async (request) => {
      principals.set(request, await authenticator.authenticate(request.headers.authorization));
    });
    const principalOf = (request: FastifyRequest): AdminPrincipal => {
      const principal = principals.get(request);
      if (!principal) {
        throw new Error('Admin request without a principal');
      }
      return principal;
    };

    admin.get('/api/admin/payment-accounts', async (request) => ({
      accounts: await service.listAccounts(principalOf(request)),
    }));

    admin.get<{ Params: { tenantId: number } }>(
      '/api/admin/tenants/:tenantId/payment-account',
      { schema: { params: tenantParams } },
      async (request) => service.getAccount(principalOf(request), request.params.tenantId),
    );

    admin.put<{ Params: { tenantId: number }; Body: PaymentAccountInput }>(
      '/api/admin/tenants/:tenantId/payment-account',
      {
        schema: {
          params: tenantParams,
          body: {
            type: 'object',
            properties: {
              stripeAccountId: { type: 'string', pattern: '^acct_[A-Za-z0-9]+$', maxLength: 255 },
              scanAndChargeEnabled: { type: 'boolean' },
              termsUrl: { type: ['string', 'null'], maxLength: 2048 },
            },
            required: ['stripeAccountId'],
            additionalProperties: false,
          },
        },
      },
      async (request, reply) => {
        const { account, created } = await service.putAccount(
          principalOf(request),
          request.params.tenantId,
          request.body,
        );
        return reply.code(created ? 201 : 200).send(account);
      },
    );

    admin.delete<{ Params: { tenantId: number } }>(
      '/api/admin/tenants/:tenantId/payment-account',
      { schema: { params: tenantParams } },
      async (request, reply) => {
        await service.deleteAccount(principalOf(request), request.params.tenantId);
        return reply.code(204).send();
      },
    );

    admin.get<{
      Querystring: { tenantId?: number; status?: string; beforeId?: number; limit?: number };
    }>(
      '/api/admin/checkouts',
      {
        schema: {
          querystring: {
            type: 'object',
            properties: {
              tenantId: id,
              status: { type: 'string', maxLength: 200 },
              beforeId: id,
              limit: { type: 'integer', minimum: 1, maximum: 200 },
            },
            additionalProperties: false,
          },
        },
      },
      async (request, reply) => {
        const { status, ...query } = request.query;
        const statuses = status?.split(',').map((value) => value.trim());
        const unknown = statuses?.filter((value) => !isStatus(value));
        if (unknown?.length) {
          return reply
            .code(400)
            .send({ error: `Unknown status ${unknown.join(', ')}; one of ${STATUSES.join(', ')}` });
        }
        return service.listCheckouts(principalOf(request), {
          ...query,
          status: statuses?.filter(isStatus),
        });
      },
    );

    admin.get<{ Params: { publicId: string } }>(
      '/api/admin/checkouts/:publicId',
      { schema: { params: checkoutParams } },
      async (request) => service.getCheckout(principalOf(request), request.params.publicId),
    );

    admin.post<{ Params: { publicId: string } }>(
      '/api/admin/checkouts/:publicId/settle',
      { schema: { params: checkoutParams } },
      async (request) => service.settle(principalOf(request), request.params.publicId),
    );

    admin.post<{ Params: { publicId: string } }>(
      '/api/admin/checkouts/:publicId/cancel',
      { schema: { params: checkoutParams } },
      async (request) => service.cancel(principalOf(request), request.params.publicId),
    );
  });
}
