// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { Logger } from 'tslog';

// The mapper barrel reaches BaseClientApi, whose parameterless @Inject() needs design:type
// metadata the test transform does not emit. These tests never map a row, so a stub is enough.
// citrineos/citrineos-core#913 removes the need for this.
vi.mock('../../src/mapper/index.js', () => ({
  ConnectorMapper: class {},
  EvseMapper: class {},
  LocationMapper: class {},
  TariffMapper: class {},
}));

import { LocationsService } from '../../src/services/locations-service.js';
import { TariffsService } from '../../src/services/tariffs-service.js';
import { OcpiHeaders } from '../../src/model/ocpi-headers.js';
import { PaginatedParams } from '../../src/controllers/param/paginated-params.js';

const DATE_FROM = new Date('2026-08-01T00:00:00.000Z');
const DATE_TO = new Date('2026-08-19T00:00:00.000Z');

/** Captures the Hasura variables the service builds, and returns an empty result set. */
function aCapturingGraphqlClient(payload: Record<string, unknown>) {
  const request = vi.fn().mockResolvedValue(payload);
  return { client: { request } as never, request };
}

function whereFrom(request: ReturnType<typeof aCapturingGraphqlClient>['request']) {
  expect(request).toHaveBeenCalledOnce();
  return (request.mock.calls[0][1] as { where: Record<string, any> }).where;
}

function someHeaders(): OcpiHeaders {
  return { toCountryCode: 'GB', toPartyId: 'VLT' } as OcpiHeaders;
}

function paginatedParams(dateFrom?: Date, dateTo?: Date): PaginatedParams {
  return { dateFrom, dateTo } as PaginatedParams;
}

describe('OCPI date_from / date_to filters on Locations and Tariffs', () => {
  it('LocationsService treats date_to as exclusive', async () => {
    // OCPI defines date_from as inclusive and date_to as exclusive. An inclusive upper bound
    // returns a record sitting exactly on the boundary to both the poll that ends there and the
    // poll that starts there. CdrsService and SessionsService already use _lt.
    const { client, request } = aCapturingGraphqlClient({ Locations: [] });
    const service = new LocationsService({
      logger: new Logger({ type: 'hidden' }),
      ocpiGraphqlClient: client,
    } as never);

    await service.getLocations(someHeaders(), paginatedParams(DATE_FROM, DATE_TO));

    expect(whereFrom(request).updatedAt).toEqual({
      _gte: DATE_FROM.toISOString(),
      _lt: DATE_TO.toISOString(),
    });
  });

  it('TariffsService treats date_to as exclusive', async () => {
    const { client, request } = aCapturingGraphqlClient({ Tariffs: [] });
    const service = new TariffsService({ ocpiGraphqlClient: client } as never);

    await service.getTariffs(someHeaders(), paginatedParams(DATE_FROM, DATE_TO));

    expect(whereFrom(request).updatedAt).toEqual({
      _gte: DATE_FROM.toISOString(),
      _lt: DATE_TO.toISOString(),
    });
  });

  it('omits the filter entirely when neither bound is given', async () => {
    const { client, request } = aCapturingGraphqlClient({ Tariffs: [] });
    const service = new TariffsService({ ocpiGraphqlClient: client } as never);

    await service.getTariffs(someHeaders(), paginatedParams());

    expect(whereFrom(request).updatedAt).toBeUndefined();
  });

  it('applies a lower bound on its own', async () => {
    const { client, request } = aCapturingGraphqlClient({ Locations: [] });
    const service = new LocationsService({
      logger: new Logger({ type: 'hidden' }),
      ocpiGraphqlClient: client,
    } as never);

    await service.getLocations(someHeaders(), paginatedParams(DATE_FROM, undefined));

    expect(whereFrom(request).updatedAt).toEqual({ _gte: DATE_FROM.toISOString() });
  });
});
