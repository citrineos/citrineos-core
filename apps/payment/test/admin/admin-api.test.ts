// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AdminAuthenticator, PaymentPermission } from '../../src/admin/admin-auth.js';
import type { CallerPermissions, ICorePermissions } from '../../src/admin/core-permissions.js';
import { buildServer } from '../../src/server.js';
import { CheckoutStatus } from '../../src/types/index.js';
import { ACCOUNT, anEvse, OTHER_TENANT, TENANT } from '../support/fakes.js';
import { aWorld } from '../support/world.js';
import { ReconcileOutcome } from '../../src/services/reconciliation-service.js';
import { PaymentEventType } from '../../src/stripe/payment-provider.js';

type World = Awaited<ReturnType<typeof aWorld>>;

const API_KEY = 'an-admin-api-key-that-is-long-enough';
const ALL_PERMISSIONS: string[] = Object.values(PaymentPermission);

/** Core: `Bearer tenant-<id>` is that tenant's admin; `Bearer viewer-<id>` may only look. */
const core: ICorePermissions = {
  async forCaller(authorization): Promise<CallerPermissions | undefined> {
    const match = /^Bearer (tenant|viewer)-(\d+)$/.exec(authorization ?? '');
    if (!match) {
      return undefined;
    }
    return {
      tenantId: Number(match[2]),
      permissions: match[1] === 'tenant' ? ALL_PERMISSIONS : [PaymentPermission.CheckoutsGet],
      enforcing: true,
    };
  },
};

const PLATFORM = { authorization: `Bearer ${API_KEY}` };
const asTenant = (tenantId: number) => ({ authorization: `Bearer tenant-${tenantId}` });
const asViewer = (tenantId: number) => ({ authorization: `Bearer viewer-${tenantId}` });

describe('admin API', () => {
  let world: World;
  let server: FastifyInstance;

  beforeEach(async () => {
    world = await aWorld();
    world.coreData.addEvse(anEvse());
    server = buildServer({
      checkoutService: world.checkoutService,
      startService: world.startService,
      scanAndChargeService: world.scanAndChargeService,
      payments: world.payments,
      admin: {
        authenticator: new AdminAuthenticator({ apiKey: API_KEY }, core),
        service: world.adminService,
      },
    });
  });

  afterEach(async () => {
    await server.close();
  });

  const call = (
    method: 'GET' | 'PUT' | 'POST' | 'DELETE',
    url: string,
    headers: Record<string, string> = PLATFORM,
    payload?: object,
  ) => server.inject({ method, url, headers, ...(payload && { payload }) });

  async function aPaidCheckout(): Promise<string> {
    const { publicId } = await world.checkoutService.createCheckout(7);
    await world.startService.handlePaymentEvent({
      type: PaymentEventType.CheckoutCompleted,
      stripeAccountId: ACCOUNT,
      checkoutPublicId: publicId,
      paymentIntentId: 'pi_1',
      amountAuthorized: 5000,
    });
    return publicId;
  }

  describe('authentication', () => {
    it.each([
      ['no credentials', {}, 401],
      ['a wrong key', { authorization: 'Bearer not-the-key' }, 403],
    ])('refuses %s', async (_name, headers, status) => {
      expect((await call('GET', '/api/admin/payment-accounts', headers)).statusCode).toBe(status);
    });

    it('limits a tenant admin to their own tenant', async () => {
      await world.accounts.create(OTHER_TENANT, { stripeAccountId: 'acct_other' });

      const own = await call('GET', '/api/admin/payment-accounts', asTenant(TENANT));
      expect(own.json().accounts.map((a: { tenantId: number }) => a.tenantId)).toEqual([TENANT]);
      expect(
        (await call('GET', `/api/admin/tenants/${OTHER_TENANT}/payment-account`, asTenant(TENANT)))
          .statusCode,
      ).toBe(403);
      expect(
        (
          await call(
            'PUT',
            `/api/admin/tenants/${OTHER_TENANT}/payment-account`,
            asTenant(TENANT),
            { stripeAccountId: 'acct_mine' },
          )
        ).statusCode,
      ).toBe(403);
    });

    it('lets each route through only with the permission Core grants for it', async () => {
      const publicId = await aPaidCheckout();

      expect((await call('GET', '/api/admin/checkouts', asViewer(TENANT))).statusCode).toBe(200);
      expect(
        (await call('GET', `/api/admin/checkouts/${publicId}`, asViewer(TENANT))).statusCode,
      ).toBe(200);
      for (const [method, url] of [
        ['GET', '/api/admin/payment-accounts'],
        ['GET', `/api/admin/tenants/${TENANT}/payment-account`],
        ['DELETE', `/api/admin/tenants/${TENANT}/payment-account`],
        ['POST', `/api/admin/checkouts/${publicId}/settle`],
        ['POST', `/api/admin/checkouts/${publicId}/cancel`],
      ] as const) {
        expect((await call(method, url, asViewer(TENANT))).statusCode, `${method} ${url}`).toBe(
          403,
        );
      }
      expect(
        (
          await call('PUT', `/api/admin/tenants/${TENANT}/payment-account`, asViewer(TENANT), {
            stripeAccountId: ACCOUNT,
          })
        ).statusCode,
      ).toBe(403);
    });
  });

  describe('payment accounts', () => {
    it('creates a tenant’s account, then changes it', async () => {
      const created = await call(
        'PUT',
        `/api/admin/tenants/${OTHER_TENANT}/payment-account`,
        PLATFORM,
        {
          stripeAccountId: 'acct_other',
        },
      );
      expect(created.statusCode).toBe(201);
      expect(created.json()).toMatchObject({
        tenantId: OTHER_TENANT,
        stripeAccountId: 'acct_other',
        scanAndChargeEnabled: false,
        termsUrl: null,
      });

      const changed = await call(
        'PUT',
        `/api/admin/tenants/${OTHER_TENANT}/payment-account`,
        asTenant(OTHER_TENANT),
        {
          stripeAccountId: 'acct_other',
          scanAndChargeEnabled: true,
          termsUrl: 'https://other.example.com/terms',
        },
      );
      expect(changed.statusCode).toBe(200);
      expect(changed.json()).toMatchObject({
        scanAndChargeEnabled: true,
        termsUrl: 'https://other.example.com/terms',
      });
      expect(
        (await call('GET', `/api/admin/tenants/${OTHER_TENANT}/payment-account`)).json(),
      ).toMatchObject({ scanAndChargeEnabled: true });
    });

    it.each([
      ['a Stripe account id that is not one', { stripeAccountId: 'cus_123' }],
      [
        'terms that are not a web page',
        { stripeAccountId: 'acct_1', termsUrl: 'javascript:alert(1)' },
      ],
    ])('refuses %s', async (_name, body) => {
      expect(
        (await call('PUT', `/api/admin/tenants/${TENANT}/payment-account`, PLATFORM, body))
          .statusCode,
      ).toBe(400);
    });

    it('says which tenant does not exist', async () => {
      world.accounts.create = async () => {
        throw Object.assign(new Error('fk'), { name: 'SequelizeForeignKeyConstraintError' });
      };

      expect(
        (
          await call('PUT', '/api/admin/tenants/99/payment-account', PLATFORM, {
            stripeAccountId: 'acct_x',
          })
        ).statusCode,
      ).toBe(404);
    });

    it('keeps the Stripe account while checkouts on it are open', async () => {
      const publicId = await aPaidCheckout();

      const moved = await call('PUT', `/api/admin/tenants/${TENANT}/payment-account`, PLATFORM, {
        stripeAccountId: 'acct_new',
      });
      expect(moved.statusCode).toBe(409);
      expect(moved.json().error).toContain('1 open checkout');
      expect(
        (await call('DELETE', `/api/admin/tenants/${TENANT}/payment-account`)).statusCode,
      ).toBe(409);

      await call('POST', `/api/admin/checkouts/${publicId}/cancel`);
      expect(
        (await call('DELETE', `/api/admin/tenants/${TENANT}/payment-account`)).statusCode,
      ).toBe(204);
      expect((await call('GET', `/api/admin/tenants/${TENANT}/payment-account`)).statusCode).toBe(
        404,
      );
    });
  });

  describe('checkouts', () => {
    it('lists them newest first, a page at a time, by status', async () => {
      for (let i = 0; i < 3; i++) {
        await world.checkoutService.createCheckout(7);
      }
      world.checkouts.checkouts[0].status = CheckoutStatus.Failed;

      const first = (await call('GET', '/api/admin/checkouts?limit=2')).json();
      expect(first.checkouts.map((c: { id: number }) => c.id)).toEqual([3, 2]);
      expect(first.nextBeforeId).toBe(2);
      const rest = (await call('GET', '/api/admin/checkouts?limit=2&beforeId=2')).json();
      expect(rest.checkouts.map((c: { id: number }) => c.id)).toEqual([1]);
      expect(rest.nextBeforeId).toBeNull();

      const failed = (await call('GET', '/api/admin/checkouts?status=Failed,Cancelled')).json();
      expect(failed.checkouts.map((c: { id: number }) => c.id)).toEqual([1]);
      expect((await call('GET', '/api/admin/checkouts?status=Lost')).statusCode).toBe(400);
    });

    it('finds the checkout that paid for a Core transaction', async () => {
      await world.checkoutService.createCheckout(7);
      await world.checkoutService.createCheckout(7);
      world.checkouts.checkouts[0].transactionDatabaseId = 500;

      const found = (
        await call('GET', `/api/admin/checkouts?tenantId=${TENANT}&transactionDatabaseId=500`)
      ).json();
      expect(found.checkouts.map((c: { id: number }) => c.id)).toEqual([1]);
      expect(
        (
          await call(
            'GET',
            '/api/admin/checkouts?transactionDatabaseId=500',
            asTenant(OTHER_TENANT),
          )
        ).json().checkouts,
      ).toEqual([]);
    });

    it('shows a tenant admin only their own', async () => {
      const publicId = await aPaidCheckout();

      expect(
        (await call('GET', '/api/admin/checkouts', asTenant(OTHER_TENANT))).json().checkouts,
      ).toEqual([]);
      expect(
        (await call('GET', `/api/admin/checkouts/${publicId}`, asTenant(OTHER_TENANT))).statusCode,
      ).toBe(404);
      expect(
        (await call('GET', `/api/admin/checkouts/${publicId}`, asTenant(TENANT))).json(),
      ).toMatchObject({
        publicId,
        status: CheckoutStatus.StartRequested,
        paymentIntentId: 'pi_1',
      });
    });

    it('settles a checkout on request', async () => {
      const publicId = await aPaidCheckout();

      const settled = await call('POST', `/api/admin/checkouts/${publicId}/settle`);

      expect(settled.json()).toMatchObject({
        outcome: ReconcileOutcome.Cancelled,
        checkout: { status: CheckoutStatus.Cancelled },
      });
    });

    it('releases a hold that has not started charging, but not one that has', async () => {
      const publicId = await aPaidCheckout();

      const cancelled = await call('POST', `/api/admin/checkouts/${publicId}/cancel`);
      expect(cancelled.json().status).toBe(CheckoutStatus.Cancelled);
      expect(world.payments.cancels).toEqual([
        expect.objectContaining({ paymentIntentId: 'pi_1' }),
      ]);

      world.checkouts.only().status = CheckoutStatus.Charging;
      expect((await call('POST', `/api/admin/checkouts/${publicId}/cancel`)).statusCode).toBe(409);
    });
  });
});

describe('rate limit', () => {
  it('limits how often one client may open checkouts, and nothing else', async () => {
    const world = await aWorld();
    world.coreData.addEvse(anEvse());
    const server = buildServer({
      checkoutService: world.checkoutService,
      startService: world.startService,
      scanAndChargeService: world.scanAndChargeService,
      payments: world.payments,
      rateLimitPerMinute: 2,
    });
    const open = () =>
      server.inject({ method: 'POST', url: '/api/checkouts', payload: { evseId: 7 } });

    expect((await open()).statusCode).toBe(201);
    expect((await open()).statusCode).toBe(201);
    const limited = await open();
    expect(limited.statusCode).toBe(429);
    expect(limited.headers['retry-after']).toBeDefined();
    expect((await server.inject({ method: 'GET', url: '/api/evses/7' })).statusCode).toBe(200);
    expect(world.payments.sessions).toHaveLength(2);
    await server.close();
  });
});
