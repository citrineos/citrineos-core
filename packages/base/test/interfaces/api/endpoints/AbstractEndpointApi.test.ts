// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { HttpMethod } from '@citrineos/types';
import fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import { Logger, type ILogObj } from 'tslog';
import { describe, expect, it } from 'vitest';
import { AbstractEndpoint } from '../../../../src/interfaces/api/endpoints/AbstractEndpoint.js';
import { AbstractEndpointApi } from '../../../../src/interfaces/api/endpoints/AbstractEndpointApi.js';
import type { BuiltEndpoint } from '../../../../src/interfaces/api/endpoints/buildEndpoints.js';
import type { ICommandEndpointMetadata } from '../../../../src/interfaces/api/endpoints/EndpointMetadata.js';
import { BadRequestError } from '../../../../src/interfaces/api/exceptions/BadRequestError.js';
import { NotFoundError } from '../../../../src/interfaces/api/exceptions/NotFoundError.js';

class TestApi extends AbstractEndpointApi {}

class StubEndpoint extends AbstractEndpoint {
  constructor(
    logger: Logger<ILogObj>,
    private readonly _behaviour: () => unknown,
  ) {
    super(logger);
  }

  async handle(_request: FastifyRequest, _reply: FastifyReply): Promise<unknown> {
    return this._behaviour();
  }
}

function aCapturingLogger(): { logger: Logger<ILogObj>; errors: ILogObj[] } {
  const errors: ILogObj[] = [];
  const logger = new Logger<ILogObj>({ type: 'hidden', minLevel: 5 });
  logger.attachTransport((logObj) => errors.push(logObj));
  return { logger, errors };
}

async function buildApi(
  route: ICommandEndpointMetadata,
  behaviour: () => unknown = () => ({ ok: true }),
  prefix = '/commands',
) {
  const server = fastify();
  const routes: Array<{ method: string; url: string }> = [];
  server.addHook('onRoute', (options) => {
    const methods = Array.isArray(options.method) ? options.method : [options.method];
    for (const method of methods) {
      routes.push({ method, url: options.url });
    }
  });

  const { logger, errors } = aCapturingLogger();
  const built: BuiltEndpoint[] = [{ route, endpoint: new StubEndpoint(logger, behaviour) }];
  new TestApi(server, prefix, built, logger);
  await server.ready();

  return { server, routes, errors };
}

const A_ROUTE: ICommandEndpointMetadata = {
  method: HttpMethod.Post,
  path: '/setStationPassword',
};

describe('AbstractEndpointApi', () => {
  describe('path building', () => {
    it('joins the prefix and the endpoint path', async () => {
      const { routes } = await buildApi(A_ROUTE);
      expect(routes).toEqual([{ method: 'POST', url: '/commands/setStationPassword' }]);
    });

    it.each([
      ['commands', 'setStationPassword'],
      ['/commands', 'setStationPassword'],
      ['commands/', '/setStationPassword'],
      ['/commands/', '/setStationPassword'],
    ])('normalizes prefix %s and path %s', async (prefix, path) => {
      const { routes } = await buildApi({ ...A_ROUTE, path }, undefined, prefix);
      expect(routes[0].url).toBe('/commands/setStationPassword');
    });

    it('preserves a multi-segment endpoint path', async () => {
      const { routes } = await buildApi(
        { ...A_ROUTE, path: '/webpayment/initiate' },
        undefined,
        '/evdriver',
      );
      expect(routes[0].url).toBe('/evdriver/webpayment/initiate');
    });

    it('registers the declared HTTP method', async () => {
      const { routes } = await buildApi({ ...A_ROUTE, method: HttpMethod.Delete });
      expect(routes[0].method).toBe('DELETE');
    });
  });

  describe('schema wiring', () => {
    it('validates the querystring against the declared schema', async () => {
      const { server } = await buildApi({
        ...A_ROUTE,
        querySchema: {
          $id: 'TestQuerySchema',
          type: 'object',
          properties: { tenantId: { type: 'number' } },
          required: ['tenantId'],
        },
      });

      const missing = await server.inject({ method: 'POST', url: '/commands/setStationPassword' });
      expect(missing.statusCode).toBe(400);

      const present = await server.inject({
        method: 'POST',
        url: '/commands/setStationPassword?tenantId=1',
      });
      expect(present.statusCode).toBe(200);
    });

    it('validates the body against the declared schema', async () => {
      const { server } = await buildApi({
        ...A_ROUTE,
        bodySchema: {
          $id: 'TestBodySchema',
          type: 'object',
          properties: { password: { type: 'string' } },
          required: ['password'],
        },
      });

      const bad = await server.inject({
        method: 'POST',
        url: '/commands/setStationPassword',
        payload: {},
      });
      expect(bad.statusCode).toBe(400);
    });

    it('accepts an anonymous schema by inlining it rather than sharing a $ref', async () => {
      const { server } = await buildApi({
        ...A_ROUTE,
        bodySchema: {
          type: 'object',
          properties: { password: { type: 'string' } },
          required: ['password'],
        },
      });

      const bad = await server.inject({
        method: 'POST',
        url: '/commands/setStationPassword',
        payload: {},
      });
      expect(bad.statusCode).toBe(400);
    });

    it('serializes the response through the declared response schema', async () => {
      const { server } = await buildApi(
        {
          ...A_ROUTE,
          responseSchema: {
            $id: 'TestResponseSchema',
            type: 'object',
            properties: { success: { type: 'boolean' } },
          },
        },
        () => ({ success: true, dropped: 'not in schema' }),
      );

      const response = await server.inject({
        method: 'POST',
        url: '/commands/setStationPassword',
      });
      expect(response.json()).toEqual({ success: true });
    });

    it('registers two endpoints that share the same $id without throwing', async () => {
      const sharedSchema = { $id: 'SharedSchema', type: 'object', properties: {} };
      const server = fastify();
      const { logger } = aCapturingLogger();
      const built: BuiltEndpoint[] = [
        {
          route: { method: HttpMethod.Post, path: '/first', bodySchema: sharedSchema },
          endpoint: new StubEndpoint(logger, () => ({ ok: true })),
        },
        {
          route: { method: HttpMethod.Post, path: '/second', bodySchema: sharedSchema },
          endpoint: new StubEndpoint(logger, () => ({ ok: true })),
        },
      ];

      expect(() => new TestApi(server, '/commands', built, logger)).not.toThrow();
      await expect(server.ready()).resolves.toBeDefined();
    });
  });

  describe('error handling', () => {
    it('maps a BadRequestError to 400', async () => {
      const { server } = await buildApi(A_ROUTE, () => {
        throw new BadRequestError('nope');
      });

      const response = await server.inject({ method: 'POST', url: '/commands/setStationPassword' });
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({ message: 'nope' });
    });

    it('maps a NotFoundError to 404', async () => {
      const { server } = await buildApi(A_ROUTE, () => {
        throw new NotFoundError('missing');
      });

      const response = await server.inject({ method: 'POST', url: '/commands/setStationPassword' });
      expect(response.statusCode).toBe(404);
    });

    it('maps an error without a statusCode to 500', async () => {
      const { server } = await buildApi(A_ROUTE, () => {
        throw new Error('boom');
      });

      const response = await server.inject({ method: 'POST', url: '/commands/setStationPassword' });
      expect(response.statusCode).toBe(500);
    });

    it('logs the failing route before rethrowing', async () => {
      const { server, errors } = await buildApi(A_ROUTE, () => {
        throw new NotFoundError('missing');
      });

      await server.inject({ method: 'POST', url: '/commands/setStationPassword' });

      expect(errors).toHaveLength(1);
      expect(JSON.stringify(errors[0])).toContain('/commands/setStationPassword');
    });

    it('logs nothing on a successful request', async () => {
      const { server, errors } = await buildApi(A_ROUTE);

      await server.inject({ method: 'POST', url: '/commands/setStationPassword' });

      expect(errors).toEqual([]);
    });
  });
});
