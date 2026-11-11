// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { FastifyInstance } from 'fastify';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildServer } from '../src/server.js';
import { InvalidWebhookError } from '../src/stripe/payment-provider.js';
import { CheckoutStatus } from '../src/types/index.js';
import { ACCOUNT, aTariff, aTransaction, anEvse, OTHER_TENANT, TENANT } from './support/fakes.js';
import { aWorld } from './support/world.js';

type World = Awaited<ReturnType<typeof aWorld>>;

describe('buildServer', () => {
  let world: World;
  let server: FastifyInstance;
  let webhookBodies: Buffer[];

  beforeEach(async () => {
    world = await aWorld();
    world.coreData.addEvse(anEvse());
    webhookBodies = [];
    world.payments.parseWebhook = (body, signature) => {
      webhookBodies.push(body);
      if (signature !== 'good') {
        throw new InvalidWebhookError('bad signature');
      }
      return world.payments.webhookEvent;
    };
    server = buildServer({
      checkoutService: world.checkoutService,
      startService: world.startService,
      scanAndChargeService: world.scanAndChargeService,
      payments: world.payments,
    });
  });

  afterEach(async () => {
    await server.close();
  });

  const post = (url: string, payload: object, headers: Record<string, string> = {}) =>
    server.inject({ method: 'POST', url, payload, headers });

  it('reports healthy on GET /health', async () => {
    const response = await server.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'healthy' });
  });

  it('shows an EVSE', async () => {
    const response = await server.inject({ method: 'GET', url: '/api/evses/7' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: 7, connectors: [{ id: 70 }] });
  });

  it.each([
    ['US*CIT*E7', 200],
    ['7', 200],
    ['US*CIT*E99', 404],
    ['', 400],
  ])('looks an EVSE up by what a driver types: %s', async (q, status) => {
    const response = await server.inject({
      method: 'GET',
      url: `/api/evses/lookup?q=${encodeURIComponent(q)}`,
    });

    expect(response.statusCode).toBe(status);
    if (status === 200) {
      expect(response.json()).toEqual({ evseId: 7 });
    }
  });

  it('starts a checkout', async () => {
    const response = await post('/api/checkouts', { evseId: 7 });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      publicId: world.checkouts.only().publicId,
      url: `https://checkout.stripe.test/${world.checkouts.only().publicId}`,
    });
  });

  it.each([
    ['an unknown EVSE', { evseId: 99 }, 404],
    ['an EVSE id that is not a number', { evseId: 'seven' }, 400],
    ['a connector id of zero', { evseId: 7, connectorId: 0 }, 400],
    ['an EVSE of a tenant without an account', { evseId: 8 }, 422],
    ['a connector out of service', { evseId: 9 }, 409],
  ])('refuses a checkout for %s', async (_name, payload, status) => {
    world.coreData.addEvse(anEvse({ id: 8, tenantId: OTHER_TENANT }));
    const outOfService = anEvse({ id: 9 });
    outOfService.connectors[0].status = 'Faulted';
    world.coreData.addEvse(outOfService, aTariff());

    expect((await post('/api/checkouts', payload)).statusCode).toBe(status);
  });

  it('shows a checkout by its public id only', async () => {
    const { publicId } = await world.checkoutService.createCheckout(7);

    expect(
      (await server.inject({ method: 'GET', url: `/api/checkouts/${publicId}` })).json(),
    ).toMatchObject({
      publicId,
      status: CheckoutStatus.Created,
    });
    expect((await server.inject({ method: 'GET', url: '/api/checkouts/1' })).statusCode).toBe(400);
  });

  describe('Stripe webhook', () => {
    it('hands the exact bytes Stripe sent to signature verification', async () => {
      const raw = '{"id":"evt_1",  "type":"ping"}';

      const response = await server.inject({
        method: 'POST',
        url: '/api/webhooks/stripe',
        payload: raw,
        headers: { 'content-type': 'application/json', 'stripe-signature': 'good' },
      });

      expect(response.statusCode).toBe(200);
      expect(webhookBodies[0].toString()).toBe(raw);
    });

    it('acts on a verified payment', async () => {
      const { publicId } = await world.checkoutService.createCheckout(7);
      world.payments.webhookEvent = {
        type: 'checkout.completed',
        stripeAccountId: ACCOUNT,
        checkoutPublicId: publicId,
        paymentIntentId: 'pi_1',
        amountAuthorized: 5000,
      };

      await post('/api/webhooks/stripe', {}, { 'stripe-signature': 'good' });

      expect(world.checkouts.only().status).toBe(CheckoutStatus.StartRequested);
    });

    it.each([
      ['a bad signature', { 'stripe-signature': 'bad' }],
      ['no signature', {}],
    ])('refuses %s', async (_name, headers) => {
      expect((await post('/api/webhooks/stripe', {}, headers)).statusCode).toBe(400);
    });
  });

  describe('scan and charge', () => {
    let publicId: string;

    beforeEach(async () => {
      world.accounts.accounts[0].scanAndChargeEnabled = true;
      world.coreData.transactions.push({
        ...aTransaction(),
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
      });
      await world.scanAndChargeService.onTransactionPluggedIn({
        tenantId: TENANT,
        ocppConnectionName: 'CS-1',
        transactionId: 'tx-1',
      });
      publicId = world.checkouts.only().publicId;
    });

    it('serves the QR code the station shows', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/checkouts/${publicId}/qr.png`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe('image/png');
      expect(response.rawPayload.subarray(1, 4).toString()).toBe('PNG');
    });

    it('sends the driver who scans it on to Stripe', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `/api/checkouts/${publicId}/pay`,
      });

      expect(response.statusCode).toBe(303);
      expect(response.headers.location).toBe(`https://checkout.stripe.test/${publicId}`);
      expect(response.headers['cache-control']).toBe('no-store');
    });

    it('has no QR code for a web-portal checkout', async () => {
      const webPortal = await world.checkoutService.createCheckout(7);

      for (const route of ['qr.png', 'pay']) {
        const response = await server.inject({
          method: 'GET',
          url: `/api/checkouts/${webPortal.publicId}/${route}`,
        });
        expect(response.statusCode).toBe(404);
      }
    });
  });

  describe('remote-start callback', () => {
    it('takes an answer Core signed', async () => {
      const { publicId } = await world.checkoutService.createCheckout(7);
      const signature = world.signer.sign(publicId);

      const response = await post(
        `/api/callbacks/remote-start/${publicId}?signature=${encodeURIComponent(signature)}`,
        { status: 'Accepted' },
      );

      expect(response.statusCode).toBe(204);
    });

    it('refuses an answer Core did not sign', async () => {
      const { publicId } = await world.checkoutService.createCheckout(7);

      const response = await post(`/api/callbacks/remote-start/${publicId}?signature=forged`, {
        status: 'Rejected',
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('driver frontend', () => {
    function aFrontend(): string {
      const dir = mkdtempSync(join(tmpdir(), 'payment-frontend-'));
      writeFileSync(join(dir, 'index.html'), '<!doctype html><div id="root"></div>');
      mkdirSync(join(dir, 'assets'));
      writeFileSync(join(dir, 'assets', 'index-abc123.js'), 'console.log(1);');
      return dir;
    }

    async function serving(frontendDir: string) {
      await server.close();
      server = buildServer({
        checkoutService: world.checkoutService,
        startService: world.startService,
        scanAndChargeService: world.scanAndChargeService,
        payments: world.payments,
        frontendDir,
      });
      return server;
    }

    it.each(['/', '/checkout/7', '/charging/c0ffee00-0000-4000-8000-000000000000', '/receipt/x'])(
      'serves the app for %s',
      async (url) => {
        const response = await (await serving(aFrontend())).inject({ method: 'GET', url });

        expect(response.statusCode).toBe(200);
        expect(response.headers['content-type']).toContain('text/html');
        expect(response.headers['cache-control']).toBe('no-cache');
        expect(response.body).toContain('id="root"');
      },
    );

    it('serves its assets for as long as browsers keep them', async () => {
      const response = await (
        await serving(aFrontend())
      ).inject({ method: 'GET', url: '/assets/index-abc123.js' });

      expect(response.statusCode).toBe(200);
      expect(response.headers['cache-control']).toContain('immutable');
    });

    it('keeps the API as it was', async () => {
      const app = await serving(aFrontend());

      expect((await app.inject({ method: 'GET', url: '/api/evses/7' })).statusCode).toBe(200);
      expect((await app.inject({ method: 'GET', url: '/api/nothing' })).statusCode).toBe(404);
    });

    it('serves only the API when the frontend was not built', async () => {
      const app = await serving(mkdtempSync(join(tmpdir(), 'payment-frontend-')));

      expect((await app.inject({ method: 'GET', url: '/' })).statusCode).toBe(404);
      expect((await app.inject({ method: 'GET', url: '/health' })).statusCode).toBe(200);
    });
  });
});
