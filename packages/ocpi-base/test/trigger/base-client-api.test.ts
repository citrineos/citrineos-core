// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';
import { z, ZodError } from 'zod';
import { HttpMethod } from '@citrineos/types';

const rest = vi.hoisted(() => ({
  userAgents: [] as string[],
  get: vi.fn(),
  del: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('typed-rest-client', () => ({
  RestClient: class {
    constructor(userAgent: string) {
      rest.userAgents.push(userAgent);
    }
    get = rest.get;
    del = rest.del;
    create = rest.create;
    update = rest.update;
    replace = rest.replace;
  },
}));

vi.mock('uuid', () => ({ v4: () => 'fixed-uuid' }));

import { BaseClientApi, MissingRequiredParamException } from '../../src/trigger/base-client-api.js';
import { UnsuccessfulRequestException } from '../../src/exception/unsuccessful-request-exception.js';
import { ModuleId } from '../../src/model/module-id.js';
import { InterfaceRole } from '../../src/model/interface-role.js';
import {
  GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT,
  LIST_TENANT_PARTNERS_BY_CPO,
} from '../../src/graphql/index.js';

const BASE_URL = 'https://msp.example.com/ocpi/emsp/2.2.1/cdrs';
const TOKEN = 'client-token';

const b64 = (s: string) => Buffer.from(s).toString('base64');

const idSchema = z.object({ id: z.string() });

class TestClientApi extends BaseClientApi {
  getUrl(): string {
    return BASE_URL;
  }
}

function aProfile(token: string | null = TOKEN) {
  return { credentials: token ? { token } : {} } as never;
}

function anApi(graphqlResult: unknown = { TenantPartners: [] }) {
  const graphqlRequest = vi.fn().mockResolvedValue(graphqlResult);
  const api = new TestClientApi({
    logger: new Logger({ type: 'hidden' }),
    ocpiGraphqlClient: { request: graphqlRequest } as never,
  });
  return { api, graphqlRequest };
}

function ok(result: unknown, headers: Record<string, string> = {}) {
  return { statusCode: 200, result, headers };
}

beforeEach(() => {
  vi.clearAllMocks();
  rest.userAgents.length = 0;
});

describe('constructor', () => {
  it('creates one RestClient named after the default CONTROLLER_PATH', () => {
    anApi();
    expect(rest.userAgents).toEqual(['CitrineOS OCPI null']);
  });
});

describe('request', () => {
  it('GET without a profile resolves the partner over graphql and joins path onto getUrl', async () => {
    rest.get.mockResolvedValue(ok({ id: 'abc' }));
    const { api, graphqlRequest } = anApi({
      TenantPartners: [{ partnerProfileOCPI: aProfile() }],
    });

    const result = await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Get,
      idSchema,
      undefined,
      true,
      undefined,
      undefined,
      undefined,
      undefined,
      '/cdr-1',
    );

    expect(graphqlRequest).toHaveBeenCalledOnce();
    expect(graphqlRequest).toHaveBeenCalledWith(GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT, {
      cpoCountryCode: 'US',
      cpoPartyId: 'CPO',
      clientCountryCode: 'DE',
      clientPartyId: 'MSP',
    });
    expect(rest.get).toHaveBeenCalledOnce();
    const [url, options] = rest.get.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/cdr-1`);
    expect(options.additionalHeaders).toEqual({
      'X-Request-ID': 'fixed-uuid',
      'X-Correlation-ID': 'fixed-uuid',
      Authorization: `Token ${b64(TOKEN)}`,
      'OCPI-from-country-code': 'US',
      'OCPI-from-party-id': 'CPO',
      'OCPI-to-country-code': 'DE',
      'OCPI-to-party-id': 'MSP',
    });
    expect(result).toEqual({ id: 'abc' });
  });

  it('explicit url bypasses getUrl; routingHeaders=false drops the OCPI routing headers', async () => {
    rest.get.mockResolvedValue(ok({ id: 'x' }));
    const { api, graphqlRequest } = anApi();

    await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Get,
      idSchema,
      aProfile(),
      false,
      'https://override.example.com/v2',
      undefined,
      undefined,
      undefined,
      '/9',
    );

    expect(graphqlRequest).not.toHaveBeenCalled();
    const [url, options] = rest.get.mock.calls[0];
    expect(url).toBe('https://override.example.com/v2/9');
    expect(Object.keys(options.additionalHeaders)).toEqual([
      'X-Request-ID',
      'X-Correlation-ID',
      'Authorization',
    ]);
  });

  it('paginated params serialize into query params with ISO dates, merged over otherParams', async () => {
    rest.get.mockResolvedValue(ok({ id: 'x' }));
    const { api } = anApi();

    await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Get,
      idSchema,
      aProfile(),
      true,
      undefined,
      undefined,
      {
        offset: 10,
        limit: 25,
        date_from: '2025-01-01T00:00:00Z',
        date_to: '2025-02-01T00:00:00Z',
      },
      { country_code: 'DE' },
    );

    expect(rest.get).toHaveBeenCalledOnce();
    expect(rest.get.mock.calls[0][1].queryParameters).toEqual({
      params: {
        country_code: 'DE',
        offset: 10,
        limit: 25,
        date_from: '2025-01-01T00:00:00.000Z',
        date_to: '2025-02-01T00:00:00.000Z',
      },
    });
  });

  it('POST routes through restClient.create with the body', async () => {
    rest.create.mockResolvedValue(ok({ id: 'created' }));
    const { api } = anApi();
    const body = { token_uid: 'T1' };

    const result = await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Post,
      idSchema,
      aProfile(),
      true,
      undefined,
      body,
    );

    expect(rest.create).toHaveBeenCalledOnce();
    expect(rest.create.mock.calls[0][0]).toBe(BASE_URL);
    expect(rest.create.mock.calls[0][1]).toBe(body);
    expect(result).toEqual({ id: 'created' });
  });

  it('PUT routes through restClient.replace with the body', async () => {
    rest.replace.mockResolvedValue(ok({ id: 'replaced' }));
    const { api } = anApi();
    const body = { status: 'ACTIVE' };

    const result = await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Put,
      idSchema,
      aProfile(),
      true,
      undefined,
      body,
    );

    expect(rest.replace).toHaveBeenCalledOnce();
    expect(rest.replace.mock.calls[0][0]).toBe(BASE_URL);
    expect(rest.replace.mock.calls[0][1]).toBe(body);
    expect(result).toEqual({ id: 'replaced' });
  });

  it('PATCH routes through restClient.update with the body', async () => {
    rest.update.mockResolvedValue(ok({ id: 'patched' }));
    const { api } = anApi();
    const body = { valid: false };

    const result = await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Patch,
      idSchema,
      aProfile(),
      true,
      undefined,
      body,
    );

    expect(rest.update).toHaveBeenCalledOnce();
    expect(rest.update.mock.calls[0][0]).toBe(BASE_URL);
    expect(rest.update.mock.calls[0][1]).toBe(body);
    expect(result).toEqual({ id: 'patched' });
  });

  it('DELETE routes through restClient.del without a body', async () => {
    rest.del.mockResolvedValue(ok({ id: 'gone' }));
    const { api } = anApi();

    const result = await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Delete,
      idSchema,
      aProfile(),
    );

    expect(rest.del).toHaveBeenCalledOnce();
    expect(rest.del.mock.calls[0][0]).toBe(BASE_URL);
    expect(result).toEqual({ id: 'gone' });
  });

  it('profile without a credentials token rejects before any HTTP call', async () => {
    const { api } = anApi();

    const err = await api
      .request('US', 'CPO', 'DE', 'MSP', HttpMethod.Get, idSchema, aProfile(null))
      .then(
        () => null,
        (e) => e,
      );

    expect(err).toBeInstanceOf(MissingRequiredParamException);
    expect(err.field).toBe('token');
    expect(err.message).toContain('TenantPartner missing server token');
    expect(rest.get).not.toHaveBeenCalled();
  });

  it('non-2xx status rejects with UnsuccessfulRequestException carrying the response', async () => {
    rest.get.mockResolvedValue({ statusCode: 404, result: null, headers: {} });
    const { api } = anApi();

    const err = await api
      .request('US', 'CPO', 'DE', 'MSP', HttpMethod.Get, idSchema, aProfile())
      .then(
        () => null,
        (e) => e,
      );

    expect(err).toBeInstanceOf(UnsuccessfulRequestException);
    expect(err.message).toBe('Request did not return a successful status code');
    expect(err.iRestResponse.statusCode).toBe(404);
  });

  it('2xx body failing the zod schema rejects with a ZodError naming the bad field', async () => {
    rest.get.mockResolvedValue(ok({ id: 42 }));
    const { api } = anApi();

    const err = await api
      .request('US', 'CPO', 'DE', 'MSP', HttpMethod.Get, idSchema, aProfile())
      .then(
        () => null,
        (e) => e,
      );

    expect(err).toBeInstanceOf(ZodError);
    expect(err.issues[0].code).toBe('invalid_type');
    expect(err.issues[0].path).toEqual(['id']);
  });

  it('paginated body gains limit/total/link/offset from the response headers', async () => {
    const pageSchema = z.object({
      data: z.array(z.string()),
      limit: z.number().optional(),
      total: z.number().optional(),
      link: z.string().optional(),
      offset: z.number().optional(),
    });
    rest.get.mockResolvedValue(
      ok(
        { data: ['a'] },
        {
          link: '<https://msp.example.com/ocpi/cdrs?offset=50&limit=25>; rel="next"',
          'x-total-count': '100',
          'x-limit': '25',
        },
      ),
    );
    const { api } = anApi();

    const result = await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Get,
      pageSchema,
      aProfile(),
    );

    expect(result).toEqual({
      data: ['a'],
      limit: 25,
      total: 100,
      link: 'https://msp.example.com/ocpi/cdrs?offset=50&limit=25',
      offset: 50,
    });
  });

  it('link header without an offset query param yields offset 0', async () => {
    const pageSchema = z.object({
      data: z.array(z.string()),
      link: z.string().optional(),
      offset: z.number().optional(),
    });
    rest.get.mockResolvedValue(
      ok({ data: [] }, { link: '<https://msp.example.com/ocpi/cdrs?limit=25>; rel="next"' }),
    );
    const { api } = anApi();

    const result = await api.request(
      'US',
      'CPO',
      'DE',
      'MSP',
      HttpMethod.Get,
      pageSchema,
      aProfile(),
    );

    expect(result).toEqual({
      data: [],
      link: 'https://msp.example.com/ocpi/cdrs?limit=25',
      offset: 0,
    });
  });
});

describe('broadcastToClients', () => {
  it('fans out one request per partner from the list query', async () => {
    rest.get.mockResolvedValueOnce(ok({ id: 'first' })).mockResolvedValueOnce(ok({ id: 'second' }));
    const { api, graphqlRequest } = anApi({
      TenantPartners: [
        { countryCode: 'DE', partyId: 'MS1', partnerProfileOCPI: aProfile('t-1') },
        { countryCode: 'FR', partyId: 'MS2', partnerProfileOCPI: aProfile('t-2') },
      ],
    });

    const results = await api.broadcastToClients({
      cpoCountryCode: 'US',
      cpoPartyId: 'CPO',
      moduleId: ModuleId.Cdrs,
      interfaceRole: InterfaceRole.SENDER,
      httpMethod: HttpMethod.Get,
      schema: idSchema,
    });

    expect(graphqlRequest).toHaveBeenCalledOnce();
    expect(graphqlRequest).toHaveBeenCalledWith(LIST_TENANT_PARTNERS_BY_CPO, {
      cpoCountryCode: 'US',
      cpoPartyId: 'CPO',
      endpointIdentifier: 'cdrs_SENDER',
    });
    expect(rest.get).toHaveBeenCalledTimes(2);
    const firstHeaders = rest.get.mock.calls[0][1].additionalHeaders;
    const secondHeaders = rest.get.mock.calls[1][1].additionalHeaders;
    expect(firstHeaders['OCPI-to-party-id']).toBe('MS1');
    expect(firstHeaders.Authorization).toBe(`Token ${b64('t-1')}`);
    expect(secondHeaders['OCPI-to-party-id']).toBe('MS2');
    expect(secondHeaders.Authorization).toBe(`Token ${b64('t-2')}`);
    expect(results).toEqual([{ id: 'first' }, { id: 'second' }]);
  });

  it('returns an empty array when the CPO has no partners', async () => {
    const { api, graphqlRequest } = anApi({ TenantPartners: [] });

    const results = await api.broadcastToClients({
      cpoCountryCode: 'US',
      cpoPartyId: 'CPO',
      moduleId: ModuleId.Cdrs,
      interfaceRole: InterfaceRole.SENDER,
      httpMethod: HttpMethod.Get,
      schema: idSchema,
    });

    expect(graphqlRequest).toHaveBeenCalledOnce();
    expect(rest.get).not.toHaveBeenCalled();
    expect(results).toEqual([]);
  });
});
