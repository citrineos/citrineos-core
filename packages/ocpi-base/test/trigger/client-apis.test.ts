// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { IRequestOptions, IRestResponse } from 'typed-rest-client';
import { HttpMethod, type PartnerProfile } from '@citrineos/types';

import type { OcpiClientApiDependencies } from '../../src/dependencies.js';
import type { BaseClientApi } from '../../src/trigger/base-client-api.js';
import { MissingRequiredParamException } from '../../src/trigger/base-client-api.js';
import { CdrsClientApi } from '../../src/trigger/cdrs-client-api.js';
import { CommandsClientApi } from '../../src/trigger/commands-client-api.js';
import { CredentialsClientApi } from '../../src/trigger/credentials-client-api.js';
import { LocationsClientApi } from '../../src/trigger/locations-client-api.js';
import { SessionsClientApi } from '../../src/trigger/sessions-client-api.js';
import { TariffsClientApi } from '../../src/trigger/tariffs-client-api.js';
import { TokensClientApi } from '../../src/trigger/tokens-client-api.js';
import { VersionsClientApi } from '../../src/trigger/versions-client-api.js';
import { UnsuccessfulRequestException } from '../../src/exception/unsuccessful-request-exception.js';
import { EndpointIdentifier, VersionsInterface } from '../../src/model/endpoint-identifier.js';
import { ModuleId } from '../../src/model/module-id.js';
import { InterfaceRole } from '../../src/model/interface-role.js';
import { TokenType } from '../../src/model/token-type.js';
import { OcpiEmptyResponseSchema } from '../../src/model/ocpi-empty-response.js';
import { SessionResponseSchema } from '../../src/model/session.js';
import { TariffResponseSchema } from '../../src/model/tariff.js';
import { CdrResponseSchema } from '../../src/model/cdr.js';
import { CredentialsResponseSchema } from '../../src/model/credentials-response.js';
import { ConnectorResponseSchema } from '../../src/model/dto/connector-dto.js';
import { EvseResponseSchema } from '../../src/model/dto/evse-dto.js';
import { LocationResponseSchema } from '../../src/model/dto/location-dto.js';
import { PaginatedTokenResponseSchema } from '../../src/model/dto/token-dto.js';
import { AuthorizationInfoResponseSchema } from '../../src/model/authorization-info.js';
import { VersionListResponseDTOSchema } from '../../src/model/dto/version-list-response-dto.js';
import { VersionDetailsResponseDTOSchema } from '../../src/model/dto/version-details-response-dto.js';

const TOKEN = 'server-token-123';
const CDRS_URL = 'https://msp.example.com/ocpi/cdrs';
const LOCATIONS_URL = 'https://msp.example.com/ocpi/locations';
const SESSIONS_URL = 'https://msp.example.com/ocpi/sessions';
const TARIFFS_URL = 'https://msp.example.com/ocpi/tariffs';
const TOKENS_URL = 'https://msp.example.com/ocpi/tokens';
const CREDENTIALS_URL = 'https://msp.example.com/ocpi/credentials';
const VERSIONS_URL = 'https://msp.example.com/ocpi/versions';
const DETAILS_URL = 'https://msp.example.com/ocpi/2.2.1';

const RESULT = { parsed: true };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function aProfile(overrides: Record<string, unknown> = {}): PartnerProfile {
  return {
    credentials: { token: TOKEN, versionsUrl: VERSIONS_URL },
    version: { versionDetailsUrl: DETAILS_URL },
    endpoints: [
      { identifier: EndpointIdentifier.CREDENTIALS, url: CREDENTIALS_URL },
      { identifier: EndpointIdentifier.CDRS_RECEIVER, url: CDRS_URL },
      { identifier: EndpointIdentifier.LOCATIONS_RECEIVER, url: LOCATIONS_URL },
      { identifier: EndpointIdentifier.SESSIONS_RECEIVER, url: SESSIONS_URL },
      { identifier: EndpointIdentifier.TARIFFS_RECEIVER, url: TARIFFS_URL },
      { identifier: EndpointIdentifier.TOKENS_SENDER, url: TOKENS_URL },
    ],
    ...overrides,
  } as never;
}

function deps(graphqlResult?: unknown) {
  const gqlRequest = vi.fn().mockResolvedValue(graphqlResult);
  const dependencies = {
    logger: { debug: vi.fn() },
    ocpiGraphqlClient: { request: gqlRequest },
  } as unknown as OcpiClientApiDependencies;
  return { dependencies, gqlRequest };
}

// Captures the args each thin wrapper forwards into BaseClientApi.request.
function spyRequest(api: BaseClientApi) {
  return vi.spyOn(api, 'request').mockResolvedValue(RESULT);
}

type RawSpyable = {
  getRaw: (url: string, options?: IRequestOptions) => Promise<IRestResponse<unknown>>;
  createRaw: (
    url: string,
    body: unknown,
    options?: IRequestOptions,
  ) => Promise<IRestResponse<unknown>>;
  replaceRaw: (
    url: string,
    body: unknown,
    options?: IRequestOptions,
  ) => Promise<IRestResponse<unknown>>;
};

function restResponse(
  statusCode: number,
  result: unknown,
  headers: Record<string, string> = {},
): IRestResponse<unknown> {
  return { statusCode, result, headers } as IRestResponse<unknown>;
}

const EMPTY_OK = { status_code: 1000, timestamp: '2025-06-01T00:00:00.000Z' };

describe('getUrl endpoint selection', () => {
  const profile = aProfile();

  it('each module client resolves its own endpoint from the profile', () => {
    const { dependencies } = deps();
    expect(new CdrsClientApi(dependencies).getUrl(profile)).toBe(CDRS_URL);
    expect(new LocationsClientApi(dependencies).getUrl(profile)).toBe(LOCATIONS_URL);
    expect(new SessionsClientApi(dependencies).getUrl(profile)).toBe(SESSIONS_URL);
    expect(new TariffsClientApi(dependencies).getUrl(profile)).toBe(TARIFFS_URL);
    expect(new TokensClientApi(dependencies).getUrl(profile)).toBe(TOKENS_URL);
    expect(new CredentialsClientApi(dependencies).getUrl(profile)).toBe(CREDENTIALS_URL);
  });

  it('missing endpoint throws a module-specific error', () => {
    const { dependencies } = deps();
    const empty = aProfile({ endpoints: [] });
    expect(() => new CdrsClientApi(dependencies).getUrl(empty)).toThrow(/No CDR endpoint/);
    expect(() => new LocationsClientApi(dependencies).getUrl(empty)).toThrow(
      /No Locations endpoint/,
    );
    expect(() => new SessionsClientApi(dependencies).getUrl(empty)).toThrow(/No Session endpoint/);
    expect(() => new TariffsClientApi(dependencies).getUrl(empty)).toThrow(/No Tariffs endpoint/);
    expect(() => new TokensClientApi(dependencies).getUrl(empty)).toThrow(/No Tokens endpoint/);
  });

  it('credentials endpoint with an empty url raises MissingRequiredParamException', () => {
    const { dependencies } = deps();
    const blankUrl = aProfile({
      endpoints: [{ identifier: EndpointIdentifier.CREDENTIALS, url: '' }],
    });
    let caught: unknown;
    try {
      new CredentialsClientApi(dependencies).getUrl(blankUrl);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(MissingRequiredParamException);
    expect((caught as MissingRequiredParamException).field).toBe('credentials.url');
  });

  it('CommandsClientApi.getUrl always throws: the command supplies the url', () => {
    const api = new CommandsClientApi({
      ...deps().dependencies,
      cacheWrapper: { cache: { set: vi.fn() } },
    } as never);
    // MissingRequiredParamException(field, msg?) receives the text as `field`,
    // leaving message empty — only the error type is asserted here.
    expect(() => api.getUrl()).toThrow(MissingRequiredParamException);
  });

  it('VersionsClientApi picks versions vs details url by interface', () => {
    const api = new VersionsClientApi(deps().dependencies);
    expect(api.getUrl(profile)).toBe(VERSIONS_URL);
    expect(api.getUrl(profile, VersionsInterface.DETAILS)).toBe(DETAILS_URL);
  });
});

describe('LocationsClientApi', () => {
  const profile = aProfile();

  it('GET methods address nested cc/party/location/evse/connector paths', async () => {
    const api = new LocationsClientApi(deps().dependencies);
    const request = spyRequest(api);

    await api.getLocation('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1');
    await api.getEvse('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1', 'EVSE1');
    await api.getConnector('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1', 'EVSE1', '1');

    expect(request).toHaveBeenCalledTimes(3);
    expect(request).toHaveBeenNthCalledWith(
      1,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      LocationResponseSchema,
      profile,
      true,
      `${LOCATIONS_URL}/DE/CPO/LOC1`,
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      EvseResponseSchema,
      profile,
      true,
      `${LOCATIONS_URL}/DE/CPO/LOC1/EVSE1`,
    );
    expect(request).toHaveBeenNthCalledWith(
      3,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      ConnectorResponseSchema,
      profile,
      true,
      `${LOCATIONS_URL}/DE/CPO/LOC1/EVSE1/1`,
    );
  });

  it('PUT methods send the entity body to the object path', async () => {
    const api = new LocationsClientApi(deps().dependencies);
    const request = spyRequest(api);
    const location = { id: 'LOC1' } as never;
    const evse = { uid: 'EVSE1' } as never;
    const connector = { id: '1' } as never;

    const res = await api.putLocation('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1', location);
    await api.putEvse('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1', 'EVSE1', evse);
    await api.putConnector('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1', 'EVSE1', '1', connector);

    expect(res).toBe(RESULT);
    expect(request).toHaveBeenCalledTimes(3);
    expect(request).toHaveBeenNthCalledWith(
      1,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Put,
      OcpiEmptyResponseSchema,
      profile,
      true,
      `${LOCATIONS_URL}/DE/CPO/LOC1`,
      location,
    );
    expect(request.mock.calls[1][8]).toBe(`${LOCATIONS_URL}/DE/CPO/LOC1/EVSE1`);
    expect(request.mock.calls[1][9]).toBe(evse);
    expect(request.mock.calls[2][8]).toBe(`${LOCATIONS_URL}/DE/CPO/LOC1/EVSE1/1`);
    expect(request.mock.calls[2][9]).toBe(connector);
  });

  it('PATCH methods send partial bodies with the PATCH verb', async () => {
    const api = new LocationsClientApi(deps().dependencies);
    const request = spyRequest(api);
    const patch = { status: 'BLOCKED' } as never;

    await api.patchLocation('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1', patch);
    await api.patchEvse('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1', 'EVSE1', patch);
    await api.patchConnector('DE', 'CPO', 'NL', 'MSP', profile, 'LOC1', 'EVSE1', '1', patch);

    expect(request).toHaveBeenCalledTimes(3);
    for (const call of request.mock.calls) {
      expect(call[4]).toBe(HttpMethod.Patch);
      expect(call[5]).toBe(OcpiEmptyResponseSchema);
      expect(call[9]).toBe(patch);
    }
    expect(request.mock.calls.map((c) => c[8])).toEqual([
      `${LOCATIONS_URL}/DE/CPO/LOC1`,
      `${LOCATIONS_URL}/DE/CPO/LOC1/EVSE1`,
      `${LOCATIONS_URL}/DE/CPO/LOC1/EVSE1/1`,
    ]);
  });
});

describe('TariffsClientApi', () => {
  const profile = aProfile();

  it('getTariff targets cc/party/tariffId with the tariff schema', async () => {
    const api = new TariffsClientApi(deps().dependencies);
    const request = spyRequest(api);

    const res = await api.getTariff('DE', 'CPO', 'NL', 'MSP', profile, 'T1');

    expect(res).toBe(RESULT);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      TariffResponseSchema,
      profile,
      true,
      `${TARIFFS_URL}/DE/CPO/T1`,
    );
  });

  it('putTariff sends the tariff body, deleteTariff uses DELETE with the empty schema', async () => {
    const api = new TariffsClientApi(deps().dependencies);
    const request = spyRequest(api);
    const tariff = { id: 'T1', currency: 'EUR' } as never;

    await api.putTariff('DE', 'CPO', 'NL', 'MSP', profile, 'T1', tariff);
    await api.deleteTariff('DE', 'CPO', 'NL', 'MSP', profile, 'T1');

    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenNthCalledWith(
      1,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Put,
      TariffResponseSchema,
      profile,
      true,
      `${TARIFFS_URL}/DE/CPO/T1`,
      tariff,
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Delete,
      OcpiEmptyResponseSchema,
      profile,
      true,
      `${TARIFFS_URL}/DE/CPO/T1`,
    );
  });
});

describe('SessionsClientApi', () => {
  const profile = aProfile();

  it('getSession relies on the profile endpoint url and default routing headers', async () => {
    const api = new SessionsClientApi(deps().dependencies);
    const request = spyRequest(api);

    const res = await api.getSession('DE', 'CPO', 'NL', 'MSP', profile);

    expect(res).toBe(RESULT);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      SessionResponseSchema,
      profile,
    );
  });

  it('putSession and patchSession forward the body with no explicit url', async () => {
    const api = new SessionsClientApi(deps().dependencies);
    const request = spyRequest(api);
    const session = { id: 'S1' } as never;

    await api.putSession('DE', 'CPO', 'NL', 'MSP', profile, session);
    await api.patchSession('DE', 'CPO', 'NL', 'MSP', profile, { status: 'COMPLETED' } as never);

    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenNthCalledWith(
      1,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Put,
      OcpiEmptyResponseSchema,
      profile,
      true,
      undefined,
      session,
    );
    expect(request.mock.calls[1][4]).toBe(HttpMethod.Patch);
    expect(request.mock.calls[1][9]).toEqual({ status: 'COMPLETED' });
  });
});

describe('TokensClientApi', () => {
  const profile = aProfile();

  it('getTokens forwards pagination without overriding the endpoint url', async () => {
    const api = new TokensClientApi(deps().dependencies);
    const request = spyRequest(api);
    const paginated = { offset: 40, limit: 20 };

    await api.getTokens('DE', 'CPO', 'NL', 'MSP', profile, paginated as never);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      PaginatedTokenResponseSchema,
      profile,
      true,
      undefined,
      undefined,
      paginated,
    );
  });

  it('postToken authorizes at {tokenId}/authorize and passes type as a query param', async () => {
    const api = new TokensClientApi(deps().dependencies);
    const request = spyRequest(api);
    const references = { location_id: 'LOC1' } as never;

    await api.postToken('DE', 'CPO', 'NL', 'MSP', profile, 'TOK1', TokenType.RFID, references);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Post,
      AuthorizationInfoResponseSchema,
      profile,
      true,
      `${TOKENS_URL}/TOK1/authorize`,
      references,
      undefined,
      { type: TokenType.RFID },
    );
  });

  it('postToken without a token type sends no query params', async () => {
    const api = new TokensClientApi(deps().dependencies);
    const request = spyRequest(api);

    await api.postToken('DE', 'CPO', 'NL', 'MSP', profile, 'TOK1');

    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][8]).toBe(`${TOKENS_URL}/TOK1/authorize`);
    expect(request.mock.calls[0][11]).toBeUndefined();
  });
});

describe('CdrsClientApi', () => {
  const profile = aProfile();

  it('getCdr uses the url returned by the earlier POST verbatim', async () => {
    const api = new CdrsClientApi(deps().dependencies);
    const request = spyRequest(api);
    const cdrUrl = `${CDRS_URL}/abc-123`;

    await api.getCdr('DE', 'CPO', 'NL', 'MSP', profile, cdrUrl);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      CdrResponseSchema,
      profile,
      true,
      cdrUrl,
    );
  });

  it('postCdr posts the body against the receiver endpoint', async () => {
    const api = new CdrsClientApi(deps().dependencies);
    const request = spyRequest(api);
    const cdr = { id: 'CDR1' } as never;

    await api.postCdr('DE', 'CPO', 'NL', 'MSP', profile, cdr);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Post,
      OcpiEmptyResponseSchema,
      profile,
      true,
      undefined,
      cdr,
    );
  });
});

describe('CredentialsClientApi', () => {
  const profile = aProfile();

  it('getCredentials and deleteCredentials disable routing headers', async () => {
    const api = new CredentialsClientApi(deps().dependencies);
    const request = spyRequest(api);

    await api.getCredentials('DE', 'CPO', 'NL', 'MSP', profile);
    await api.deleteCredentials('DE', 'CPO', 'NL', 'MSP', profile);

    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenNthCalledWith(
      1,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      CredentialsResponseSchema,
      profile,
      false,
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Delete,
      OcpiEmptyResponseSchema,
      profile,
      false,
    );
  });

  it('postCredentials and putCredentials carry the credentials body', async () => {
    const api = new CredentialsClientApi(deps().dependencies);
    const request = spyRequest(api);
    const credentials = { token: 'their-token' } as never;

    await api.postCredentials('DE', 'CPO', 'NL', 'MSP', profile, credentials);
    await api.putCredentials('DE', 'CPO', 'NL', 'MSP', profile, credentials);

    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0][4]).toBe(HttpMethod.Post);
    expect(request.mock.calls[1][4]).toBe(HttpMethod.Put);
    for (const call of request.mock.calls) {
      expect(call[5]).toBe(CredentialsResponseSchema);
      expect(call[7]).toBe(false);
      expect(call[9]).toBe(credentials);
    }
  });
});

describe('VersionsClientApi', () => {
  const profile = aProfile();

  it('getVersions requests the given url without routing headers', async () => {
    const api = new VersionsClientApi(deps().dependencies);
    const request = spyRequest(api);

    await api.getVersions('DE', 'CPO', 'NL', 'MSP', profile, VERSIONS_URL);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      VersionListResponseDTOSchema,
      profile,
      false,
      VERSIONS_URL,
    );
  });

  it('getVersionDetails falls back to the profile versionDetailsUrl', async () => {
    const api = new VersionsClientApi(deps().dependencies);
    const request = spyRequest(api);

    await api.getVersionDetails('DE', 'CPO', 'NL', 'MSP', profile);

    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      VersionDetailsResponseDTOSchema,
      profile,
      false,
      DETAILS_URL,
    );
  });
});

describe('CommandsClientApi.postCommandResult', () => {
  it('marks the command resolved in cache and routes CPO -> eMSP', async () => {
    const set = vi.fn().mockResolvedValue(true);
    const api = new CommandsClientApi({
      ...deps().dependencies,
      cacheWrapper: { cache: { set } },
    } as never);
    const request = spyRequest(api);
    const profile = aProfile();
    const tenantPartner = {
      countryCode: 'NL',
      partyId: 'MSP',
      tenant: { countryCode: 'DE', partyId: 'CPO' },
      partnerProfileOCPI: profile,
    } as never;
    const body = { result: 'ACCEPTED' } as never;
    const responseUrl = 'https://msp.example.com/ocpi/commands/START_SESSION/cb-1';

    const res = await api.postCommandResult(tenantPartner, responseUrl, body, 'cmd-1');

    expect(res).toBe(RESULT);
    expect(set).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith('cmd-1', 'resolved', 'commands', 5);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Post,
      OcpiEmptyResponseSchema,
      profile,
      true,
      responseUrl,
      body,
    );
  });
});

describe('BaseClientApi.request wire behavior', () => {
  it('GET sends auth plus routing headers and parses the 2xx body', async () => {
    const api = new SessionsClientApi(deps().dependencies);
    const profile = aProfile();
    const getRaw = vi
      .spyOn(api as unknown as RawSpyable, 'getRaw')
      .mockResolvedValue(restResponse(200, EMPTY_OK));

    const res = await api.request(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      OcpiEmptyResponseSchema,
      profile,
    );

    expect(getRaw).toHaveBeenCalledTimes(1);
    expect(getRaw.mock.calls[0][0]).toBe(SESSIONS_URL);
    const headers = getRaw.mock.calls[0][1]!.additionalHeaders!;
    expect(headers['Authorization']).toBe(`Token ${Buffer.from(TOKEN).toString('base64')}`);
    expect(headers['OCPI-from-country-code']).toBe('DE');
    expect(headers['OCPI-from-party-id']).toBe('CPO');
    expect(headers['OCPI-to-country-code']).toBe('NL');
    expect(headers['OCPI-to-party-id']).toBe('MSP');
    expect(String(headers['X-Request-ID'])).toMatch(UUID_RE);
    expect(String(headers['X-Correlation-ID'])).toMatch(UUID_RE);
    expect(res.status_code).toBe(1000);
    expect(res.timestamp).toEqual(new Date('2025-06-01T00:00:00.000Z'));
  });

  it('routingHeaders=false omits the four OCPI routing headers', async () => {
    const api = new SessionsClientApi(deps().dependencies);
    const getRaw = vi
      .spyOn(api as unknown as RawSpyable, 'getRaw')
      .mockResolvedValue(restResponse(200, EMPTY_OK));

    await api.request(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      OcpiEmptyResponseSchema,
      aProfile(),
      false,
    );

    const headers = getRaw.mock.calls[0][1]!.additionalHeaders!;
    expect(Object.keys(headers).sort()).toEqual([
      'Authorization',
      'X-Correlation-ID',
      'X-Request-ID',
    ]);
  });

  it('PUT routes through the rest client replace with the body', async () => {
    const api = new SessionsClientApi(deps().dependencies);
    const profile = aProfile();
    const replaceRaw = vi
      .spyOn(api as unknown as RawSpyable, 'replaceRaw')
      .mockResolvedValue(restResponse(200, EMPTY_OK));
    const session = { id: 'S1' } as never;

    await api.putSession('DE', 'CPO', 'NL', 'MSP', profile, session);

    expect(replaceRaw).toHaveBeenCalledTimes(1);
    expect(replaceRaw.mock.calls[0][0]).toBe(SESSIONS_URL);
    expect(replaceRaw.mock.calls[0][1]).toBe(session);
  });

  it('pagination params become query params, response headers land on the result', async () => {
    const api = new SessionsClientApi(deps().dependencies);
    const pageSchema = z.object({
      data: z.array(z.number()),
      limit: z.number().optional(),
      total: z.number().optional(),
      link: z.string().optional(),
      offset: z.number().optional(),
    });
    const getRaw = vi.spyOn(api as unknown as RawSpyable, 'getRaw').mockResolvedValue(
      restResponse(
        200,
        { data: [1, 2, 3] },
        {
          link: '<https://msp.example.com/ocpi/sessions?offset=200&limit=100>; rel="next"',
          'x-total-count': '420',
          'x-limit': '100',
        },
      ),
    );

    const res = await api.request(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      pageSchema,
      aProfile(),
      true,
      undefined,
      undefined,
      {
        offset: 100,
        limit: 100,
        date_from: '2025-01-01T00:00:00.000Z',
        date_to: '2025-02-01T00:00:00.000Z',
      },
      { country_code: 'NL' },
    );

    expect(getRaw).toHaveBeenCalledTimes(1);
    expect(getRaw.mock.calls[0][1]!.queryParameters!.params).toEqual({
      country_code: 'NL',
      offset: 100,
      limit: 100,
      date_from: '2025-01-01T00:00:00.000Z',
      date_to: '2025-02-01T00:00:00.000Z',
    });
    expect(res).toEqual({
      data: [1, 2, 3],
      limit: 100,
      total: 420,
      link: 'https://msp.example.com/ocpi/sessions?offset=200&limit=100',
      offset: 200,
    });
  });

  it('non-2xx status rejects with UnsuccessfulRequestException carrying the response', async () => {
    const api = new SessionsClientApi(deps().dependencies);
    vi.spyOn(api as unknown as RawSpyable, 'getRaw').mockResolvedValue(
      restResponse(404, { message: 'not found' }),
    );

    const call = api.getSession('DE', 'CPO', 'NL', 'MSP', aProfile());

    await expect(call).rejects.toThrow(UnsuccessfulRequestException);
    await expect(api.getSession('DE', 'CPO', 'NL', 'MSP', aProfile())).rejects.toMatchObject({
      message: 'Request did not return a successful status code',
      iRestResponse: { statusCode: 404 },
    });
  });

  it('profile without a server token rejects before any HTTP call', async () => {
    const api = new SessionsClientApi(deps().dependencies);
    const getRaw = vi.spyOn(api as unknown as RawSpyable, 'getRaw');
    const noToken = aProfile({ credentials: {} });

    await expect(api.getSession('DE', 'CPO', 'NL', 'MSP', noToken)).rejects.toThrow(
      /TenantPartner missing server token/,
    );
    expect(getRaw).not.toHaveBeenCalled();
  });

  it('missing partner profile is fetched over graphql by cpo/client party', async () => {
    const profile = aProfile();
    const { dependencies, gqlRequest } = deps({
      TenantPartners: [{ partnerProfileOCPI: profile }],
    });
    const api = new SessionsClientApi(dependencies);
    const getRaw = vi
      .spyOn(api as unknown as RawSpyable, 'getRaw')
      .mockResolvedValue(restResponse(200, EMPTY_OK));

    const res = await api.request(
      'DE',
      'CPO',
      'NL',
      'MSP',
      HttpMethod.Get,
      OcpiEmptyResponseSchema,
    );

    expect(gqlRequest).toHaveBeenCalledTimes(1);
    expect(gqlRequest.mock.calls[0][1]).toEqual({
      cpoCountryCode: 'DE',
      cpoPartyId: 'CPO',
      clientCountryCode: 'NL',
      clientPartyId: 'MSP',
    });
    expect(getRaw.mock.calls[0][0]).toBe(SESSIONS_URL);
    expect(res.status_code).toBe(1000);
  });
});

describe('BaseClientApi.broadcastToClients', () => {
  it('requests each partner registered for the module_role endpoint', async () => {
    const profileA = aProfile();
    const profileB = aProfile();
    const { dependencies, gqlRequest } = deps({
      TenantPartners: [
        { countryCode: 'NL', partyId: 'MSA', partnerProfileOCPI: profileA },
        { countryCode: 'BE', partyId: 'MSB', partnerProfileOCPI: profileB },
      ],
    });
    const api = new SessionsClientApi(dependencies);
    const request = spyRequest(api);
    const session = { id: 'S1' } as never;

    const responses = await api.broadcastToClients({
      cpoCountryCode: 'DE',
      cpoPartyId: 'CPO',
      moduleId: ModuleId.Sessions,
      interfaceRole: InterfaceRole.RECEIVER,
      httpMethod: HttpMethod.Put,
      schema: OcpiEmptyResponseSchema,
      body: session,
      path: '/S1',
    });

    expect(gqlRequest).toHaveBeenCalledTimes(1);
    expect(gqlRequest.mock.calls[0][1]).toEqual({
      cpoCountryCode: 'DE',
      cpoPartyId: 'CPO',
      endpointIdentifier: 'sessions_RECEIVER',
    });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request).toHaveBeenNthCalledWith(
      1,
      'DE',
      'CPO',
      'NL',
      'MSA',
      HttpMethod.Put,
      OcpiEmptyResponseSchema,
      profileA,
      true,
      undefined,
      session,
      undefined,
      undefined,
      '/S1',
    );
    expect(request.mock.calls[1][2]).toBe('BE');
    expect(request.mock.calls[1][3]).toBe('MSB');
    expect(responses).toEqual([RESULT, RESULT]);
  });
});
