// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { AuthorizationDto, TransactionDto } from '@citrineos/types';
import { OCPP2_0_1 } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// LocationsService sits on an import cycle with this mapper.
// The batch token mapping never touches it, so a bare stub is enough to load the module.
vi.mock('../../src/services/locations-service.js', () => ({ LocationsService: class {} }));

import { BaseTransactionMapper } from '../../src/mapper/base-transaction-mapper.js';
import { TokensMapper } from '../../src/mapper/tokens-mapper.js';
import type { TokenDTO } from '../../src/model/dto/token-dto.js';

/**
 * Exposes the protected batch mapper. Nothing here reaches the GraphQL client: every transaction
 * already carries its authorization, so the lazy-load branch is never taken.
 */
class TestTransactionMapper extends BaseTransactionMapper {
  constructor() {
    const logger = new Logger({ type: 'hidden' });
    super({
      logger,
      locationsService: {},
      ocpiGraphqlClient: {},
      locationMapper: {},
      tokensMapper: new TokensMapper({ logger }),
    } as never);
  }

  public tokensFor(transactions: TransactionDto[]): Promise<Map<string, TokenDTO>> {
    return this.getTokensForTransactions(transactions);
  }
}

function anOcpiAuthorization(): AuthorizationDto {
  return {
    idToken: 'OCPI-TOKEN-1',
    idTokenType: OCPP2_0_1.IdTokenEnumType.ISO14443,
    status: 'Accepted',
    updatedAt: new Date().toISOString(),
    tenantPartner: { countryCode: 'GB', partyId: 'VLT' },
    additionalInfo: [
      { additionalIdToken: 'GB-VLT-C12345678-9', type: OCPP2_0_1.IdTokenEnumType.eMAID },
      { additionalIdToken: 'Voltempo', type: 'issuer' },
    ],
  } as unknown as AuthorizationDto;
}

/** A vehicle enrolled directly against CitrineOS - no OCPI provenance, so no additionalInfo. */
function aDepotVehicleAuthorization(): AuthorizationDto {
  return {
    idToken: 'AA:BB:CC:DD:EE:FF',
    idTokenType: OCPP2_0_1.IdTokenEnumType.MacAddress,
    status: 'Accepted',
    updatedAt: new Date().toISOString(),
    tenantPartner: { countryCode: 'GB', partyId: 'VLT' },
  } as unknown as AuthorizationDto;
}

function aTransaction(id: string, authorization: AuthorizationDto): TransactionDto {
  return { id, transactionId: id, authorization } as unknown as TransactionDto;
}

describe('TokensMapper.toDto on an authorization with no additionalInfo', () => {
  it('reports what is missing rather than dereferencing null', () => {
    // additionalInfo is nullable on AuthorizationDto, and every Authorization not created through
    // OCPI has it unset. The getters used a non-null assertion, so the descriptive errors below
    // them were unreachable and callers saw a TypeError instead.
    const tokensMapper = new TokensMapper({ logger: new Logger({ type: 'hidden' }) });
    expect(() => tokensMapper.toDto(aDepotVehicleAuthorization())).toThrowError(/Contract ID/i);
  });
});

describe('BaseTransactionMapper.getTokensForTransactions', () => {
  it('maps a transaction whose token came from OCPI', async () => {
    const tokens = await new TestTransactionMapper().tokensFor([
      aTransaction('tx-1', anOcpiAuthorization()),
    ]);

    expect(tokens.get('tx-1')?.contract_id).toBe('GB-VLT-C12345678-9');
  });

  it('skips an unmappable token instead of failing the whole batch', async () => {
    // A depot session started by a vehicle MAC has no eMAID to put in an OCPI cdr_token. The loop
    // already logs "Unmapped token for transaction" for that case, but toDto throws rather than
    // returning nothing, so one such session aborted the entire CDR or Session page.
    const tokens = await new TestTransactionMapper().tokensFor([
      aTransaction('tx-1', aDepotVehicleAuthorization()),
      aTransaction('tx-2', anOcpiAuthorization()),
    ]);

    expect(tokens.has('tx-1')).toBe(false);
    expect(tokens.get('tx-2')?.contract_id).toBe('GB-VLT-C12345678-9');
  });

  it('still raises anything other than a missing contract id', async () => {
    // Only an authorization that cannot carry a contract_id is left out. A genuine fault - here a
    // transaction whose partner never loaded - has to surface rather than be absorbed as one more
    // unmappable token.
    const brokenPartner = {
      ...anOcpiAuthorization(),
      tenantPartner: undefined,
    } as unknown as AuthorizationDto;

    await expect(
      new TestTransactionMapper().tokensFor([aTransaction('tx-broken', brokenPartner)]),
    ).rejects.toThrow();
  });
});
