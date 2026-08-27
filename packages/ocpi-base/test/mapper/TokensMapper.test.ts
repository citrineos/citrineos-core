// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AuthorizationStatusEnum, IdTokenEnum } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { Container } from 'typedi';
import { Logger } from 'tslog';
import type { TokenDTO } from '../../src/model/DTO/TokenDTO.js';
import { TokenType } from '../../src/model/TokenType.js';
import { WhitelistType } from '../../src/model/WhitelistType.js';
import { TokensMapper } from '../../src/mapper/TokensMapper.js';

// The mapper resolves its logger from the typedi container at call time.
Container.set(Logger, new Logger({ type: 'hidden' }));

// A full token as an eMSP would PUT. Individual specs pass a subset of these
// fields to mimic a partial PATCH body.
function aToken(overrides: Partial<TokenDTO> = {}): Partial<TokenDTO> {
  return {
    country_code: 'US',
    party_id: 'TST',
    uid: 'MYTOKEN001',
    type: TokenType.RFID,
    contract_id: 'USTSTC00000001',
    issuer: 'TestMobilitySolutions',
    valid: true,
    whitelist: WhitelistType.ALWAYS,
    language: 'en',
    last_updated: new Date('2026-08-12T10:00:00Z'),
    ...overrides,
  };
}

describe('TokensMapper.mapOcpiTokenToPartialOcppAuthorization', () => {
  it('leaves status undefined when `valid` is absent from a partial PATCH body', () => {
    // The ticket: a PATCH with only `language` must not touch the token's status.
    const result = TokensMapper.mapOcpiTokenToPartialOcppAuthorization({ language: 'en' });
    expect(result.status).toBeUndefined();
  });

  it('maps valid:true to Accepted', () => {
    const result = TokensMapper.mapOcpiTokenToPartialOcppAuthorization(aToken({ valid: true }));
    expect(result.status).toBe(AuthorizationStatusEnum.Accepted);
  });

  it('maps valid:false to Invalid (a deliberate block still works)', () => {
    const result = TokensMapper.mapOcpiTokenToPartialOcppAuthorization(aToken({ valid: false }));
    expect(result.status).toBe(AuthorizationStatusEnum.Invalid);
  });

  it('leaves realTimeAuth undefined when `whitelist` is absent (parallel already-correct field)', () => {
    const result = TokensMapper.mapOcpiTokenToPartialOcppAuthorization({ language: 'en' });
    expect(result.realTimeAuth).toBeUndefined();
  });
});

describe('TokensMapper token type mapping', () => {
  it('round-trips the four token types OCPI can express', () => {
    const pairs: Array<
      [TokenType, ReturnType<typeof TokensMapper.mapOcpiTokenTypeToOcppIdTokenType>]
    > = [
      [TokenType.RFID, IdTokenEnum.ISO14443],
      [TokenType.AD_HOC_USER, IdTokenEnum.Local],
      [TokenType.APP_USER, IdTokenEnum.Central],
      [TokenType.OTHER, IdTokenEnum.Other],
    ];

    for (const [ocpi, ocpp] of pairs) {
      expect(TokensMapper.mapOcpiTokenTypeToOcppIdTokenType(ocpi)).toBe(ocpp);
      expect(TokensMapper.mapOcppIdTokenTypeToOcpiTokenType(ocpp)).toBe(ocpi);
    }
  });

  it('maps Other without warning about it being unmapped', () => {
    // Other is what the forward mapping produces for TokenType.OTHER, so treating it as unmapped on
    // the way back warned on every ordinary token and buried the warning that matters - the one for
    // a type OCPI genuinely cannot carry, such as MacAddress.
    const warn = vi
      .spyOn(Container.get(Logger), 'warn')
      .mockImplementation(() => undefined as never);

    expect(TokensMapper.mapOcppIdTokenTypeToOcpiTokenType(IdTokenEnum.Other)).toBe(TokenType.OTHER);
    expect(warn).not.toHaveBeenCalled();

    warn.mockRestore();
  });

  it('warns and falls back to OTHER for a type OCPI cannot express', () => {
    const warn = vi
      .spyOn(Container.get(Logger), 'warn')
      .mockImplementation(() => undefined as never);

    // Autocharge enrols a vehicle by its MAC. OCPI has no equivalent token type, so a token pushed
    // or read over OCPI cannot carry it - vehicle enrolment has to go through another channel.
    expect(TokensMapper.mapOcppIdTokenTypeToOcpiTokenType(IdTokenEnum.MacAddress)).toBe(
      TokenType.OTHER,
    );
    expect(warn).toHaveBeenCalledOnce();

    warn.mockRestore();
  });
});
