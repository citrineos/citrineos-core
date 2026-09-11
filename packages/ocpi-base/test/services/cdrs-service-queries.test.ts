// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

import { CdrsService } from '../../src/services/cdrs-service.js';
import { GET_TRANSACTIONS_QUERY } from '../../src/graphql/index.js';

/** Captures the query document and Hasura variables the service builds. */
function aCapturingGraphqlClient(result: unknown = { Transactions: [] }) {
  const request = vi.fn().mockResolvedValue(result);
  return { client: { request } as never, request };
}

function aCdrMapper(cdrs: unknown[] = []) {
  return { mapTransactionsToCdrs: vi.fn().mockResolvedValue(cdrs) };
}

function aService(client: never, cdrMapper = aCdrMapper()) {
  return new CdrsService({ ocpiGraphqlClient: client, cdrMapper } as never);
}

function variablesFrom(request: ReturnType<typeof aCapturingGraphqlClient>['request']) {
  expect(request).toHaveBeenCalledOnce();
  return request.mock.calls[0][1] as {
    offset: number;
    limit: number;
    where: Record<string, any>;
  };
}

describe('CdrsService.getCdrs', () => {
  it('scopes the query to the receiving CPO and the requesting eMSP', async () => {
    // from_* names the eMSP whose drivers charged, to_* the CPO being asked. Dropping either
    // side would hand one partner every other partner's billing records.
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getCdrs('DE', 'EMS', 'GB', 'VLT');

    const { where } = variablesFrom(request);
    expect(where.Tenant).toEqual({
      countryCode: { _eq: 'GB' },
      partyId: { _eq: 'VLT' },
    });
    expect(where.Authorization).toEqual({
      TenantPartner: { countryCode: { _eq: 'DE' }, partyId: { _eq: 'EMS' } },
    });
  });

  it('sends the shared GetTransactions document', async () => {
    // That document counts its aggregate under the same $where as the page, so X-Total-Count and
    // the page agree. Its text is pinned in test/graphql/query-documents.test.ts; what this
    // asserts is that the service sends that document and not one of its own.
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getCdrs('DE', 'EMS', 'GB', 'VLT');

    expect(request.mock.calls[0][0]).toBe(GET_TRANSACTIONS_QUERY);
  });

  it('defaults to offset 0 and limit 10', async () => {
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).getCdrs('DE', 'EMS', 'GB', 'VLT');

    const variables = variablesFrom(request);
    expect(variables.offset).toBe(0);
    expect(variables.limit).toBe(10);
  });

  it('passes offset and limit through and echoes them in the response', async () => {
    const { client, request } = aCapturingGraphqlClient();

    const response = await aService(client).getCdrs(
      'DE',
      'EMS',
      'GB',
      'VLT',
      undefined,
      undefined,
      40,
      20,
    );

    const variables = variablesFrom(request);
    expect(variables.offset).toBe(40);
    expect(variables.limit).toBe(20);
    expect(response.offset).toBe(40);
    expect(response.limit).toBe(20);
  });

  it('hands the returned rows to the mapper and answers 1000 with its CDRs', async () => {
    const rows = [{ id: 1 }, { id: 2 }];
    const { client } = aCapturingGraphqlClient({
      Transactions: rows,
      Transactions_aggregate: { aggregate: { count: 41 } },
    });
    const cdrMapper = aCdrMapper([{ id: 'cdr-1' }]);

    const response = await aService(client, cdrMapper).getCdrs('DE', 'EMS', 'GB', 'VLT');

    expect(cdrMapper.mapTransactionsToCdrs).toHaveBeenCalledOnce();
    expect(cdrMapper.mapTransactionsToCdrs).toHaveBeenCalledWith(rows);
    // 1000 is GenericSuccessCode.
    expect(response.status_code).toBe(1000);
    expect(response.data).toEqual([{ id: 'cdr-1' }]);
    expect(response.total).toBe(41);
  });

  it('reports zero total when the result carries no aggregate', async () => {
    const { client } = aCapturingGraphqlClient({ Transactions: [] });
    const cdrMapper = aCdrMapper();

    const response = await aService(client, cdrMapper).getCdrs('DE', 'EMS', 'GB', 'VLT');

    expect(response.total).toBe(0);
    expect(cdrMapper.mapTransactionsToCdrs).toHaveBeenCalledWith([]);
  });

  it('propagates a graphql failure without invoking the mapper', async () => {
    const request = vi.fn().mockRejectedValue(new Error('hasura unreachable'));
    const cdrMapper = aCdrMapper();
    const service = aService({ request } as never, cdrMapper);

    await expect(service.getCdrs('DE', 'EMS', 'GB', 'VLT')).rejects.toThrow(/hasura unreachable/);
    expect(cdrMapper.mapTransactionsToCdrs).not.toHaveBeenCalled();
  });
});
