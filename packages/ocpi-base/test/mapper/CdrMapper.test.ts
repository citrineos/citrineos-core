// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { AuthorizationDto, LocationDto, TariffDto, TransactionDto } from '@citrineos/types';
import { OCPP2_0_1 } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { type ILogObj, Logger } from 'tslog';

// LocationsService is a typedi-decorated service sitting on an import cycle with these mappers.
// Every transaction below carries its own location, so it is never reached.
vi.mock('../../src/services/LocationsService.js', () => ({ LocationsService: class {} }));

import { CdrMapper } from '../../src/mapper/CdrMapper.js';
import { ConnectorMapper, EvseMapper, LocationMapper } from '../../src/mapper/LocationMapper.js';
import { TokensMapper } from '../../src/mapper/TokensMapper.js';
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

function aMeterValue() {
  return {
    timestamp: '2026-08-20T10:30:00Z',
    sampledValue: [
      {
        measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
        unitOfMeasure: { unit: 'kWh' },
        value: 50,
      },
    ],
  };
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
    meterValues: [aMeterValue()],
    tenant: { countryCode: 'GB', partyId: 'VLT' },
    location: aLocation(),
    authorization: anAuthorization(),
    tariff: aTariff(),
    ...overrides,
  } as unknown as TransactionDto;
}

function cdrMapper(tariffLookup: TariffDto[] = [aTariff()]): CdrMapper {
  const logger = new Logger<ILogObj>({ type: 'hidden' });
  const graphql = { request: async () => ({ Tariffs: tariffLookup }) } as never;
  const connectorMapper = new ConnectorMapper({ logger });
  const evseMapper = new EvseMapper({ logger, connectorMapper });
  const locationMapper = new LocationMapper({ evseMapper });
  const tokensMapper = new TokensMapper({ logger });
  const deps = {
    logger,
    locationsService: {},
    ocpiGraphqlClient: graphql,
    locationMapper,
    tokensMapper,
  } as never;
  return new CdrMapper({ ...(deps as object), sessionMapper: new SessionMapper(deps) } as never);
}

describe('CdrMapper.mapTransactionsToCdrs', () => {
  it('maps a finished transaction', async () => {
    const cdrs = await cdrMapper().mapTransactionsToCdrs([aTransaction()]);

    expect(cdrs).toHaveLength(1);
    expect(cdrs[0].end_date_time).toEqual(new Date('2026-08-20T11:00:00Z'));
    expect(cdrs[0].total_time).toBe(1);
  });

  it('carries the charging periods the meter values produced', async () => {
    const cdrs = await cdrMapper().mapTransactionsToCdrs([aTransaction()]);

    expect(cdrs[0].charging_periods).toHaveLength(1);
    expect(cdrs[0].charging_periods[0]).toMatchObject({
      start_date_time: new Date('2026-08-20T10:30:00Z'),
      tariff_id: '7',
    });
  });

  it('drops a session that has no charging periods rather than inventing one', async () => {
    // OCPI requires at least one charging period on a CDR, and a station can deliver a whole
    // session without ever sending a meter value. Describing it as one period built from the
    // totals would read as measured detail that was never measured, so the session is left out
    // and the caller reports it as dropped.
    const unmetered = aTransaction({ meterValues: [] } as Partial<TransactionDto>);

    const cdrs = await cdrMapper().mapTransactionsToCdrs([unmetered]);

    expect(cdrs).toHaveLength(0);
  });

  it('leaves tariffs off the CDR when the tariff cannot be looked up', async () => {
    // The transaction carries its tariff, so the first lookup succeeds from the row itself while
    // the OCPI tariff query still finds nothing.
    const cdrs = await cdrMapper([]).mapTransactionsToCdrs([aTransaction()]);

    expect(cdrs[0].tariffs).toBeUndefined();
  });

  it('skips a transaction that was deactivated without ever being stopped', async () => {
    // deactivateActiveTransactionsByStationIdAndEvseId clears isActive on a stale transaction
    // when a new one starts on the same EVSE, and sets no endTime. end_date_time is required on a
    // CDR, so such a transaction is not billable and must not produce one.
    const abandoned = aTransaction({ endTime: null } as unknown as Partial<TransactionDto>);

    const cdrs = await cdrMapper().mapTransactionsToCdrs([abandoned]);

    expect(cdrs).toEqual([]);
  });
});
