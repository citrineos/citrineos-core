// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// TariffMapper.map is static and the barrel it lives in reaches the package index, so the whole
// module is replaced. The stub makes the mapped rows recognisable in the assertions below.
vi.mock('../../src/mapper/index.js', () => ({
  TariffMapper: class {
    static map = vi.fn((tariff: { id: number }) => ({ id: `mapped-${tariff.id}` }));
  },
}));

import { TariffsService } from '../../src/services/tariffs-service.js';
import { TariffMapper } from '../../src/mapper/index.js';
import { OcpiHeaders } from '../../src/model/ocpi-headers.js';
import { PaginatedParams } from '../../src/controllers/param/paginated-params.js';
import { GET_TARIFF_BY_KEY_QUERY, GET_TARIFFS_QUERY } from '../../src/graphql/index.js';

const COUNTRY_CODE = 'DE';
const PARTY_ID = 'CPO';

const mapMock = vi.mocked(TariffMapper.map);

beforeEach(() => {
  mapMock.mockClear();
});

/** Captures the query document and Hasura variables the service builds. */
function aCapturingGraphqlClient(result: Record<string, unknown> = { Tariffs: [] }) {
  const request = vi.fn().mockResolvedValue(result);
  return { client: { request } as never, request };
}

function aService(client: never) {
  return new TariffsService({ ocpiGraphqlClient: client } as never);
}

function someHeaders(): OcpiHeaders {
  return { toCountryCode: COUNTRY_CODE, toPartyId: PARTY_ID } as OcpiHeaders;
}

function variablesFrom(request: ReturnType<typeof aCapturingGraphqlClient>['request']) {
  expect(request).toHaveBeenCalledOnce();
  return request.mock.calls[0][1] as Record<string, any>;
}

function aTariffRow(id: number) {
  return { id, currency: 'EUR', tenant: { countryCode: COUNTRY_CODE, partyId: PARTY_ID } };
}

describe('TariffsService.getTariffs', () => {
  it('sends the shared GetTariffs document', async () => {
    // That document counts its aggregate under the same $where as the page, so X-Total-Count and
    // the page agree. Its text is pinned in test/graphql/query-documents.test.ts; what this
    // asserts is that the service sends that document and not one of its own.
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getTariffs(someHeaders());

    expect(request.mock.calls[0][0]).toBe(GET_TARIFFS_QUERY);
  });

  it('scopes the where clause to the CPO named by the to_ headers', async () => {
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getTariffs(someHeaders());

    expect(variablesFrom(request).where).toEqual({
      Tenant: { countryCode: { _eq: COUNTRY_CODE }, partyId: { _eq: PARTY_ID } },
    });
  });

  it('forwards offset and limit from the pagination params', async () => {
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getTariffs(someHeaders(), { offset: 40, limit: 20 } as PaginatedParams);

    expect(variablesFrom(request)).toMatchObject({ offset: 40, limit: 20 });
  });

  it('defaults to offset 0 and limit 10 when the caller passes none', async () => {
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getTariffs(someHeaders());

    expect(variablesFrom(request)).toMatchObject({ offset: 0, limit: 10 });
  });

  it('maps each returned row in order and takes count from the aggregate, not the page size', async () => {
    const { client } = aCapturingGraphqlClient({
      Tariffs: [aTariffRow(1), aTariffRow(2)],
      Tariffs_aggregate: { aggregate: { count: 42 } },
    });

    const result = await aService(client).getTariffs(someHeaders());

    expect(result.data).toEqual([{ id: 'mapped-1' }, { id: 'mapped-2' }]);
    expect(result.count).toBe(42);
    expect(mapMock).toHaveBeenCalledTimes(2);
    expect(mapMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 1 }));
    expect(mapMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 2 }));
  });

  it('counts zero when the result has no aggregate', async () => {
    const { client } = aCapturingGraphqlClient({ Tariffs: [] });

    const result = await aService(client).getTariffs(someHeaders());

    expect(result).toEqual({ data: [], count: 0 });
    expect(mapMock).not.toHaveBeenCalled();
  });

  it('propagates a graphql failure and never invokes the mapper', async () => {
    const request = vi.fn().mockRejectedValue(new Error('hasura unreachable'));
    const service = aService({ request } as never);

    await expect(service.getTariffs(someHeaders())).rejects.toThrow(/hasura unreachable/);
    expect(request).toHaveBeenCalledOnce();
    expect(mapMock).not.toHaveBeenCalled();
  });
});

describe('TariffsService.getTariffByKey', () => {
  it('passes the whole key as the query variables', async () => {
    // GET_TARIFF_BY_KEY_QUERY holds the scope predicate; dropping a variable here would widen the
    // lookup to another party's tariff with the same id.
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getTariffByKey({ id: 7, countryCode: COUNTRY_CODE, partyId: PARTY_ID });

    expect(request.mock.calls[0][0]).toBe(GET_TARIFF_BY_KEY_QUERY);
    expect(variablesFrom(request)).toEqual({
      id: 7,
      countryCode: COUNTRY_CODE,
      partyId: PARTY_ID,
    });
  });

  it('maps the first returned row', async () => {
    const { client } = aCapturingGraphqlClient({ Tariffs: [aTariffRow(7)] });

    const tariff = await aService(client).getTariffByKey({
      id: 7,
      countryCode: COUNTRY_CODE,
      partyId: PARTY_ID,
    });

    expect(tariff).toEqual({ id: 'mapped-7' });
    expect(mapMock).toHaveBeenCalledOnce();
    expect(mapMock).toHaveBeenCalledWith(expect.objectContaining({ id: 7 }));
  });

  it('returns undefined for an unknown key without calling the mapper', async () => {
    const { client } = aCapturingGraphqlClient({ Tariffs: [] });

    const tariff = await aService(client).getTariffByKey({
      id: 999,
      countryCode: COUNTRY_CODE,
      partyId: PARTY_ID,
    });

    expect(tariff).toBeUndefined();
    expect(mapMock).not.toHaveBeenCalled();
  });

  it('propagates a graphql failure', async () => {
    const request = vi.fn().mockRejectedValue(new Error('hasura unreachable'));
    const service = aService({ request } as never);

    await expect(
      service.getTariffByKey({ id: 7, countryCode: COUNTRY_CODE, partyId: PARTY_ID }),
    ).rejects.toThrow(/hasura unreachable/);
  });
});
