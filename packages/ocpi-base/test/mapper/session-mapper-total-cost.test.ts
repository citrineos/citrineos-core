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
import { calculateTotalCdrCost } from '../../src/mapper/cdr-cost.js';
import type { LocationDTO } from '../../src/model/dto/location-dto.js';
import type { TokenDTO } from '../../src/model/dto/token-dto.js';

const TRANSACTION_ID = 'tx-1';

function mapper(): SessionMapper {
  return new SessionMapper({
    logger: new Logger({ type: 'hidden' }),
    locationsService: {},
    ocpiGraphqlClient: {},
  } as never);
}

/** An hour of charging: 50 kWh at 0.45, a 1.50 session fee, 0.02 a minute, 20% VAT. */
function aTariff(): TariffDto {
  return {
    id: 7,
    currency: 'GBP',
    pricePerKwh: 0.45,
    pricePerSession: 1.5,
    pricePerMin: 0.02,
    taxRate: 20,
  } as TariffDto;
}

function aCompletedTransaction(): TransactionDto {
  return {
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
  } as unknown as TransactionDto;
}

async function sessionFor(transaction: TransactionDto, tariff: TariffDto) {
  const sessions = await mapper().mapTransactionsToSessionsHelper(
    [transaction],
    new Map<string, LocationDTO>([
      [TRANSACTION_ID, { id: 'loc-1', country_code: 'GB', party_id: 'VLT' } as LocationDTO],
    ]),
    new Map<string, TokenDTO>([[TRANSACTION_ID, { uid: 'token-1' } as TokenDTO]]),
    new Map<string, TariffDto>([[TRANSACTION_ID, tariff]]),
  );
  return sessions[0];
}

describe('Session total_cost', () => {
  it('matches the total_cost of the CDR built from the same session', async () => {
    // DepotCharge reconciles a live session against the CDR that closes it. The two have to
    // agree, so the session has to be priced by the same rules the CDR is.
    const tariff = aTariff();

    const session = await sessionFor(aCompletedTransaction(), tariff);

    expect(session.total_cost).toEqual(calculateTotalCdrCost(session, tariff));
  });

  it('includes the session fee and the time component, not energy alone', async () => {
    const session = await sessionFor(aCompletedTransaction(), aTariff());

    // 50 kWh x 0.45 = 22.50, plus a 1.50 session fee, plus 60 min x 0.02 = 1.20.
    expect(session.total_cost?.excl_vat).toBe(25.2);
  });

  it('carries the VAT-inclusive amount when the tariff has a tax rate', async () => {
    const session = await sessionFor(aCompletedTransaction(), aTariff());

    expect(session.total_cost?.incl_vat).toBe(30.24);
  });

  it('leaves an unfinished session unpriced', async () => {
    const running = { ...aCompletedTransaction(), endTime: null } as unknown as TransactionDto;

    const session = await sessionFor(running, aTariff());

    expect(session.total_cost).toBeNull();
  });
});
