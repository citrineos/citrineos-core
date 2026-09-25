// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { AuthorizationStatusEnum, IdTokenEnum, OCPP2_0_1 } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { type ILogObj, Logger } from 'tslog';

import { TokensService } from '@ocpi/services/tokens-service.js';
import { TokensMapper } from '@ocpi/mappers/tokens-mapper.js';
import { TokenType } from '@ocpi/types/token-type.js';

const EMAID = { additionalIdToken: 'GBVLTC00000001', type: OCPP2_0_1.IdTokenEnumType.eMAID };
const ISSUER = { additionalIdToken: 'Volt Mobility', type: 'issuer' };

function aService() {
  const stored = {
    id: 9,
    idToken: 'TOKEN001',
    idTokenType: IdTokenEnum.ISO14443,
    additionalInfo: [{ ...EMAID }, { ...ISSUER }],
    status: AuthorizationStatusEnum.Accepted,
    tenantPartner: { countryCode: 'GB', partyId: 'VLT' },
    updatedAt: new Date('2026-08-20T10:00:00Z'),
  };
  const request = vi
    .fn()
    .mockResolvedValueOnce({ Authorizations: [stored] })
    .mockResolvedValue({ update_Authorizations: { returning: [stored] } });
  const logger = new Logger<ILogObj>({ type: 'hidden' });
  const service = new TokensService({
    logger,
    ocpiGraphqlClient: { request } as never,
    tokensClientApi: {} as never,
    tokensMapper: new TokensMapper({ logger }),
  });
  return { service, request };
}

function storedAdditionalInfo(request: ReturnType<typeof vi.fn>) {
  return request.mock.calls[1][1].set.additionalInfo;
}

describe('TokensService.patchToken additional info', () => {
  it('stores an additional-info entry of a type the token did not have yet', async () => {
    const { service, request } = aService();

    await service.patchToken(
      'TOKEN001',
      TokenType.RFID,
      { visual_number: 'V-0001', last_updated: new Date('2026-08-20T11:00:00Z') },
      1,
      2,
    );

    expect(storedAdditionalInfo(request)).toEqual([
      EMAID,
      ISSUER,
      { additionalIdToken: 'V-0001', type: 'visual_number' },
    ]);
  });

  it('replaces an entry of a type the token already has and keeps the others', async () => {
    const { service, request } = aService();

    await service.patchToken(
      'TOKEN001',
      TokenType.RFID,
      { contract_id: 'GBVLTC00000002', last_updated: new Date('2026-08-20T11:00:00Z') },
      1,
      2,
    );

    expect(storedAdditionalInfo(request)).toEqual([
      { ...EMAID, additionalIdToken: 'GBVLTC00000002' },
      ISSUER,
    ]);
  });
});
