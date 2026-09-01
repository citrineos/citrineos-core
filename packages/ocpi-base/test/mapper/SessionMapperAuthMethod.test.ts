// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { TariffDto, TransactionDto } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// LocationsService is a typedi-decorated service sitting on an import cycle with this mapper.
// Mapping from maps that are already populated never reaches it.
vi.mock('../../src/services/LocationsService.js', () => ({ LocationsService: class {} }));

import { SessionMapper } from '../../src/mapper/SessionMapper.js';
import { AuthMethod } from '../../src/model/AuthMethod.js';
import type { LocationDTO } from '../../src/model/DTO/LocationDTO.js';
import type { TokenDTO } from '../../src/model/DTO/TokenDTO.js';

const TRANSACTION_ID = 'tx-1';

async function authMethodOf(overrides: Partial<TransactionDto>): Promise<AuthMethod> {
  const mapper = new SessionMapper({
    logger: new Logger({ type: 'hidden' }),
    locationsService: {},
    ocpiGraphqlClient: {},
  } as never);
  const transaction = {
    id: 1,
    transactionId: TRANSACTION_ID,
    startTime: '2026-08-20T10:00:00Z',
    endTime: '2026-08-20T11:00:00Z',
    totalKwh: 50,
    connectorId: 1,
    evseId: 1,
    ocppConnectionName: 'cs-001',
    updatedAt: new Date('2026-08-20T11:00:00Z'),
    meterValues: [],
    ...overrides,
  } as unknown as TransactionDto;

  const sessions = await mapper.mapTransactionsToSessionsHelper(
    [transaction],
    new Map<string, LocationDTO>([
      [TRANSACTION_ID, { id: 'loc-1', country_code: 'GB', party_id: 'VLT' } as LocationDTO],
    ]),
    new Map<string, TokenDTO>([[TRANSACTION_ID, { uid: 'token-1' } as TokenDTO]]),
    new Map<string, TariffDto>([
      [TRANSACTION_ID, { id: 7, currency: 'GBP', pricePerKwh: 0.45 } as TariffDto],
    ]),
  );
  return sessions[0].auth_method;
}

describe('Session auth_method', () => {
  it('reports COMMAND for a session a RequestStartTransaction started', async () => {
    expect(await authMethodOf({ remoteStartId: 42 })).toBe(AuthMethod.COMMAND);
  });

  it('reports WHITELIST for a session the driver started at the charger', async () => {
    expect(await authMethodOf({ remoteStartId: null })).toBe(AuthMethod.WHITELIST);
  });
});
