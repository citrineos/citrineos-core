// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FastifyInstance, FastifyReply } from 'fastify';
import type { ILogObj, Logger } from 'tslog';
import type { IAdminAuthenticator } from './admin/admin-auth.js';
import { registerAdminRoutes } from './admin/admin-routes.js';
import type { AdminService } from './admin/admin-service.js';
import type { CheckoutService } from './services/checkout-service.js';
import { PaymentError } from './services/errors.js';
import type { PaymentErrorCode } from './services/errors.js';
import type { ScanAndChargeService } from './services/scan-and-charge-service.js';
import type { StartService } from './services/start-service.js';
import type { IPaymentProvider } from './stripe/payment-provider.js';
import { InvalidWebhookError } from './stripe/payment-provider.js';

export interface ServerDependencies {
  checkoutService: CheckoutService;
  startService: StartService;
  scanAndChargeService: ScanAndChargeService;
  payments: IPaymentProvider;
  /** The built driver frontend; without one, only the API is served. */
  frontendDir?: string;
  /** Per client address, on the routes that open Stripe sessions; none or 0 is no limit. */
  rateLimitPerMinute?: number;
  /** Take the client's address from X-Forwarded-For. */
  trustProxy?: boolean;
  admin?: { authenticator: IAdminAuthenticator; service: AdminService };
  logger?: Logger<ILogObj>;
}

/** The driver frontend's pages; each loads the same single-page app. */
const FRONTEND_PAGES = ['/', '/checkout/:evseId', '/charging/:publicId', '/receipt/:publicId'];

const STATUS_BY_CODE: Record<PaymentErrorCode, number> = {
  not_found: 404,
  invalid: 400,
  unavailable: 409,
  not_payable: 422,
  forbidden: 403,
  unauthorized: 401,
  conflict: 409,
};

const id = { type: 'integer', minimum: 1 } as const;
const uuid = { type: 'string', format: 'uuid' } as const;

export function buildServer(dependencies: ServerDependencies): FastifyInstance {
  const { checkoutService, startService, scanAndChargeService, payments, logger } = dependencies;
  const app = Fastify({ logger: false, trustProxy: dependencies.trustProxy ?? false });

  app.get('/health', async () => ({ status: 'healthy' }));

  app.setErrorHandler((error, _request, reply: FastifyReply) => {
    if (error instanceof PaymentError) {
      return reply.code(STATUS_BY_CODE[error.code]).send({ error: error.message });
    }
    if (error instanceof Error && 'validation' in error) {
      return reply.code(400).send({ error: error.message });
    }
    // Fastify's and its plugins' own client errors, e.g. 429 from the rate limit.
    if (
      error instanceof Error &&
      'statusCode' in error &&
      typeof error.statusCode === 'number' &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      return reply.code(error.statusCode).send({ error: error.message });
    }
    logger?.error('Request failed', error);
    return reply.code(500).send({ error: 'Internal error' });
  });

  // Each of these can open a Stripe session or probes for chargers: one client may only ask so often.
  const perMinute = dependencies.rateLimitPerMinute ?? 0;
  const limit = perMinute > 0 ? { rateLimit: { max: perMinute, timeWindow: 60_000 } } : {};
  if (perMinute > 0) {
    app.register(rateLimit, { global: false });
  }
  app.register(async (limited) => {
    limited.get<{ Querystring: { q: string } }>(
      '/api/evses/lookup',
      {
        config: limit,
        schema: {
          querystring: {
            type: 'object',
            properties: { q: { type: 'string', minLength: 1, maxLength: 64 } },
            required: ['q'],
          },
        },
      },
      async (request) => checkoutService.findEvse(request.query.q),
    );

    limited.post<{ Body: { evseId: number; connectorId?: number } }>(
      '/api/checkouts',
      {
        config: limit,
        schema: {
          body: {
            type: 'object',
            properties: { evseId: id, connectorId: id },
            required: ['evseId'],
            additionalProperties: false,
          },
        },
      },
      async (request, reply) => {
        const started = await checkoutService.createCheckout(
          request.body.evseId,
          request.body.connectorId,
        );
        return reply.code(201).send(started);
      },
    );

    limited.get<{ Params: { publicId: string } }>(
      '/api/checkouts/:publicId/pay',
      {
        config: limit,
        schema: {
          params: { type: 'object', properties: { publicId: uuid }, required: ['publicId'] },
        },
      },
      async (request, reply) => {
        const url = await scanAndChargeService.paymentUrl(request.params.publicId);
        return reply.header('Cache-Control', 'no-store').redirect(url, 303);
      },
    );
  });

  app.get<{ Params: { evseId: number } }>(
    '/api/evses/:evseId',
    { schema: { params: { type: 'object', properties: { evseId: id }, required: ['evseId'] } } },
    async (request) => checkoutService.describeEvse(request.params.evseId),
  );

  app.get<{ Params: { publicId: string } }>(
    '/api/checkouts/:publicId',
    {
      schema: {
        params: { type: 'object', properties: { publicId: uuid }, required: ['publicId'] },
      },
    },
    async (request) => checkoutService.getState(request.params.publicId),
  );

  // Scan and charge: the station shows this image, and the QR code in it opens the route below.
  app.get<{ Params: { publicId: string } }>(
    '/api/checkouts/:publicId/qr.png',
    {
      schema: {
        params: { type: 'object', properties: { publicId: uuid }, required: ['publicId'] },
      },
    },
    async (request, reply) => {
      const png = await scanAndChargeService.qrCode(request.params.publicId);
      return reply.type('image/png').header('Cache-Control', 'public, max-age=86400').send(png);
    },
  );

  app.post<{ Params: { publicId: string }; Querystring: { signature: string } }>(
    '/api/callbacks/remote-start/:publicId',
    {
      schema: {
        params: { type: 'object', properties: { publicId: uuid }, required: ['publicId'] },
        querystring: {
          type: 'object',
          properties: { signature: { type: 'string' } },
          required: ['signature'],
        },
      },
    },
    async (request, reply) => {
      await startService.handleRemoteStartAnswer(
        request.params.publicId,
        request.query.signature,
        request.body,
      );
      return reply.code(204).send();
    },
  );

  // Stripe signs the exact bytes it sent, so this route keeps the body unparsed.
  app.register(async (webhooks) => {
    webhooks.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_request, body, done) => done(null, body),
    );
    webhooks.post<{ Body: Buffer; Headers: { 'stripe-signature'?: string } }>(
      '/api/webhooks/stripe',
      async (request, reply) => {
        const signature = request.headers['stripe-signature'];
        if (!signature || !Buffer.isBuffer(request.body)) {
          return reply.code(400).send({ error: 'Missing signature or body' });
        }
        let event;
        try {
          event = payments.parseWebhook(request.body, signature);
        } catch (error) {
          if (error instanceof InvalidWebhookError) {
            logger?.warn(`Rejected a Stripe webhook: ${error.message}`);
            return reply.code(400).send({ error: 'Invalid webhook' });
          }
          throw error;
        }
        await startService.handlePaymentEvent(event);
        return reply.code(200).send({ received: true });
      },
    );
  });

  if (dependencies.admin) {
    registerAdminRoutes(app, dependencies.admin.authenticator, dependencies.admin.service);
  }

  if (dependencies.frontendDir) {
    serveFrontend(app, dependencies.frontendDir, logger);
  }

  return app;
}

function serveFrontend(app: FastifyInstance, root: string, logger?: Logger<ILogObj>): void {
  if (!existsSync(join(root, 'index.html'))) {
    logger?.warn(`No driver frontend in ${root}; build apps/payment/frontend to serve it`);
    return;
  }
  // Vite names its assets by content hash, so a cached copy can never go stale.
  app.register(fastifyStatic, {
    root: join(root, 'assets'),
    prefix: '/assets/',
    immutable: true,
    maxAge: '365d',
  });
  for (const page of FRONTEND_PAGES) {
    app.get(page, (_request, reply) =>
      reply
        .header('Cache-Control', 'no-cache')
        .sendFile('index.html', root, { cacheControl: false }),
    );
  }
}
