// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Logger, type ILogObj } from 'tslog';
import type { ChargingStationDto, ConnectorDto, EvseDto, LocationDto } from '@citrineos/types';
import {
  ConnectorFormatEnum,
  ConnectorPowerTypeEnum,
  ConnectorStatusEnum,
  ConnectorTypeEnum,
} from '@citrineos/types';

import { LocationsService } from '../../src/services/locations-service.js';
import { ConnectorMapper, EvseMapper, LocationMapper } from '../../src/mapper/location-mapper.js';
import { OcpiHeaders } from '../../src/model/ocpi-headers.js';
import { PaginatedParams } from '../../src/controllers/param/paginated-params.js';
import { ConnectorType } from '../../src/model/connector-type.js';
import { EvseStatus } from '../../src/model/evse-status.js';

const UPDATED_AT = new Date('2026-08-20T11:00:00Z');

/**
 * Party scoping and date filters live in locations-service-party-scope.test.ts and
 * location-and-tariff-date-filters.test.ts. These tests cover the rest of the sender interface:
 * pagination, by-id hits and misses, the sub-lookups, and the two error shapes. The mappers are
 * the real ones, so a hit asserts the OCPI DTO, not a mock's return value.
 */
function aCapturingGraphqlClient(payload: Record<string, unknown>) {
  const request = vi.fn().mockResolvedValue(payload);
  return { client: { request } as never, request };
}

function aService(client: never) {
  const logger = new Logger<ILogObj>({ type: 'hidden' });
  const warn = vi.spyOn(logger, 'warn');
  const connectorMapper = new ConnectorMapper({ logger });
  const evseMapper = new EvseMapper({ logger, connectorMapper });
  const locationMapper = new LocationMapper({ evseMapper });
  const service = new LocationsService({
    logger,
    ocpiGraphqlClient: client,
    locationMapper,
    evseMapper,
    connectorMapper,
  } as never);
  return { service, warn };
}

function someHeaders(): OcpiHeaders {
  return { toCountryCode: 'GB', toPartyId: 'VLT' } as OcpiHeaders;
}

function documentFrom(request: ReturnType<typeof aCapturingGraphqlClient>['request']) {
  expect(request).toHaveBeenCalledOnce();
  return String(request.mock.calls[0][0]);
}

function aConnector(overrides: object = {}): ConnectorDto {
  return {
    id: 3,
    type: ConnectorTypeEnum.IEC62196T2,
    format: ConnectorFormatEnum.Cable,
    powerType: ConnectorPowerTypeEnum.AC3Phase,
    status: ConnectorStatusEnum.Available,
    maximumVoltage: 400,
    maximumAmperage: 32,
    maximumPowerWatts: 22000,
    tariff: { id: 7 },
    updatedAt: UPDATED_AT,
    ...overrides,
  } as unknown as ConnectorDto;
}

function anEvse(overrides: object = {}): EvseDto {
  return {
    id: 2,
    evseId: 'GB*VLT*E2',
    physicalReference: 'Bay 4',
    connectors: [aConnector()],
    updatedAt: UPDATED_AT,
    ...overrides,
  } as unknown as EvseDto;
}

function aStation(overrides: object = {}): ChargingStationDto {
  return {
    id: 'cs-001',
    ocppConnectionName: 'cs-001',
    coordinates: { coordinates: [-1.5, 53.8] },
    floorLevel: '-1',
    evses: [anEvse()],
    ...overrides,
  } as unknown as ChargingStationDto;
}

function aLocation(overrides: object = {}): LocationDto {
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
    chargingPool: [aStation()],
    updatedAt: UPDATED_AT,
    ...overrides,
  } as unknown as LocationDto;
}

describe('getLocations', () => {
  it('maps rows through the location mapper and echoes limit and offset', async () => {
    const { client, request } = aCapturingGraphqlClient({
      Locations: [aLocation()],
      Locations_aggregate: { aggregate: { count: 42 } },
    });
    const { service } = aService(client);

    const response = await service.getLocations(someHeaders(), {
      limit: 5,
      offset: 10,
    } as PaginatedParams);

    const document = documentFrom(request);
    expect(document).toContain('query GetLocations(');
    // total comes from the same where as the page, or X-Total-Count drifts from the rows
    expect(document).toContain('Locations_aggregate(where: $where)');
    expect(request.mock.calls[0][1]).toEqual({
      limit: 5,
      offset: 10,
      where: { Tenant: { countryCode: { _eq: 'GB' }, partyId: { _eq: 'VLT' } } },
    });
    expect(response.status_code).toBe(1000);
    expect(response.total).toBe(42);
    expect(response.limit).toBe(5);
    expect(response.offset).toBe(10);
    expect(response.data).toHaveLength(1);
    expect(response.data![0]).toMatchObject({
      id: '1',
      country_code: 'GB',
      party_id: 'VLT',
      name: 'Leeds Depot',
      coordinates: { longitude: '-1.50000', latitude: '53.80000' },
      last_updated: UPDATED_AT,
    });
    expect(response.data![0].evses![0].uid).toBe('cs-001::2');
  });

  it('falls back to limit 10 and offset 0 without params', async () => {
    const { client, request } = aCapturingGraphqlClient({
      Locations: [],
      Locations_aggregate: { aggregate: { count: 0 } },
    });
    const { service } = aService(client);

    const response = await service.getLocations(someHeaders());

    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0][1]).toMatchObject({ limit: 10, offset: 0 });
    expect(response.limit).toBe(10);
    expect(response.offset).toBe(0);
    expect(response.data).toEqual([]);
  });

  it('reports total 0 when the aggregate is missing', async () => {
    const { client } = aCapturingGraphqlClient({ Locations: [] });
    const { service } = aService(client);

    const response = await service.getLocations(someHeaders());

    expect(response.total).toBe(0);
    expect(response.status_code).toBe(1000);
  });

  it('propagates a transport failure to the caller', async () => {
    // Unlike the by-id reads, getLocations has no catch; the controller layer handles it.
    const request = vi.fn().mockRejectedValue(new Error('hasura down'));
    const { service } = aService({ request } as never);

    await expect(service.getLocations(someHeaders())).rejects.toThrow(/hasura down/);
    expect(request).toHaveBeenCalledOnce();
  });
});

describe('getLocationById', () => {
  it('returns the mapped location on a hit', async () => {
    const { client, request } = aCapturingGraphqlClient({ Locations: [aLocation()] });
    const { service, warn } = aService(client);

    const response = await service.getLocationById(someHeaders(), '7');

    expect(documentFrom(request)).toContain('query GetLocationById(');
    expect(response.status_code).toBe(1000);
    expect(response.data).toMatchObject({
      id: '1',
      country_code: 'GB',
      party_id: 'VLT',
      time_zone: 'Europe/London',
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric id without querying', async () => {
    const { client, request } = aCapturingGraphqlClient({ Locations: [] });
    const { service } = aService(client);

    const response = await service.getLocationById(someHeaders(), '7; drop');

    // 2003 is ClientUnknownLocation
    expect(response.status_code).toBe(2003);
    expect(response.status_message).toBe('Unknown location: 7; drop');
    expect(request).not.toHaveBeenCalled();
  });

  it('returns the first row and warns when the id matches several', async () => {
    const { client } = aCapturingGraphqlClient({
      Locations: [aLocation(), aLocation({ id: 2 })],
    });
    const { service, warn } = aService(client);

    const response = await service.getLocationById(someHeaders(), '1');

    expect(response.data!.id).toBe('1');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('Multiple locations found for id 1');
  });

  it('wraps a transport failure in a 2000 response', async () => {
    const request = vi.fn().mockRejectedValue(new Error('hasura down'));
    const { service } = aService({ request } as never);

    const response = await service.getLocationById(someHeaders(), '7');

    // 2000 is ClientGenericError; only NotFoundException maps to 2003
    expect(response.status_code).toBe(2000);
    expect(response.status_message).toBe('hasura down');
  });
});

describe('getEvseById', () => {
  it('maps the station and EVSE on a hit', async () => {
    // GET_EVSE_BY_ID_QUERY selects no connectors under evses (see report); the mapper derives
    // status from them, so the fixture includes what the query would need to select.
    const { client, request } = aCapturingGraphqlClient({
      Locations: [{ chargingPool: [aStation()] }],
    });
    const { service } = aService(client);

    const response = await service.getEvseById(someHeaders(), '7', 'cs-001', 2);

    expect(documentFrom(request)).toContain('query GetEvseById(');
    expect(request.mock.calls[0][1]).toMatchObject({
      locationId: 7,
      stationId: 'cs-001',
      evseId: 2,
    });
    expect(response.status_code).toBe(1000);
    expect(response.data).toMatchObject({
      uid: 'cs-001::2',
      evse_id: 'GB*VLT*E2',
      status: EvseStatus.AVAILABLE,
      physical_reference: 'Bay 4',
      floor_level: '-1',
      coordinates: { longitude: '-1.50000', latitude: '53.80000' },
    });
    expect(response.data!.connectors![0].id).toBe('3');
  });

  it('reports 2003 when the station has no matching EVSE', async () => {
    const { client } = aCapturingGraphqlClient({
      Locations: [{ chargingPool: [aStation({ evses: [] })] }],
    });
    const { service } = aService(client);

    const response = await service.getEvseById(someHeaders(), '7', 'cs-001', 99);

    expect(response.status_code).toBe(2003);
    expect(response.status_message).toBe('Unknown location: 7');
  });
});

describe('getConnectorById', () => {
  it('returns the mapped connector on a hit', async () => {
    const { client, request } = aCapturingGraphqlClient({
      Locations: [{ chargingPool: [{ evses: [{ connectors: [aConnector()] }] }] }],
    });
    const { service } = aService(client);

    const response = await service.getConnectorById(someHeaders(), '7', 'cs-001', 2, 3);

    const document = documentFrom(request);
    expect(document).toContain('query GetConnectorById(');
    expect(document).toContain(
      'connectors: Connectors(where: { connectorId: { _eq: $connectorId } })',
    );
    expect(request.mock.calls[0][1]).toMatchObject({
      locationId: 7,
      stationId: 'cs-001',
      evseId: 2,
      connectorId: 3,
    });
    expect(response.status_code).toBe(1000);
    expect(response.data).toMatchObject({
      id: '3',
      standard: ConnectorType.IEC_62196_T2,
      max_electric_power: 22000,
      tariff_ids: ['7'],
      last_updated: UPDATED_AT,
    });
  });

  it('returns the first connector and warns when several match', async () => {
    const { client } = aCapturingGraphqlClient({
      Locations: [
        { chargingPool: [{ evses: [{ connectors: [aConnector(), aConnector({ id: 9 })] }] }] },
      ],
    });
    const { service, warn } = aService(client);

    const response = await service.getConnectorById(someHeaders(), '7', 'cs-001', 2, 3);

    expect(response.data!.id).toBe('3');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('Multiple connectors found');
  });

  it('reports 2003 when no connector matches', async () => {
    const { client } = aCapturingGraphqlClient({
      Locations: [{ chargingPool: [{ evses: [{ connectors: [] }] }] }],
    });
    const { service } = aService(client);

    const response = await service.getConnectorById(someHeaders(), '7', 'cs-001', 2, 99);

    expect(response.status_code).toBe(2003);
    expect(response.status_message).toBe('Unknown location: 7');
  });
});
