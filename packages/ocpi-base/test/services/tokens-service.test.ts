// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AuthorizationStatusEnum, IdTokenEnum } from '@citrineos/types';
import type { RealTimeAuthorizationRequestBody } from '@citrineos/ocpp';
import { Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';
import { TokensMapper } from '../../src/mapper/tokens-mapper.js';
import { AuthorizationInfoAllowed } from '../../src/model/authorization-info-allowed.js';
import type { TokenDTO } from '../../src/model/dto/token-dto.js';
import { OcpiResponseStatusCode } from '../../src/model/ocpi-response.js';
import { TokenType } from '../../src/model/token-type.js';
import { WhitelistType } from '../../src/model/whitelist-type.js';
import { TokensService } from '../../src/services/tokens-service.js';
import type { TokensClientApi } from '../../src/trigger/tokens-client-api.js';

const LAST_UPDATED = new Date('2026-08-12T10:00:00.000Z');
const AUTH_TIMESTAMP = new Date('2026-08-19T12:00:00.000Z');

// A full token as an eMSP would PUT.
function aTokenDto(overrides: Partial<TokenDTO> = {}): TokenDTO {
  return {
    country_code: 'DE',
    party_id: 'MSP',
    uid: 'MYTOKEN001',
    type: TokenType.RFID,
    contract_id: 'DEMSPC00000001',
    issuer: 'TestMobility',
    valid: true,
    whitelist: WhitelistType.ALWAYS,
    language: 'en',
    last_updated: LAST_UPDATED,
    ...overrides,
  } as TokenDTO;
}

// An Authorizations row as Hasura returns it. eMAID and issuer entries are required by toDto.
function anAuthorizationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 11,
    idToken: 'MYTOKEN001',
    idTokenType: IdTokenEnum.ISO14443,
    tenantId: 1,
    tenantPartner: { id: 5, countryCode: 'DE', partyId: 'MSP' },
    groupAuthorization: null,
    additionalInfo: [
      { additionalIdToken: 'DEMSPC00000001', type: 'eMAID' },
      { additionalIdToken: 'TestMobility', type: 'issuer' },
    ],
    status: AuthorizationStatusEnum.Accepted,
    realTimeAuth: null,
    language1: 'en',
    groupAuthorizationId: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
  };
}

type Respond = (operation: string, variables: Record<string, unknown>) => unknown;

// The client stub routes on operation name, so one test can serve the read-then-write
// sequences upsertToken and patchToken make against the same mock.
function buildService(
  respond: Respond = () => ({ Authorizations: [] }),
  postTokenResult?: unknown,
) {
  const logger = new Logger({ type: 'hidden' });
  const request = vi.fn(async (document: unknown, variables?: unknown) => {
    const operation = /(?:query|mutation)\s+(\w+)/.exec(String(document))?.[1] ?? 'unknown';
    return respond(operation, (variables ?? {}) as Record<string, unknown>);
  });
  const postToken = vi.fn().mockResolvedValue(postTokenResult);
  const service = new TokensService({
    logger,
    ocpiGraphqlClient: { request } as never,
    tokensClientApi: { postToken } as unknown as TokensClientApi,
    tokensMapper: new TokensMapper({ logger } as never),
  } as never);
  return { service, request, postToken, logger };
}

function callTo(request: ReturnType<typeof vi.fn>, operation: string) {
  const call = request.mock.calls.find(([document]) => String(document).includes(`${operation}(`));
  if (!call) throw new Error(`no ${operation} request was made`);
  return { document: String(call[0]), variables: call[1] as Record<string, any> };
}

describe('TokensService.getToken', () => {
  it('reads the authorization scoped to the requesting party and maps it back to OCPI', async () => {
    const { service, request } = buildService(() => ({
      Authorizations: [anAuthorizationRow()],
    }));

    const token = await service.getToken({
      country_code: 'DE',
      party_id: 'MSP',
      uid: 'MYTOKEN001',
      type: TokenType.APP_USER,
    });

    expect(request).toHaveBeenCalledOnce();
    const { document, variables } = callTo(request, 'ReadAuthorizations');
    expect(variables).toEqual({
      idToken: 'MYTOKEN001',
      type: IdTokenEnum.Central,
      countryCode: 'DE',
      partyId: 'MSP',
    });
    expect(document).toContain(
      'TenantPartner: { countryCode: { _eq: $countryCode }, partyId: { _eq: $partyId } }',
    );
    expect(token).toMatchObject({
      uid: 'MYTOKEN001',
      country_code: 'DE',
      party_id: 'MSP',
      type: TokenType.RFID,
      contract_id: 'DEMSPC00000001',
      issuer: 'TestMobility',
      valid: true,
      whitelist: WhitelistType.ALWAYS,
    });
  });

  it('defaults an untyped request to RFID and reports a miss as undefined', async () => {
    const { service, request } = buildService();

    const token = await service.getToken({
      country_code: 'DE',
      party_id: 'MSP',
      uid: 'MYTOKEN001',
    });

    expect(callTo(request, 'ReadAuthorizations').variables.type).toBe(IdTokenEnum.ISO14443);
    expect(token).toBeUndefined();
  });

  it('warns once and returns the first row when the query matches several', async () => {
    const { service, logger } = buildService(() => ({
      Authorizations: [
        anAuthorizationRow(),
        anAuthorizationRow({
          id: 12,
          additionalInfo: [
            { additionalIdToken: 'DEMSPC00000002', type: 'eMAID' },
            { additionalIdToken: 'TestMobility', type: 'issuer' },
          ],
        }),
      ],
    }));
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined as never);

    const token = await service.getToken({
      country_code: 'DE',
      party_id: 'MSP',
      uid: 'MYTOKEN001',
    });

    expect(warn).toHaveBeenCalledOnce();
    expect(token?.contract_id).toBe('DEMSPC00000001');
  });
});

describe('TokensService.upsertToken', () => {
  it('updates in place when the token already exists', async () => {
    const { service, request } = buildService((operation) => {
      if (operation === 'GetAuthorizationByToken')
        return { Authorizations: [anAuthorizationRow()] };
      return { update_Authorizations: { returning: [anAuthorizationRow({ language1: 'de' })] } };
    });

    const token = await service.upsertToken(aTokenDto({ language: 'de' }), 1, 5);

    expect(request).toHaveBeenCalledTimes(2);
    expect(callTo(request, 'GetAuthorizationByToken').variables).toEqual({
      idToken: 'MYTOKEN001',
      idTokenType: IdTokenEnum.ISO14443,
      tenantPartnerId: 5,
    });
    // whitelist ALWAYS maps to realTimeAuth null, an explicit clear rather than an omission.
    expect(callTo(request, 'UpdateAuthorization').variables).toEqual({
      idToken: 'MYTOKEN001',
      type: IdTokenEnum.ISO14443,
      tenantPartnerId: 5,
      set: {
        additionalInfo: [
          { additionalIdToken: 'DEMSPC00000001', type: 'eMAID' },
          { additionalIdToken: 'TestMobility', type: 'issuer' },
        ],
        status: AuthorizationStatusEnum.Accepted,
        language1: 'de',
        realTimeAuth: null,
        updatedAt: LAST_UPDATED,
      },
    });
    expect(token.language).toBe('de');
  });

  it('creates the authorization when the token is new', async () => {
    const { service, request } = buildService((operation) => {
      if (operation === 'GetAuthorizationByToken') return { Authorizations: [] };
      return { insert_Authorizations_one: anAuthorizationRow() };
    });

    const token = await service.upsertToken(aTokenDto(), 1, 5);

    expect(callTo(request, 'CreateAuthorization').variables).toEqual({
      tenantId: 1,
      tenantPartnerId: 5,
      idToken: 'MYTOKEN001',
      idTokenType: IdTokenEnum.ISO14443,
      additionalInfo: [
        { additionalIdToken: 'DEMSPC00000001', type: 'eMAID' },
        { additionalIdToken: 'TestMobility', type: 'issuer' },
      ],
      status: AuthorizationStatusEnum.Accepted,
      language1: 'en',
      realTimeAuth: null,
      createdAt: LAST_UPDATED,
      updatedAt: LAST_UPDATED,
    });
    expect(token.uid).toBe('MYTOKEN001');
  });

  it('links an existing group authorization by id', async () => {
    const { service, request } = buildService((operation) => {
      if (operation === 'GetAuthorizationByToken') return { Authorizations: [] };
      if (operation === 'GetGroupAuthorization')
        return {
          Authorizations: [{ id: 42, idToken: 'GROUP01', idTokenType: IdTokenEnum.Central }],
        };
      return {
        insert_Authorizations_one: anAuthorizationRow({
          groupAuthorizationId: 42,
          groupAuthorization: { idToken: 'GROUP01' },
        }),
      };
    });

    const token = await service.upsertToken(aTokenDto({ group_id: 'GROUP01' }), 1, 5);

    expect(callTo(request, 'GetGroupAuthorization').variables).toEqual({
      groupId: 'GROUP01',
      tenantPartnerId: 5,
    });
    expect(callTo(request, 'CreateAuthorization').variables).toMatchObject({
      groupAuthorizationId: 42,
    });
    expect(token.group_id).toBe('GROUP01');
  });

  it('creates a Central placeholder for an unknown group before creating the token', async () => {
    const { service, request } = buildService((operation, variables) => {
      if (operation === 'GetAuthorizationByToken') return { Authorizations: [] };
      if (operation === 'GetGroupAuthorization') return { Authorizations: [] };
      if (variables.idToken === 'GROUP01') return { insert_Authorizations_one: { id: 77 } };
      return {
        insert_Authorizations_one: anAuthorizationRow({
          groupAuthorizationId: 77,
          groupAuthorization: { idToken: 'GROUP01' },
        }),
      };
    });

    await service.upsertToken(aTokenDto({ group_id: 'GROUP01' }), 1, 5);

    const creates = request.mock.calls.filter(([document]) =>
      String(document).includes('CreateAuthorization('),
    );
    expect(creates).toHaveLength(2);
    // The placeholder is not a usable token: Central type, Invalid status.
    expect(creates[0][1]).toMatchObject({
      idToken: 'GROUP01',
      idTokenType: IdTokenEnum.Central,
      status: AuthorizationStatusEnum.Invalid,
      tenantId: 1,
      tenantPartnerId: 5,
    });
    expect(creates[1][1]).toMatchObject({
      idToken: 'MYTOKEN001',
      groupAuthorizationId: 77,
    });
  });
});

describe('TokensService.patchToken', () => {
  it('rejects a PATCH without last_updated before touching the store', async () => {
    const { service, request } = buildService();

    await expect(
      service.patchToken('MYTOKEN001', TokenType.RFID, { language: 'de' }, 1, 5),
    ).rejects.toThrow(/Tokens PATCH must contain last_updated/);
    expect(request).not.toHaveBeenCalled();
  });

  it('rejects an unknown token without issuing the update', async () => {
    const { service, request } = buildService(() => ({ Authorizations: [] }));

    await expect(
      service.patchToken(
        'MYTOKEN001',
        TokenType.RFID,
        { language: 'de', last_updated: LAST_UPDATED },
        1,
        5,
      ),
    ).rejects.toThrow(/Unknown token MYTOKEN001:RFID/);
    expect(request).toHaveBeenCalledOnce();
  });

  it('writes only the provided fields, leaving status untouched', async () => {
    const { service, request } = buildService((operation) => {
      if (operation === 'GetAuthorizationByToken')
        return { Authorizations: [anAuthorizationRow()] };
      return { update_Authorizations: { returning: [anAuthorizationRow({ language1: 'de' })] } };
    });

    const token = await service.patchToken(
      'MYTOKEN001',
      TokenType.RFID,
      { language: 'de', last_updated: LAST_UPDATED },
      1,
      5,
    );

    expect(callTo(request, 'UpdateAuthorization').variables).toEqual({
      idToken: 'MYTOKEN001',
      type: IdTokenEnum.ISO14443,
      tenantPartnerId: 5,
      set: { updatedAt: LAST_UPDATED, language1: 'de' },
    });
    expect(token.language).toBe('de');
  });

  it('merges patched additionalInfo entries into the stored list by type', async () => {
    const { service, request } = buildService((operation) => {
      if (operation === 'GetAuthorizationByToken')
        return { Authorizations: [anAuthorizationRow()] };
      return {
        update_Authorizations: {
          returning: [
            anAuthorizationRow({
              additionalInfo: [
                { additionalIdToken: 'DEMSPC00000099', type: 'eMAID' },
                { additionalIdToken: 'TestMobility', type: 'issuer' },
              ],
            }),
          ],
        },
      };
    });

    const token = await service.patchToken(
      'MYTOKEN001',
      TokenType.RFID,
      { contract_id: 'DEMSPC00000099', last_updated: LAST_UPDATED },
      1,
      5,
    );

    // The issuer entry was not in the patch and keeps its stored value.
    expect(callTo(request, 'UpdateAuthorization').variables.set.additionalInfo).toEqual([
      { additionalIdToken: 'DEMSPC00000099', type: 'eMAID' },
      { additionalIdToken: 'TestMobility', type: 'issuer' },
    ]);
    expect(token.contract_id).toBe('DEMSPC00000099');
  });
});

describe('TokensService.realTimeAuthorization', () => {
  function aTenantPartner() {
    return {
      id: 5,
      countryCode: 'DE',
      partyId: 'MSP',
      partnerProfileOCPI: { endpoints: [] },
      tenantId: 1,
      tenant: { id: 1, countryCode: 'US', partyId: 'CPO', serverProfileOCPI: {} },
    };
  }

  function anAuthRequest(overrides: Record<string, unknown> = {}) {
    return {
      tenantPartnerId: 5,
      idToken: 'MYTOKEN001',
      idTokenType: IdTokenEnum.ISO14443,
      ocppConnectionName: 'cs-001',
      evseId: 1,
      connectorId: 1,
      ...overrides,
    } as RealTimeAuthorizationRequestBody;
  }

  function anAllowedPostTokenResult(overrides: Record<string, unknown> = {}) {
    return {
      status_code: OcpiResponseStatusCode.GenericSuccessCode,
      timestamp: AUTH_TIMESTAMP,
      data: { allowed: AuthorizationInfoAllowed.Allowed, info: { language: 'en', text: 'ok' } },
      ...overrides,
    };
  }

  it('rejects an unknown tenant partner without calling the eMSP', async () => {
    const { service, postToken } = buildService(() => ({ TenantPartners_by_pk: null }));

    await expect(service.realTimeAuthorization(anAuthRequest())).rejects.toThrow(
      /Unknown tenant partner 5/,
    );
    expect(postToken).not.toHaveBeenCalled();
  });

  it('rejects when the station is unknown at the given location', async () => {
    const { service, postToken } = buildService((operation) => {
      if (operation === 'GetTenantPartnerById') return { TenantPartners_by_pk: aTenantPartner() };
      return { ChargingStations: [] };
    });

    await expect(service.realTimeAuthorization(anAuthRequest({ locationId: '3' }))).rejects.toThrow(
      /Unknown charging station cs-001 at location 3/,
    );
    expect(postToken).not.toHaveBeenCalled();
  });

  it('posts the token to the eMSP addressed by the tenant partner', async () => {
    const partner = aTenantPartner();
    const { service, postToken } = buildService(
      () => ({ TenantPartners_by_pk: partner }),
      anAllowedPostTokenResult(),
    );

    const response = await service.realTimeAuthorization(anAuthRequest());

    expect(postToken).toHaveBeenCalledOnce();
    // from = the CPO tenant, to = the eMSP partner; no location filter without a locationId.
    expect(postToken).toHaveBeenCalledWith(
      'US',
      'CPO',
      'DE',
      'MSP',
      partner.partnerProfileOCPI,
      'MYTOKEN001',
      TokenType.RFID,
      undefined,
    );
    expect(response).toEqual({
      timestamp: '2026-08-19T12:00:00.000Z',
      data: { allowed: AuthorizationInfoAllowed.Allowed, reason: 'ok' },
    });
  });

  it('builds the evse uid list for the station when a location is given', async () => {
    const { service, postToken } = buildService((operation) => {
      if (operation === 'GetTenantPartnerById') return { TenantPartners_by_pk: aTenantPartner() };
      return {
        ChargingStations: [
          { ocppConnectionName: 'cs-001', locationId: 3, evses: [{ id: 1 }, { id: 2 }] },
        ],
      };
    }, anAllowedPostTokenResult());

    const response = await service.realTimeAuthorization(anAuthRequest({ locationId: '3' }));

    expect(postToken.mock.calls[0][7]).toEqual({
      location_id: '3',
      evse_uids: ['cs-001::1', 'cs-001::2'],
    });
    expect(response.data.allowed).toBe(AuthorizationInfoAllowed.Allowed);
  });

  it('rejects when the eMSP answers with a non-success status code', async () => {
    const { service } = buildService(
      () => ({ TenantPartners_by_pk: aTenantPartner() }),
      anAllowedPostTokenResult({ status_code: OcpiResponseStatusCode.ClientUnknownToken }),
    );

    await expect(service.realTimeAuthorization(anAuthRequest())).rejects.toThrow(
      /Failed to authorize token MYTOKEN001/,
    );
  });
});
