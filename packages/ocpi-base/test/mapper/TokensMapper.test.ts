// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AuthorizationStatusEnum } from '@citrineos/types';
import { describe, expect, it } from 'vitest';
import type { TokenDTO } from '../../src/model/DTO/TokenDTO.js';
import { TokenType } from '../../src/model/TokenType.js';
import { WhitelistType } from '../../src/model/WhitelistType.js';
import { TokensMapper } from '../../src/mapper/TokensMapper.js';

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
