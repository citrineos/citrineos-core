// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AuthorizationDto,
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  IdTokenEnum,
  OCPP2_0_1,
} from '@citrineos/types';
import { type ILogObj, Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';
import type { TokenDTO } from '../../src/model/dto/token-dto.js';
import { TokenType } from '../../src/model/token-type.js';
import { WhitelistType } from '../../src/model/whitelist-type.js';
import { TokensMapper } from '../../src/mapper/tokens-mapper.js';

const logger = new Logger<ILogObj>({ type: 'hidden' });
const mapper = new TokensMapper({ logger });

const UPDATED_AT = new Date('2026-08-12T10:00:00Z');

function anAuthorization(overrides: Record<string, unknown> = {}): AuthorizationDto {
  return {
    idToken: 'MYTOKEN001',
    idTokenType: IdTokenEnum.ISO14443,
    status: AuthorizationStatusEnum.Accepted,
    updatedAt: UPDATED_AT,
    tenantPartner: { countryCode: 'US', partyId: 'TST' },
    additionalInfo: [
      { additionalIdToken: 'USTSTC00000001', type: OCPP2_0_1.IdTokenEnumType.eMAID },
      { additionalIdToken: 'DF000-2001-8999', type: 'visual_number' },
      { additionalIdToken: 'TestMobilitySolutions', type: 'issuer' },
    ],
    groupAuthorization: { idToken: 'GROUP01' },
    realTimeAuth: AuthorizationWhitelistEnum.Allowed,
    language1: 'en',
    ...overrides,
  } as unknown as AuthorizationDto;
}

describe('TokensMapper.toDto', () => {
  it('maps a complete authorization field by field', () => {
    const dto = mapper.toDto(anAuthorization());

    expect(dto).toEqual({
      country_code: 'US',
      party_id: 'TST',
      uid: 'MYTOKEN001',
      type: TokenType.RFID,
      contract_id: 'USTSTC00000001',
      visual_number: 'DF000-2001-8999',
      issuer: 'TestMobilitySolutions',
      group_id: 'GROUP01',
      valid: true,
      whitelist: WhitelistType.ALLOWED,
      language: 'en',
      last_updated: UPDATED_AT,
    });
  });

  it('any non-Accepted status maps to valid:false', () => {
    const dto = mapper.toDto(anAuthorization({ status: AuthorizationStatusEnum.Blocked }));
    expect(dto.valid).toBe(false);
  });

  it('leaves visual_number and group_id undefined when the source has neither', () => {
    const dto = mapper.toDto(
      anAuthorization({
        additionalInfo: [
          { additionalIdToken: 'USTSTC00000001', type: OCPP2_0_1.IdTokenEnumType.eMAID },
          { additionalIdToken: 'TestMobilitySolutions', type: 'issuer' },
        ],
        groupAuthorization: undefined,
      }),
    );
    expect(dto.visual_number).toBeUndefined();
    expect(dto.group_id).toBeUndefined();
  });

  it('missing idTokenType becomes OTHER without an unmapped warning', () => {
    // toDto normalizes undefined to null before mapping, which is the explicit
    // "no type" branch rather than the warning default.
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined as never);

    const dto = mapper.toDto(anAuthorization({ idTokenType: undefined }));
    expect(dto.type).toBe(TokenType.OTHER);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it('throws when additionalInfo has no eMAID entry', () => {
    expect(() =>
      mapper.toDto(
        anAuthorization({
          additionalInfo: [{ additionalIdToken: 'TestMobilitySolutions', type: 'issuer' }],
        }),
      ),
    ).toThrow('Contract ID not found in authorization additional info');
  });

  it('throws when additionalInfo has no issuer entry', () => {
    expect(() =>
      mapper.toDto(
        anAuthorization({
          additionalInfo: [
            { additionalIdToken: 'USTSTC00000001', type: OCPP2_0_1.IdTokenEnumType.eMAID },
          ],
        }),
      ),
    ).toThrow('Issuer not found in authorization additional info');
  });
});

describe('TokensMapper.mapOcpiTokenTypeToOcppIdTokenType', () => {
  it('throws for a value outside the OCPI token type enum', () => {
    expect(() => mapper.mapOcpiTokenTypeToOcppIdTokenType('EMAID' as TokenType)).toThrow(
      'Unknown token type: EMAID',
    );
  });
});

describe('TokensMapper whitelist mapping', () => {
  it('maps the three realTimeAuth values and defaults absent to ALWAYS', () => {
    expect(mapper.mapRealTimeEnumType(AuthorizationWhitelistEnum.Allowed)).toBe(
      WhitelistType.ALLOWED,
    );
    expect(mapper.mapRealTimeEnumType(AuthorizationWhitelistEnum.AllowedOffline)).toBe(
      WhitelistType.ALLOWED_OFFLINE,
    );
    expect(mapper.mapRealTimeEnumType(AuthorizationWhitelistEnum.Never)).toBe(WhitelistType.NEVER);
    expect(mapper.mapRealTimeEnumType(null)).toBe(WhitelistType.ALWAYS);
    expect(mapper.mapRealTimeEnumType(undefined)).toBe(WhitelistType.ALWAYS);
  });

  it('mapWhitelistType distinguishes ALWAYS (null clears) from absent (undefined leaves)', () => {
    expect(mapper.mapWhitelistType(WhitelistType.ALLOWED)).toBe(AuthorizationWhitelistEnum.Allowed);
    expect(mapper.mapWhitelistType(WhitelistType.ALLOWED_OFFLINE)).toBe(
      AuthorizationWhitelistEnum.AllowedOffline,
    );
    expect(mapper.mapWhitelistType(WhitelistType.NEVER)).toBe(AuthorizationWhitelistEnum.Never);
    expect(mapper.mapWhitelistType(WhitelistType.ALWAYS)).toBeNull();
    expect(mapper.mapWhitelistType(undefined)).toBeUndefined();
  });
});

describe('TokensMapper.mapOcpiTokenToPartialOcppAuthorization additionalInfo', () => {
  it('builds eMAID, visual_number and issuer entries in that order', () => {
    const result = mapper.mapOcpiTokenToPartialOcppAuthorization({
      contract_id: 'USTSTC00000001',
      visual_number: 'DF000-2001-8999',
      issuer: 'TestMobilitySolutions',
    });

    expect(result.additionalInfo).toEqual([
      { additionalIdToken: 'USTSTC00000001', type: OCPP2_0_1.IdTokenEnumType.eMAID },
      { additionalIdToken: 'DF000-2001-8999', type: 'visual_number' },
      { additionalIdToken: 'TestMobilitySolutions', type: 'issuer' },
    ]);
  });

  it('leaves additionalInfo undefined when no identifying fields are present', () => {
    const result = mapper.mapOcpiTokenToPartialOcppAuthorization({ language: 'en' });
    expect(result.additionalInfo).toBeUndefined();
  });

  it('whitelist ALWAYS clears realTimeAuth with an explicit null', () => {
    const result = mapper.mapOcpiTokenToPartialOcppAuthorization({
      whitelist: WhitelistType.ALWAYS,
    });
    expect(result.realTimeAuth).toBeNull();
  });
});

describe('TokensMapper GraphQL helpers', () => {
  it('toGraphqlWhere filters on uid, mapped token type and tenant partner', () => {
    const where = mapper.toGraphqlWhere({
      uid: 'MYTOKEN001',
      type: TokenType.APP_USER,
      country_code: 'US',
      party_id: 'TST',
    } as TokenDTO);

    expect(where).toEqual({
      idToken: { _eq: 'MYTOKEN001' },
      IdTokenType: { _eq: IdTokenEnum.Central },
      TenantPartner: {
        countryCode: { _eq: 'US' },
        partyId: { _eq: 'TST' },
      },
    });
  });

  it('toGraphqlSet is the partial-authorization mapping', () => {
    const set = mapper.toGraphqlSet({ uid: 'MYTOKEN001', valid: false });
    expect(set.idToken).toBe('MYTOKEN001');
    expect(set.status).toBe(AuthorizationStatusEnum.Invalid);
  });
});
