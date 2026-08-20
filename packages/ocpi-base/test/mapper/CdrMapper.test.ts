// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { AuthorizationDto, LocationDto, TariffDto, TransactionDto } from '@citrineos/types';
import { OCPP2_0_1 } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// LocationsService is a typedi-decorated service sitting on an import cycle with these mappers.
// Every transaction below carries its own location, so it is never reached.
vi.mock('../../src/services/LocationsService.js', () => ({ LocationsService: class {} }));

import { CdrMapper } from '../../src/mapper/CdrMapper.js';
import { SessionMapper } from '../../src/mapper/SessionMapper.js';

const UPDATED_AT = new Date('2026-08-20T11:00:00Z');

function aTariff(): TariffDto {
  return {
    id: 7,
    currency: 'GBP',
    pricePerKwh: 0.45,
    tenant: { countryCode: 'GB', partyId: 'VLT' },
    updatedAt: UPDATED_AT,
  } as unknown as TariffDto;
}

function aLocation(): LocationDto {
  return {
    id: 1,
    tenant: { countryCode: 'GB', partyId: 'VLT' },
    publishUpstream: true,
    name: 'Leeds Depot',
    address: '1 Depot Way',
    city: 'Leeds',
    postalCode: 'LS1 1AA',
    country: 'GBR',
    coordinates: { coordinates: [-1.5, 53.8] },
    timeZone: 'Europe/London',
    updatedAt: UPDATED_AT,
  } as unknown as LocationDto;
}

function anAuthorization(): AuthorizationDto {
  return {
    idToken: 'AA:BB:CC:DD:EE:FF',
    idTokenType: OCPP2_0_1.IdTokenEnumType.ISO14443,
    status: 'Accepted',
    updatedAt: UPDATED_AT,
    tenantPartner: { countryCode: 'GB', partyId: 'VLT' },
    additionalInfo: [
      { additionalIdToken: 'GB-VLT-C12345678-9', type: OCPP2_0_1.IdTokenEnumType.eMAID },
      { additionalIdToken: 'Voltempo', type: 'issuer' },
    ],
  } as unknown as AuthorizationDto;
}

function aTransaction(overrides: Partial<TransactionDto> = {}): TransactionDto {
  return {
    id: 1,
    transactionId: 'tx-1',
    isActive: false,
    startTime: '2026-08-20T10:00:00Z',
    endTime: '2026-08-20T11:00:00Z',
    totalKwh: 50,
    connectorId: 1,
    evseId: 1,
    ocppConnectionName: 'cs-001',
    locationId: 1,
    updatedAt: UPDATED_AT,
    meterValues: [],
    tenant: { countryCode: 'GB', partyId: 'VLT' },
    location: aLocation(),
    authorization: anAuthorization(),
    tariff: aTariff(),
    ...overrides,
  } as unknown as TransactionDto;
}

function cdrMapper(): CdrMapper {
  const logger = new Logger({ type: 'hidden' });
  const graphql = { request: async () => ({ Tariffs: [aTariff()] }) } as never;
  return new CdrMapper(
    logger,
    {} as never,
    graphql,
    new SessionMapper(logger, {} as never, graphql),
  );
}

describe('CdrMapper.mapTransactionsToCdrs', () => {
  it('maps a finished transaction', async () => {
    const cdrs = await cdrMapper().mapTransactionsToCdrs([aTransaction()]);

    expect(cdrs).toHaveLength(1);
    expect(cdrs[0].end_date_time).toEqual(new Date('2026-08-20T11:00:00Z'));
    expect(cdrs[0].total_time).toBe(1);
  });

  it('skips a transaction that was deactivated without ever being stopped', async () => {
    // deactivateActiveTransactionsByStationIdAndEvseId clears isActive on a stale transaction
    // when a new one starts on the same EVSE, and sets no endTime. end_date_time is required on a
    // CDR, so such a transaction is not billable and must not produce one.
    const abandoned = aTransaction({ endTime: null } as Partial<TransactionDto>);

    const cdrs = await cdrMapper().mapTransactionsToCdrs([abandoned]);

    expect(cdrs).toEqual([]);
  });
});
