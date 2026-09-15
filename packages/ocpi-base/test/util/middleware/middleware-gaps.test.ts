// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { BadRequestError, NotFoundError, UnauthorizedError } from 'routing-controllers';
import { UnauthorizedException } from '@citrineos/base';

import { AdminAuthMiddleware } from '../../../src/util/middleware/admin-auth-middleware.js';
import {
  AuthMiddleware,
  RegistrationAuthMiddleware,
} from '../../../src/util/middleware/auth-middleware.js';
import { HttpExceptionHandler } from '../../../src/util/middleware/http-exception-handler.js';
import { OcpiExceptionHandler } from '../../../src/util/middleware/ocpi-exception-handler.js';
import { oidcAuthMiddleware } from '../../../src/util/security/oidc-auth-middleware.js';
import { GET_TENANT_PARTNER_BY_SERVER_TOKEN } from '../../../src/graphql/index.js';
import { MissingParamException } from '../../../src/exception/missing-param-exception.js';
import { AlreadyRegisteredException } from '../../../src/exception/already-registered-exception.js';
import { UnknownTokenException } from '../../../src/exception/unknown-token-exception.js';
import { WrongClientAccessException } from '../../../src/exception/wrong-client-access-exception.js';
import { UnsuccessfulRequestException } from '../../../src/exception/unsuccessful-request-exception.js';

// 'Token ' + base64('example-token')
const VALID_AUTH_HEADER = 'Token ZXhhbXBsZS10b2tlbg==';

const aTenantPartner = () => ({
  id: 1,
  countryCode: 'DE',
  partyId: 'EMP',
  tenant: { id: 2, countryCode: 'US', partyId: 'CPO' },
});

const MATCHING_ROUTING_HEADERS = {
  'ocpi-from-country-code': 'DE',
  'ocpi-from-party-id': 'EMP',
  'ocpi-to-country-code': 'US',
  'ocpi-to-party-id': 'CPO',
};

/** Koa context slice AuthMiddleware touches: request/req headers share one object, as in Koa. */
function ocpiCtx(headers: Record<string, string>) {
  return {
    request: { headers, method: 'GET', url: '/ocpi/2.2.1/locations' },
    req: { headers },
    state: {} as Record<string, unknown>,
    type: '',
    status: 0,
    body: undefined as unknown,
  };
}

function authMiddlewareWith(client: { request: ReturnType<typeof vi.fn> }) {
  return new AuthMiddleware({ logger: { debug: vi.fn() }, ocpiGraphqlClient: client } as never);
}

function expectOcpiUnauthorized(ctx: ReturnType<typeof ocpiCtx>) {
  expect(ctx.status).toBe(401);
  expect(ctx.type).toBe('application/json');
  const body = JSON.parse(ctx.body as string);
  expect(body.status_code).toBe(2002);
  expect(body.status_message).toBe('Not Authorized');
}

describe('AdminAuthMiddleware', () => {
  it('passes straight through when no oidc config is present', async () => {
    const middleware = new AdminAuthMiddleware({ config: {} } as never);
    const next = vi.fn().mockResolvedValue('handled');
    const ctx = ocpiCtx({});

    await expect(middleware.use(ctx as never, next)).resolves.toBe('handled');

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.status).toBe(0);
  });

  it('delegates to the oidc middleware when oidc is configured', async () => {
    const middleware = new AdminAuthMiddleware({
      config: { oidc: { jwksUri: 'https://idp.test/jwks.json', issuer: 'https://idp.test/' } },
    } as never);
    const next = vi.fn();
    const ctx = { headers: {}, state: {}, status: 0, body: undefined as unknown };

    await middleware.use(ctx as never, next);

    expect(ctx.status).toBe(401);
    expect(ctx.body).toEqual({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });
});

describe('oidcAuthMiddleware', () => {
  const config = { jwksUri: 'https://idp.test/jwks.json', issuer: 'https://idp.test/' };

  it('rejects a non-Bearer scheme', async () => {
    const next = vi.fn();
    const ctx = { headers: { authorization: 'Token abc' }, state: {}, status: 0, body: undefined };

    await oidcAuthMiddleware(config)(ctx as never, next);

    expect(ctx.status).toBe(401);
    expect(ctx.body).toEqual({ error: 'Missing or invalid Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a malformed bearer token before any jwks lookup', async () => {
    const next = vi.fn();
    const ctx = {
      headers: { authorization: 'Bearer not-a-jwt' },
      state: {} as Record<string, unknown>,
      status: 0,
      body: undefined,
    };

    await oidcAuthMiddleware(config)(ctx as never, next);

    expect(ctx.status).toBe(401);
    expect(ctx.body).toEqual({ error: 'Invalid token', details: 'jwt malformed' });
    expect(ctx.state.user).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });
});

describe('AuthMiddleware', () => {
  it('rejects a request without an Authorization header without querying graphql', async () => {
    const client = { request: vi.fn() };
    const next = vi.fn();
    const ctx = ocpiCtx({});

    await authMiddlewareWith(client).use(ctx, next);

    expectOcpiUnauthorized(ctx);
    expect(client.request).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a Bearer-scheme header before querying graphql', async () => {
    const client = { request: vi.fn() };
    const next = vi.fn();
    const ctx = ocpiCtx({ authorization: 'Bearer some-token' });

    await authMiddlewareWith(client).use(ctx, next);

    expectOcpiUnauthorized(ctx);
    expect(client.request).not.toHaveBeenCalled();
  });

  it('queries graphql with the decoded token and rejects when no partner matches', async () => {
    const client = { request: vi.fn().mockResolvedValue({ TenantPartners: [] }) };
    const next = vi.fn();
    const ctx = ocpiCtx({ authorization: VALID_AUTH_HEADER, ...MATCHING_ROUTING_HEADERS });

    await authMiddlewareWith(client).use(ctx, next);

    expect(client.request).toHaveBeenCalledTimes(1);
    expect(client.request).toHaveBeenCalledWith(GET_TENANT_PARTNER_BY_SERVER_TOKEN, {
      serverToken: 'example-token',
    });
    expectOcpiUnauthorized(ctx);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when the routing headers do not match the resolved partner', async () => {
    const client = { request: vi.fn().mockResolvedValue({ TenantPartners: [aTenantPartner()] }) };
    const next = vi.fn();
    const ctx = ocpiCtx({
      authorization: VALID_AUTH_HEADER,
      ...MATCHING_ROUTING_HEADERS,
      'ocpi-from-party-id': 'XXX',
    });

    await authMiddlewareWith(client).use(ctx, next);

    expectOcpiUnauthorized(ctx);
    expect(ctx.state.tenantPartner).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  it('stores the partner on ctx.state and calls next when token and routing headers match', async () => {
    const partner = aTenantPartner();
    const client = { request: vi.fn().mockResolvedValue({ TenantPartners: [partner] }) };
    const next = vi.fn().mockResolvedValue(undefined);
    const ctx = ocpiCtx({ authorization: VALID_AUTH_HEADER, ...MATCHING_ROUTING_HEADERS });

    await authMiddlewareWith(client).use(ctx, next);

    expect(ctx.state.tenantPartner).toBe(partner);
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.status).toBe(0);
  });

  it('answers 401 when the graphql lookup itself fails', async () => {
    const client = { request: vi.fn().mockRejectedValue(new Error('gateway down')) };
    const next = vi.fn();
    const ctx = ocpiCtx({ authorization: VALID_AUTH_HEADER, ...MATCHING_ROUTING_HEADERS });

    await authMiddlewareWith(client).use(ctx, next);

    expectOcpiUnauthorized(ctx);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('RegistrationAuthMiddleware', () => {
  it('skips the routing-header check', async () => {
    const partner = aTenantPartner();
    const client = { request: vi.fn().mockResolvedValue({ TenantPartners: [partner] }) };
    const next = vi.fn().mockResolvedValue(undefined);
    // no OCPI routing headers at all
    const ctx = ocpiCtx({ authorization: VALID_AUTH_HEADER });

    const middleware = new RegistrationAuthMiddleware({
      logger: { debug: vi.fn() },
      ocpiGraphqlClient: client,
    } as never);
    await middleware.use(ctx, next);

    expect(client.request).toHaveBeenCalledTimes(1);
    expect(ctx.state.tenantPartner).toBe(partner);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('HttpExceptionHandler', () => {
  const handler = new HttpExceptionHandler();
  const throwing = (err: unknown) => vi.fn().mockRejectedValue(err);

  it('leaves the context alone when next resolves', async () => {
    const ctx: any = {};
    const next = vi.fn().mockResolvedValue(undefined);

    await handler.use(ctx, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.status).toBeUndefined();
    expect(ctx.body).toBeUndefined();
  });

  it('maps UnauthorizedError to 401 with a fixed message', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new UnauthorizedError('whatever')));

    expect(ctx.status).toBe(401);
    expect(ctx.type).toBe('application/json');
    expect(JSON.parse(ctx.body)).toEqual({ message: 'Not Authorized' });
  });

  it('maps MissingParamException to 400 with the original message', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new MissingParamException('missing country_code')));

    expect(ctx.status).toBe(400);
    expect(JSON.parse(ctx.body)).toEqual({ message: 'missing country_code' });
  });

  it('maps AlreadyRegisteredException to 405', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new AlreadyRegisteredException()));

    expect(ctx.status).toBe(405);
    expect(JSON.parse(ctx.body)).toEqual({ message: 'Client already registered' });
  });

  it('maps WrongClientAccessException to a bodyless 404', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new WrongClientAccessException('other client')));

    expect(ctx.status).toBe(404);
    expect(ctx.body).toBeUndefined();
  });

  it('matches SequelizeUniqueConstraintError by constructor name', async () => {
    class SequelizeUniqueConstraintError extends Error {}
    const ctx: any = {};
    await handler.use(ctx, throwing(new SequelizeUniqueConstraintError('duplicate row')));

    expect(ctx.status).toBe(400);
    expect(JSON.parse(ctx.body)).toEqual({ message: 'duplicate row' });
  });

  it('maps an unknown error to 500 with the message appended', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new Error('boom')));

    expect(ctx.status).toBe(500);
    expect(JSON.parse(ctx.body)).toEqual({ message: 'Internal Server Error, boom' });
  });
});

describe('OcpiExceptionHandler', () => {
  const handler = new OcpiExceptionHandler();
  const throwing = (err: unknown) => vi.fn().mockRejectedValue(err);
  const parsedBody = (ctx: any) => JSON.parse(ctx.body);

  it('maps UnauthorizedException to 401 / 2002', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new UnauthorizedException('nope')));

    expect(ctx.status).toBe(401);
    expect(ctx.type).toBe('application/json');
    const body = parsedBody(ctx);
    expect(body.status_code).toBe(2002);
    expect(body.status_message).toBe('Not Authorized');
  });

  it('maps NotFoundError to 404 / 2001 credentials-not-found', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new NotFoundError('missing thing')));

    expect(ctx.status).toBe(404);
    const body = parsedBody(ctx);
    expect(body.status_code).toBe(2001);
    expect(body.status_message).toBe('Credentials not found');
  });

  it('maps UnknownTokenException to 404 / 2004 with the original message', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new UnknownTokenException('token abc unknown')));

    expect(ctx.status).toBe(404);
    const body = parsedBody(ctx);
    expect(body.status_code).toBe(2004);
    expect(body.status_message).toBe('token abc unknown');
  });

  it('maps UnsuccessfulRequestException to 400 / 3000', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new UnsuccessfulRequestException('partner said no')));

    expect(ctx.status).toBe(400);
    const body = parsedBody(ctx);
    expect(body.status_code).toBe(3000);
    expect(body.status_message).toBe('partner said no');
  });

  it('keeps the httpCode of an unlisted 4xx routing-controllers error', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new BadRequestError('bad payload')));

    expect(ctx.status).toBe(400);
    const body = parsedBody(ctx);
    expect(body.status_code).toBe(2001);
    expect(body.status_message).toBe('bad payload');
  });

  it('maps an unknown error to 500 / 2000', async () => {
    const ctx: any = {};
    await handler.use(ctx, throwing(new Error('boom')));

    expect(ctx.status).toBe(500);
    const body = parsedBody(ctx);
    expect(body.status_code).toBe(2000);
    expect(body.status_message).toContain('Internal Server Error, boom');
  });
});
