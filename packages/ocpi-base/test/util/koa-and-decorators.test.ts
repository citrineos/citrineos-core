// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMetadataArgsStorage } from 'routing-controllers';
import { z } from 'zod';
import { IsString, validateSync } from 'class-validator';
import {
  AsAdminEndpoint,
  AsOcpiFunctionalEndpoint,
  AsOcpiRegistrationEndpoint,
  AuthToken,
  BodyWithExample,
  BodyWithSchema,
  EnumParam,
  EnumQueryParam,
  FunctionalEndpointParams,
  KoaServer,
  MultipleTypes,
  OcpiHeaders,
  Paginated,
  VersionNumberParam,
} from '../../src/index.js';
import { extractToken } from '../../src/util/decorators/auth-token.js';
import { Enum } from '../../src/util/decorators/enum.js';
import { Optional, OPTIONAL_PARAM } from '../../src/util/decorators/optional.js';
import { BODY_PARAM } from '../../src/util/decorators/body-with-schema.js';
import { BODY_WITH_EXAMPLE_PARAM } from '../../src/util/decorators/body-with-example.js';
import { ENUM_PARAM } from '../../src/util/decorators/enum-param.js';
import { ENUM_QUERY_PARAM } from '../../src/util/decorators/enum-query-param.js';
import { MULTIPLE_TYPES } from '../../src/util/decorators/multiple-types.js';
import { versionIdParam } from '../../src/util/decorators/version-number-param.js';
import { InvalidParamException } from '../../src/exception/invalid-param-exception.js';
import { SchemaStore } from '../../src/openapi-spec-helper/schema-store.js';
import { base64Encode } from '../../src/util/util.js';

const paramsFor = (proto: object, method: string) =>
  getMetadataArgsStorage().params.filter((p) => p.object === proto && p.method === method);

const usesFor = (target: unknown) =>
  getMetadataArgsStorage().uses.filter((u) => u.target === target);

const transformOf = (proto: object, method: string) => {
  const param = paramsFor(proto, method)[0];
  return { param, transform: param.transform as (action: any, value?: any) => any };
};

// exposes the protected setup methods without touching run()/listen()
class ExposedKoaServer extends KoaServer {
  initLoggerPublic() {
    this.initLogger();
  }

  initAppPublic() {
    this.initApp();
  }

  initKoaSwaggerPublic(info: any, servers?: any) {
    this.initKoaSwagger(info, servers);
  }
}

describe('KoaServer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('run registers an error handler and listens on the given host and port', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new ExposedKoaServer();
    const fakeHttpServer = { close: vi.fn() };
    const on = vi.fn();
    const listen = vi.fn(() => fakeHttpServer);
    server.app = { on, listen } as any;

    server.run('127.0.0.1', 9099);

    expect(listen).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(9099, '127.0.0.1');
    expect(server.server).toBe(fakeHttpServer);
    expect(on).toHaveBeenCalledTimes(1);
    expect(on.mock.calls[0][0]).toBe('error');
    expect(logSpy).toHaveBeenCalledWith('Server started on port 9099');

    const errorHandler = on.mock.calls[0][1] as (err: Error, ctx: unknown) => void;
    errorHandler(new Error('boom'), {});
    expect(logSpy).toHaveBeenCalledWith('Error intercepted by Koa:', 'boom');
  });

  it('shutdown closes the http server', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new ExposedKoaServer();
    const close = vi.fn((cb: () => void) => cb());
    server.server = { close } as any;

    server.shutdown();

    expect(close).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('Koa server closed');
  });

  it('shutdown without a server only logs', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const server = new ExposedKoaServer();

    server.shutdown();

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('No server to close');
  });

  it('initLogger mounts koa-logger on the koa instance', () => {
    const use = vi.fn();
    const server = new ExposedKoaServer();
    server.koa = { use } as any;

    server.initLoggerPublic();

    expect(use).toHaveBeenCalledTimes(1);
    expect(use.mock.calls[0][0].name).toBe('logger');
  });

  it('initApp wires routing-controllers middleware then the logger', () => {
    const use = vi.fn();
    const koa = { use } as any;
    const server = new ExposedKoaServer();
    server.koa = koa;

    server.initAppPublic();

    expect(server.app).toBe(koa);
    // koa driver: bodyparser, router dispatch, allowedMethods; then koa-logger
    expect(use.mock.calls.map((c) => c[0].name)).toEqual([
      'bodyParser',
      'dispatch',
      'allowedMethods',
      'logger',
    ]);
  });

  it('initKoaSwagger builds the spec and mounts the swagger ui middleware', () => {
    const use = vi.fn();
    const server = new ExposedKoaServer();
    server.app = { use } as any;
    const info = { title: 'OCPI Test API', version: '9.9.9' };

    // spec generation over the real controllers needs design:paramtypes metadata,
    // which esbuild does not emit; generate the spec with no registered controllers
    const metadataStorage = getMetadataArgsStorage() as any;
    const realControllers = metadataStorage.controllers;
    const realActions = metadataStorage.actions;
    metadataStorage.controllers = [];
    metadataStorage.actions = [];
    try {
      server.initKoaSwaggerPublic(info, [{ url: 'https://ocpi.example.com' }]);
    } finally {
      metadataStorage.controllers = realControllers;
      metadataStorage.actions = realActions;
    }

    expect(server.storage).toBe(getMetadataArgsStorage());
    const spec = server.spec as any;
    expect(spec.info).toEqual(info);
    expect(spec.servers).toEqual([{ url: 'https://ocpi.example.com' }]);
    expect(spec.security).toEqual([{ authorization: [] }]);
    expect(spec.components.securitySchemes.authorization).toEqual({
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'Token <base64_token>',
    });
    expect(spec.components.schemas.VersionNumber).toEqual({
      type: 'string',
      enum: ['2.0', '2.1', '2.1.1', '2.2', '2.2.1'],
    });
    expect(use).toHaveBeenCalledTimes(1);
    expect(typeof use.mock.calls[0][0]).toBe('function');
  });
});

describe('endpoint decorators', () => {
  it('AsAdminEndpoint applies admin auth and http exception middleware', () => {
    class AdminFixture {
      create() {}
    }
    AsAdminEndpoint()(AdminFixture.prototype, 'create');

    const uses = usesFor(AdminFixture);
    expect(uses).toHaveLength(2);
    expect(uses.map((u) => (u.middleware as any).name)).toEqual([
      'AdminAuthMiddleware',
      'HttpExceptionHandler',
    ]);
    expect(uses.map((u) => u.method)).toEqual(['create', 'create']);
    expect(uses.map((u) => u.afterAction)).toEqual([false, false]);
  });

  it('AsOcpiFunctionalEndpoint registers all ocpi headers and four middlewares', () => {
    class FunctionalFixture {
      getTokens() {}
    }
    AsOcpiFunctionalEndpoint()(FunctionalFixture.prototype, 'getTokens');

    const headerParams = paramsFor(FunctionalFixture.prototype, 'getTokens');
    expect(headerParams.map((p) => p.type)).toEqual(Array(7).fill('header'));
    expect(headerParams.map((p) => p.name)).toEqual([
      'Authorization',
      'OCPI-from-country-code',
      'OCPI-from-party-id',
      'OCPI-to-country-code',
      'OCPI-to-party-id',
      'X-Request-ID',
      'X-Correlation-ID',
    ]);
    expect(headerParams.every((p) => p.required === true)).toBe(true);

    const uses = usesFor(FunctionalFixture);
    expect(uses.map((u) => (u.middleware as any).name)).toEqual([
      'AuthMiddleware',
      'OcpiHeaderMiddleware',
      'UniqueMessageIdsMiddleware',
      'OcpiExceptionHandler',
    ]);
    expect(uses.every((u) => u.method === 'getTokens' && u.afterAction === false)).toBe(true);
  });

  it('AsOcpiRegistrationEndpoint registers auth and message id headers with registration middleware', () => {
    class RegistrationFixture {
      postCredentials() {}
    }
    AsOcpiRegistrationEndpoint()(RegistrationFixture.prototype, 'postCredentials');

    const headerParams = paramsFor(RegistrationFixture.prototype, 'postCredentials');
    expect(headerParams.map((p) => p.name)).toEqual([
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
    ]);
    expect(headerParams.map((p) => p.type)).toEqual(['header', 'header', 'header']);
    expect(headerParams.every((p) => p.required === true)).toBe(true);

    const uses = usesFor(RegistrationFixture);
    expect(uses.map((u) => (u.middleware as any).name)).toEqual([
      'RegistrationAuthMiddleware',
      'UniqueMessageIdsMiddleware',
      'OcpiExceptionHandler',
    ]);
  });

  it('Paginated registers a queries param and the paginated middleware', () => {
    class PaginatedFixture {
      list() {}
    }
    Paginated()(PaginatedFixture.prototype, 'list', 0);

    const params = paramsFor(PaginatedFixture.prototype, 'list');
    expect(params).toHaveLength(1);
    expect(params[0].type).toBe('queries');
    expect(params[0].index).toBe(0);

    const uses = usesFor(PaginatedFixture);
    expect(uses).toHaveLength(1);
    expect((uses[0].middleware as any).name).toBe('PaginatedMiddleware');
    expect(uses[0].afterAction).toBe(false);
  });
});

describe('param decorators', () => {
  it('AuthToken decodes the Authorization header token', () => {
    class TokenFixture {
      whoami() {}
    }
    AuthToken()(TokenFixture.prototype, 'whoami', 0);

    const { param, transform } = transformOf(TokenFixture.prototype, 'whoami');
    expect(param.type).toBe('custom-converter');
    expect(param.required).toBe(true);
    expect(param.index).toBe(0);

    const token = transform({
      request: { headers: { authorization: `Token ${base64Encode('cred-token-123')}` } },
    });
    expect(token).toBe('cred-token-123');
    expect(transform({ request: { headers: {} } })).toBeUndefined();
  });

  it('extractToken rejects a non-Token header', () => {
    expect(extractToken(`Token ${base64Encode('abc')}`)).toBe('abc');
    expect(() => extractToken('Bearer abc')).toThrow('Invalid Authorization header format');
  });

  it('FunctionalEndpointParams builds OcpiHeaders from lowercased request headers', () => {
    class HeadersFixture {
      cmd() {}
    }
    FunctionalEndpointParams()(HeadersFixture.prototype, 'cmd', 1);

    const { param, transform } = transformOf(HeadersFixture.prototype, 'cmd');
    expect(param.type).toBe('custom-converter');
    expect(param.index).toBe(1);

    const headers = transform({
      request: {
        headers: {
          'ocpi-from-country-code': 'US',
          'ocpi-from-party-id': 'CPO',
          'ocpi-to-country-code': 'DE',
          'ocpi-to-party-id': 'MSP',
        },
      },
    });
    expect(headers).toBeInstanceOf(OcpiHeaders);
    expect({ ...headers }).toEqual({
      fromCountryCode: 'US',
      fromPartyId: 'CPO',
      toCountryCode: 'DE',
      toPartyId: 'MSP',
    });
  });

  it('BodyWithSchema validates the body and records schema metadata', () => {
    const tokenSchema = z.object({ uid: z.string(), valid: z.boolean() });
    class BodyFixture {
      put() {}
    }
    BodyWithSchema(tokenSchema, 'KoaDecoratorsTokenDto')(BodyFixture.prototype, 'put', 1);

    const { param, transform } = transformOf(BodyFixture.prototype, 'put');
    expect(param.type).toBe('custom-converter');
    expect(param.required).toBe(true);
    expect(param.index).toBe(1);

    const meta = Reflect.getMetadata(BODY_PARAM, BodyFixture.prototype, 'put.1');
    expect(meta.schema).toBe(tokenSchema);
    expect(meta.name).toBe('KoaDecoratorsTokenDto');

    const parsed = transform({ request: { body: { uid: 'u1', valid: true, extra: 1 } } });
    expect(parsed).toEqual({ uid: 'u1', valid: true });

    const invalid = () => transform({ request: { body: { uid: 'u1' } } });
    expect(invalid).toThrow(InvalidParamException);
    expect(invalid).toThrow(/^Invalid request body: valid: /);
  });

  it('BodyWithSchema partial option accepts a subset body and required false is stored', () => {
    const tokenSchema = z.object({ uid: z.string(), valid: z.boolean() });
    class PatchFixture {
      patch() {}
    }
    BodyWithSchema(tokenSchema, 'KoaDecoratorsTokenDto', { partial: true, required: false })(
      PatchFixture.prototype,
      'patch',
      0,
    );

    const { param, transform } = transformOf(PatchFixture.prototype, 'patch');
    expect(param.required).toBe(false);
    expect(transform({ request: { body: { uid: 'only-uid' } } })).toEqual({ uid: 'only-uid' });
  });

  it('BodyWithExample stores an example promise alongside body metadata', async () => {
    const exampleSchema = z.object({ result: z.string() });
    class ExampleFixture {
      post() {}
    }
    BodyWithExample(exampleSchema, 'KoaDecoratorsCommandResultDto')(
      ExampleFixture.prototype,
      'post',
      0,
    );

    const bodyMeta = Reflect.getMetadata(BODY_PARAM, ExampleFixture.prototype, 'post.0');
    expect(bodyMeta.schema).toBe(exampleSchema);
    expect(bodyMeta.name).toBe('KoaDecoratorsCommandResultDto');

    const example = await Reflect.getMetadata(
      BODY_WITH_EXAMPLE_PARAM,
      ExampleFixture.prototype,
      'post',
    );
    expect(example).not.toBeNull();
    expect(typeof example.result).toBe('string');
  });

  it('EnumParam registers a path param, schema and metadata, without clobbering an existing schema', () => {
    enum PowerType {
      AC = 'AC',
      DC = 'DC',
    }
    class EnumParamFixture {
      connector() {}
    }
    EnumParam('powerType', PowerType, 'KoaDecoratorsPowerType')(
      EnumParamFixture.prototype,
      'connector',
      2,
    );

    const params = paramsFor(EnumParamFixture.prototype, 'connector');
    expect(params).toHaveLength(1);
    expect(params[0].type).toBe('param');
    expect(params[0].name).toBe('powerType');
    expect(params[0].index).toBe(2);
    expect(SchemaStore.getSchema('KoaDecoratorsPowerType')).toEqual({
      type: 'string',
      enum: ['AC', 'DC'],
    });
    expect(Reflect.getMetadata(ENUM_PARAM, EnumParamFixture.prototype, 'connector.powerType')).toBe(
      'KoaDecoratorsPowerType',
    );

    enum OtherType {
      X = 'X',
    }
    class SecondFixture {
      second() {}
    }
    EnumParam('powerType', OtherType, 'KoaDecoratorsPowerType')(
      SecondFixture.prototype,
      'second',
      0,
    );
    expect(SchemaStore.getSchema('KoaDecoratorsPowerType')).toEqual({
      type: 'string',
      enum: ['AC', 'DC'],
    });
  });

  it('EnumQueryParam registers a query param and schema metadata', () => {
    const sortSchema = z.enum(['ASC', 'DESC']);
    class QueryFixture {
      list() {}
    }
    EnumQueryParam('sort', sortSchema, 'KoaDecoratorsSortOrder')(QueryFixture.prototype, 'list', 3);

    const params = paramsFor(QueryFixture.prototype, 'list');
    expect(params).toHaveLength(1);
    expect(params[0].type).toBe('query');
    expect(params[0].name).toBe('sort');
    expect(params[0].index).toBe(3);

    const meta = Reflect.getMetadata(ENUM_QUERY_PARAM, QueryFixture.prototype, 'list.sort');
    expect(meta.name).toBe('KoaDecoratorsSortOrder');
    expect(meta.schema).toBe(sortSchema);
  });

  it('MultipleTypes stores the type list without registering a routing param', () => {
    const aSchema = z.object({ a: z.string() });
    const bSchema = z.object({ b: z.number() });
    class MultiFixture {
      patch() {}
    }
    MultipleTypes(
      { name: 'KoaDecoratorsAType', schema: aSchema },
      { name: 'KoaDecoratorsBType', schema: bSchema },
    )(MultiFixture.prototype, 'patch', 1);

    const meta = Reflect.getMetadata(MULTIPLE_TYPES, MultiFixture.prototype, 'patch.1');
    expect(meta).toHaveLength(2);
    expect(meta[0]).toEqual({ name: 'KoaDecoratorsAType', schema: aSchema });
    expect(meta[1].schema).toBe(bSchema);
    expect(paramsFor(MultiFixture.prototype, 'patch')).toHaveLength(0);
  });

  it('VersionNumberParam registers the versionId path param backed by the VersionNumber enum', () => {
    class VersionFixture {
      details() {}
    }
    VersionNumberParam()(VersionFixture.prototype, 'details', 0);

    const params = paramsFor(VersionFixture.prototype, 'details');
    expect(params).toHaveLength(1);
    expect(params[0].type).toBe('param');
    expect(params[0].name).toBe(versionIdParam);
    expect(
      Reflect.getMetadata(ENUM_PARAM, VersionFixture.prototype, `details.${versionIdParam}`),
    ).toBe('VersionNumber');
    expect(SchemaStore.getSchema('VersionNumber')).toEqual({
      type: 'string',
      enum: ['2.0', '2.1', '2.1.1', '2.2', '2.2.1'],
    });
  });
});

describe('property decorators', () => {
  it('Enum writes isEnum metadata and enforces enum membership', () => {
    enum TokenStatus {
      ALLOWED = 'ALLOWED',
      BLOCKED = 'BLOCKED',
    }
    class EnumHolder {
      status!: string;
    }
    Enum(TokenStatus, 'KoaDecoratorsTokenStatus')(EnumHolder.prototype, 'status');

    expect(Reflect.getMetadata('isEnum', EnumHolder.prototype, 'status')).toBe(
      'KoaDecoratorsTokenStatus',
    );

    const bad = new EnumHolder();
    bad.status = 'NOPE';
    const errors = validateSync(bad);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('status');
    expect(Object.keys(errors[0].constraints ?? {})).toEqual(['isEnum']);

    const ok = new EnumHolder();
    ok.status = TokenStatus.ALLOWED;
    expect(validateSync(ok)).toHaveLength(0);
  });

  it('Optional toggles IsOptional and records the flag in metadata', () => {
    class OptionalHolder {
      note?: string;
    }
    IsString()(OptionalHolder.prototype, 'note');
    Optional()(OptionalHolder.prototype, 'note');

    expect(Reflect.getMetadata(OPTIONAL_PARAM, OptionalHolder.prototype, 'note')).toBe(true);
    expect(validateSync(new OptionalHolder())).toHaveLength(0);

    class RequiredHolder {
      note?: string;
    }
    IsString()(RequiredHolder.prototype, 'note');
    Optional(false)(RequiredHolder.prototype, 'note');

    expect(Reflect.getMetadata(OPTIONAL_PARAM, RequiredHolder.prototype, 'note')).toBe(false);
    const errors = validateSync(new RequiredHolder());
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints ?? {})).toEqual(['isString']);
  });
});
