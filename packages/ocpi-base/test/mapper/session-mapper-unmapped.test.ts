// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { TariffDto, TransactionDto } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// LocationsService is a typedi-decorated service sitting on an import cycle with this mapper.
// Mapping from maps that are already populated never reaches it.
vi.mock('../../src/services/locations-service.js', () => ({ LocationsService: class {} }));

import { SessionMapper } from '../../src/mapper/session-mapper.js';
import type { LocationDTO } from '../../src/model/dto/location-dto.js';
import type { TokenDTO } from '../../src/model/dto/token-dto.js';

function aTransaction(transactionId: string): TransactionDto {
  return {
    id: transactionId,
    transactionId,
    startTime: '2026-08-20T10:00:00Z',
    endTime: '2026-08-20T11:00:00Z',
    totalKwh: 50,
    connectorId: 1,
    evseId: 1,
    ocppConnectionName: 'cs-001',
    updatedAt: new Date('2026-08-20T11:00:00Z'),
    meterValues: [],
  } as unknown as TransactionDto;
}

const aLocation = { id: 'loc-1', country_code: 'GB', party_id: 'VLT' } as LocationDTO;
const aToken = { uid: 'token-1' } as TokenDTO;
const aTariff = { id: 7, currency: 'GBP', pricePerKwh: 0.45 } as TariffDto;

describe('SessionMapper.mapTransactionsToSessionsHelper', () => {
  it('reports the transactions it dropped, and why', async () => {
    // CdrsService counts transactions with an aggregate and maps the page separately, so anything
    // dropped here leaves total higher than the number of records returned. At debug level nobody
    // sees which records went missing.
    const logger = new Logger({ type: 'hidden' });
    const warn = vi.spyOn(logger, 'warn');
    const mapper = new SessionMapper({
      logger: logger,
      locationsService: {},
      ocpiGraphqlClient: {},
    } as never);

    const sessions = await mapper.mapTransactionsToSessionsHelper(
      [aTransaction('tx-1'), aTransaction('tx-2')],
      new Map([['tx-1', aLocation]]),
      new Map([['tx-1', aToken]]),
      new Map([['tx-1', aTariff]]),
    );

    expect(sessions).toHaveLength(1);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain('tx-2');
    expect(warn.mock.calls[0][0]).toMatch(/location/);
  });

  it('says nothing when every transaction maps', async () => {
    const logger = new Logger({ type: 'hidden' });
    const warn = vi.spyOn(logger, 'warn');
    const mapper = new SessionMapper({
      logger: logger,
      locationsService: {},
      ocpiGraphqlClient: {},
    } as never);

    await mapper.mapTransactionsToSessionsHelper(
      [aTransaction('tx-1')],
      new Map([['tx-1', aLocation]]),
      new Map([['tx-1', aToken]]),
      new Map([['tx-1', aTariff]]),
    );

    expect(warn).not.toHaveBeenCalled();
  });
});
