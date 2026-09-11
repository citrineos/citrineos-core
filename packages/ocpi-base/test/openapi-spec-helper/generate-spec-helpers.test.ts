// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  expressToOpenAPIPath,
  getContentType,
  getFullExpressPath,
  getFullPath,
  getHeaderParams,
  getOperation,
  getOperationId,
  getPathParams,
  getPaths,
  getQueryParams,
  getRequestBody,
  getResponses,
  getSpec,
  getStatusCode,
  getSummary,
  getTags,
} from '../../src/openapi-spec-helper/generate-spec-helpers.js';
import type { IRoute } from '../../src/openapi-spec-helper/parse-metadata.js';
import { mergeDeep } from '../../src/openapi-spec-helper/merge-deep.js';
import { smartcase } from '../../src/openapi-spec-helper/smart-case.js';
import { capitalize } from '../../src/openapi-spec-helper/capitalize.js';
import { SchemaStore } from '../../src/openapi-spec-helper/schema-store.js';
import { ENUM_PARAM } from '../../src/util/decorators/enum-param.js';
import { ENUM_QUERY_PARAM } from '../../src/util/decorators/enum-query-param.js';
import { MULTIPLE_TYPES } from '../../src/util/decorators/multiple-types.js';
import { BODY_PARAM } from '../../src/util/decorators/body-with-schema.js';

class TokensController {
  getTokenById(_tokenId: string) {}
}

class OcpiHttpHeaders {}
class PaginatedParams {}

function aRoute(overrides: Partial<Record<keyof IRoute, unknown>> = {}): IRoute {
  return {
    action: { target: TokensController, method: 'getTokenById', route: '/:tokenId', type: 'get' },
    controller: { target: TokensController, route: '/tokens', type: 'json' },
    options: {},
    params: [],
    responseHandlers: [],
    ...overrides,
  } as unknown as IRoute;
}

// Host object standing in for a controller prototype; getParamSchema reads
// design:paramtypes off (object, method).
function paramHost(paramtypes: unknown[], method = 'getTokenById'): object {
  const host = {};
  Reflect.defineMetadata('design:paramtypes', paramtypes, host, method);
  return host;
}

describe('getFullExpressPath', () => {
  it('concatenates routePrefix, controller route and action route', () => {
    const route = aRoute({ options: { routePrefix: '/ocpi' } });
    expect(getFullExpressPath(route)).toBe('/ocpi/tokens/:tokenId');
  });

  it('treats missing segments as empty strings', () => {
    const route = aRoute({
      action: { target: TokensController, method: 'getTokenById', type: 'get' },
      controller: { target: TokensController, type: 'json' },
    });
    expect(getFullExpressPath(route)).toBe('');
  });
});

describe('getOperationId', () => {
  it('joins controller class name and method with a dot', () => {
    expect(getOperationId(aRoute())).toBe('TokensController.getTokenById');
  });
});

describe('getContentType', () => {
  it('defaults to application/json for json controllers', () => {
    expect(getContentType(aRoute())).toBe('application/json');
  });

  it('defaults to text/html for non-json controllers', () => {
    const route = aRoute({
      controller: { target: TokensController, route: '/tokens', type: 'text' },
    });
    expect(getContentType(route)).toBe('text/html; charset=utf-8');
  });

  it('prefers a content-type response handler over the default', () => {
    const route = aRoute({
      responseHandlers: [{ type: 'content-type', value: 'application/pdf' }],
    });
    expect(getContentType(route)).toBe('application/pdf');
  });
});

describe('getStatusCode', () => {
  it('defaults to 200', () => {
    expect(getStatusCode(aRoute())).toBe('200');
  });

  it('stringifies a numeric success-code handler', () => {
    const route = aRoute({ responseHandlers: [{ type: 'success-code', value: 201 }] });
    expect(getStatusCode(route)).toBe('201');
  });
});

describe('getResponses', () => {
  it('keys the response by status code and content type', () => {
    const route = aRoute({
      responseHandlers: [
        { type: 'success-code', value: 204 },
        { type: 'content-type', value: 'text/plain' },
      ],
    });
    expect(getResponses(route)).toEqual({
      '204': {
        content: { 'text/plain': {} },
        description: 'Successful response',
      },
    });
  });
});

describe('getSummary', () => {
  // lodash capitalize lowercases everything after the first character.
  it('start-cases the method name then capitalizes only the first word', () => {
    expect(getSummary(aRoute())).toBe('Get token by id');
  });
});

describe('getTags', () => {
  it('strips the Controller suffix and start-cases the rest', () => {
    class ChargingProfilesController {}
    const route = aRoute({
      controller: { target: ChargingProfilesController, route: '/profiles', type: 'json' },
    });
    expect(getTags(route)).toEqual(['Charging Profiles']);
  });
});

describe('expressToOpenAPIPath', () => {
  it('converts an Express param to a curly-brace param', () => {
    expect(expressToOpenAPIPath('/users/:userId')).toBe('/users/{userId}');
  });

  it('converts multiple params, dropping the optional modifier', () => {
    expect(expressToOpenAPIPath('/users/:userId/items/:itemId?')).toBe(
      '/users/{userId}/items/{itemId}',
    );
  });

  it('returns a plain path unchanged', () => {
    expect(expressToOpenAPIPath('/ocpi/versions')).toBe('/ocpi/versions');
  });

  it('throws on a dangling parameter marker', () => {
    expect(() => expressToOpenAPIPath('/users/:')).toThrow('Missing parameter name at 7');
  });
});

describe('getFullPath', () => {
  it('produces the OpenAPI path including the route prefix', () => {
    const route = aRoute({ options: { routePrefix: '/ocpi' } });
    expect(getFullPath(route)).toBe('/ocpi/tokens/{tokenId}');
  });
});

describe('getHeaderParams', () => {
  it('maps a header param with its reflected primitive type', () => {
    const host = paramHost([String]);
    const route = aRoute({
      params: [
        {
          type: 'header',
          name: 'X-Request-ID',
          object: host,
          method: 'getTokenById',
          index: 0,
          required: true,
        },
      ],
    });
    expect(getHeaderParams(route)).toEqual([
      { in: 'header', name: 'X-Request-ID', required: true, schema: { type: 'string' } },
    ]);
  });

  it('leaves required false when neither the param nor the defaults require it', () => {
    const host = paramHost([Number]);
    const route = aRoute({
      params: [{ type: 'header', name: 'X-Limit', object: host, method: 'getTokenById', index: 0 }],
    });
    expect(getHeaderParams(route)).toEqual([
      { in: 'header', name: 'X-Limit', required: false, schema: { type: 'number' } },
    ]);
  });

  it('applies the global paramOptions.required default unless opted out', () => {
    const host = paramHost([Boolean, String]);
    const route = aRoute({
      options: { defaults: { paramOptions: { required: true } } },
      params: [
        { type: 'header', name: 'X-Flag', object: host, method: 'getTokenById', index: 0 },
        {
          type: 'header',
          name: 'X-Optional',
          object: host,
          method: 'getTokenById',
          index: 1,
          required: false,
        },
      ],
    });
    const [flag, optional] = getHeaderParams(route);
    expect(flag).toEqual({
      in: 'header',
      name: 'X-Flag',
      required: true,
      schema: { type: 'boolean' },
    });
    expect(optional.required).toBe(false);
  });

  it('appends a headers object param as a schema reference named after the class', () => {
    const host = paramHost([OcpiHttpHeaders]);
    const route = aRoute({
      params: [
        {
          type: 'headers',
          object: host,
          method: 'getTokenById',
          index: 0,
          explicitType: OcpiHttpHeaders,
          required: true,
        },
      ],
    });
    expect(getHeaderParams(route)).toEqual([
      {
        in: 'header',
        name: 'OcpiHttpHeaders',
        required: true,
        schema: { $ref: '#/components/schemas/OcpiHttpHeaders' },
      },
    ]);
  });
});

describe('getRequestBody', () => {
  it('returns undefined when the route has no body param', () => {
    expect(getRequestBody(aRoute())).toBeUndefined();
  });

  it('returns undefined for a body param without schema metadata', () => {
    const host = paramHost([Object]);
    const route = aRoute({
      params: [{ type: 'body', object: host, method: 'getTokenById', index: 0 }],
    });
    expect(getRequestBody(route)).toBeUndefined();
  });

  it('resolves a custom-converter param carrying BODY_PARAM metadata to a single $ref', () => {
    const host = paramHost([Object]);
    const bodySchema = z.object({ uid: z.string() });
    Reflect.defineMetadata(
      BODY_PARAM,
      { schema: bodySchema, name: 'GenSpecBody' },
      host,
      'getTokenById.0',
    );
    const route = aRoute({
      params: [
        {
          type: 'custom-converter',
          object: host,
          method: 'getTokenById',
          index: 0,
          required: true,
        },
      ],
    });
    expect(getRequestBody(route)).toEqual({
      required: true,
      content: {
        'application/json': { schema: { $ref: '#/components/schemas/GenSpecBody' } },
      },
    });
    expect(SchemaStore.getSchema('GenSpecBody')).toMatchObject({ type: 'object' });
  });

  it('builds a oneOf body from MULTIPLE_TYPES metadata and registers each variant', () => {
    const host = paramHost([Object]);
    Reflect.defineMetadata(
      MULTIPLE_TYPES,
      [
        { name: 'GenSpecVariantA', schema: z.object({ a: z.string() }) },
        { name: 'GenSpecVariantB', schema: z.object({ b: z.number() }) },
      ],
      host,
      'getTokenById.0',
    );
    const route = aRoute({
      params: [{ type: 'body', object: host, method: 'getTokenById', index: 0 }],
    });
    expect(getRequestBody(route)).toEqual({
      required: false,
      content: {
        'application/json': {
          schema: {
            oneOf: [
              { $ref: '#/components/schemas/GenSpecVariantA' },
              { $ref: '#/components/schemas/GenSpecVariantB' },
            ],
          },
        },
      },
    });
    expect(SchemaStore.getSchema('GenSpecVariantB')).toMatchObject({ type: 'object' });
  });
});

describe('getPathParams', () => {
  it('builds string params from @Param metadata', () => {
    const host = paramHost([String]);
    const route = aRoute({
      params: [{ type: 'param', name: 'tokenId', object: host, method: 'getTokenById', index: 0 }],
    });
    expect(getPathParams(route)).toEqual([
      {
        in: 'path',
        name: 'tokenId',
        required: true,
        allowEmptyValue: false,
        schema: { type: 'string' },
      },
    ]);
  });

  it('uses an enum $ref when ENUM_PARAM metadata is present', () => {
    const host = paramHost([String]);
    Reflect.defineMetadata(ENUM_PARAM, 'ModuleId', host, 'getTokenById.moduleId');
    const route = aRoute({
      action: {
        target: TokensController,
        method: 'getTokenById',
        route: '/:moduleId',
        type: 'get',
      },
      params: [{ type: 'param', name: 'moduleId', object: host, method: 'getTokenById', index: 0 }],
    });
    expect(getPathParams(route)).toEqual([
      {
        in: 'path',
        name: 'moduleId',
        required: true,
        schema: { $ref: '#/components/schemas/ModuleId' },
      },
    ]);
  });

  it('derives params from path tokens when no @Param metadata exists', () => {
    const route = aRoute({
      action: {
        target: TokensController,
        method: 'getTokenById',
        route: '/:tokenId/details/:field?',
        type: 'get',
      },
    });
    const params = getPathParams(route);
    expect(params).toHaveLength(2);
    expect(params[0]).toMatchObject({ in: 'path', name: 'tokenId', required: true });
    expect(params[1]).toMatchObject({ in: 'path', name: 'field', required: false });
  });

  it('keeps a custom token regex as the schema pattern', () => {
    const route = aRoute({
      action: {
        target: TokensController,
        method: 'getTokenById',
        route: '/report/:year(\\d{4})',
        type: 'get',
      },
    });
    const [param] = getPathParams(route);
    expect(param.schema).toEqual({ pattern: '\\d{4}', type: 'string' });
  });
});

describe('getQueryParams', () => {
  it('maps a query param with its reflected type and required flag', () => {
    const host = paramHost([Number]);
    const route = aRoute({
      params: [{ type: 'query', name: 'limit', object: host, method: 'getTokenById', index: 0 }],
    });
    expect(getQueryParams(route, {})).toEqual([
      { in: 'query', name: 'limit', required: false, schema: { type: 'number' } },
    ]);
  });

  it('swaps in an enum $ref and registers the schema for ENUM_QUERY_PARAM metadata', () => {
    const host = paramHost([String]);
    Reflect.defineMetadata(
      ENUM_QUERY_PARAM,
      { name: 'GenSpecSortOrder', schema: z.enum(['asc', 'desc']) },
      host,
      'getTokenById.sort',
    );
    const route = aRoute({
      params: [
        {
          type: 'query',
          name: 'sort',
          object: host,
          method: 'getTokenById',
          index: 0,
          required: true,
        },
      ],
    });
    expect(getQueryParams(route, {})).toEqual([
      {
        in: 'query',
        name: 'sort',
        required: true,
        schema: { $ref: '#/components/schemas/GenSpecSortOrder' },
      },
    ]);
    expect(SchemaStore.getSchema('GenSpecSortOrder')).toMatchObject({ enum: ['asc', 'desc'] });
  });

  it('appends a queries object param named after its schema class', () => {
    const host = paramHost([PaginatedParams]);
    const route = aRoute({
      params: [
        {
          type: 'queries',
          object: host,
          method: 'getTokenById',
          index: 0,
          explicitType: PaginatedParams,
        },
      ],
    });
    expect(getQueryParams(route, {})).toEqual([
      {
        in: 'query',
        name: 'PaginatedParams',
        schema: { $ref: '#/components/schemas/PaginatedParams' },
      },
    ]);
  });
});

describe('getOperation', () => {
  it('assembles the operation and drops empty keywords', () => {
    const route = aRoute({
      action: { target: TokensController, method: 'getTokenById', route: '', type: 'get' },
    });
    expect(getOperation(route, {})).toEqual({
      operationId: 'TokensController.getTokenById',
      responses: {
        '200': {
          content: { 'application/json': {} },
          description: 'Successful response',
        },
      },
      summary: 'Get token by id',
      tags: ['Tokens'],
    });
  });

  it('adds a security requirement when an Authorization header param exists', () => {
    const host = paramHost([String]);
    const route = aRoute({
      action: { target: TokensController, method: 'getTokenById', route: '', type: 'get' },
      params: [
        {
          type: 'header',
          name: 'Authorization',
          object: host,
          method: 'getTokenById',
          index: 0,
          required: true,
        },
      ],
    });
    const operation = getOperation(route, {});
    expect(operation.security).toEqual([{ authorization: [] }]);
    expect(operation.parameters).toEqual([
      { in: 'header', name: 'Authorization', required: true, schema: { type: 'string' } },
    ]);
  });
});

describe('getPaths', () => {
  it('merges operations of different verbs on the same path', () => {
    const getRoute = aRoute();
    const putRoute = aRoute({
      action: { target: TokensController, method: 'getTokenById', route: '/:tokenId', type: 'put' },
    });
    const paths = getPaths([getRoute, putRoute], {});
    expect(Object.keys(paths)).toEqual(['/tokens/{tokenId}']);
    expect(Object.keys(paths['/tokens/{tokenId}'])).toEqual(['get', 'put']);
    expect(paths['/tokens/{tokenId}'].get.operationId).toBe('TokensController.getTokenById');
  });
});

describe('getSpec', () => {
  it('wraps the paths in an OpenAPI 3.0.0 document', () => {
    const spec = getSpec([aRoute()], {});
    expect(spec.openapi).toBe('3.0.0');
    expect(spec.info).toEqual({ title: '', version: '2.0.1' });
    expect(spec.components).toEqual({ schemas: {} });
    expect(Object.keys(spec.paths)).toEqual(['/tokens/{tokenId}']);
  });
});

describe('mergeDeep', () => {
  it('merges nested objects across multiple sources', () => {
    expect(mergeDeep({ a: { b: 1 } }, { a: { c: 2 } }, { d: 3 })).toEqual({
      a: { b: 1, c: 2 },
      d: 3,
    });
  });

  it('mutates and returns the target object', () => {
    const target = { a: 1 };
    const result = mergeDeep(target, { b: 2 });
    expect(result).toBe(target);
    expect(target).toEqual({ a: 1, b: 2 });
  });

  it('merges arrays index by index, keeping longer target tails', () => {
    expect(mergeDeep({ arr: [1, 2, 3] }, { arr: [9] })).toEqual({ arr: [9, 2, 3] });
  });

  it('deep-merges objects inside arrays by index', () => {
    expect(mergeDeep({ list: [{ a: 1 }, { b: 2 }] }, { list: [{ c: 3 }] })).toEqual({
      list: [{ a: 1, c: 3 }, { b: 2 }],
    });
  });
});

describe('smartcase', () => {
  it('splits camelCase into capitalized words', () => {
    expect(smartcase('getTokenById')).toBe('Get Token By Id');
  });

  it('splits kebab-case and snake_case', () => {
    expect(smartcase('post-async')).toBe('Post Async');
    expect(smartcase('charging_profiles')).toBe('Charging Profiles');
  });

  it('keeps all-caps words and separates trailing digits', () => {
    expect(smartcase('__FOO_BAR__')).toBe('FOO BAR');
    expect(smartcase('ocpiCredentials2')).toBe('Ocpi Credentials 2');
  });

  it('returns an empty string unchanged', () => {
    expect(smartcase('')).toBe('');
  });
});

describe('capitalize', () => {
  it('uppercases the first character and lowercases the rest', () => {
    expect(capitalize('hello WORLD')).toBe('Hello world');
  });

  it('handles a single character', () => {
    expect(capitalize('x')).toBe('X');
  });

  it('returns an empty string unchanged', () => {
    expect(capitalize('')).toBe('');
  });
});
