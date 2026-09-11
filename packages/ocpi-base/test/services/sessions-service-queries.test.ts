// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

import { SessionsService } from '../../src/services/sessions-service.js';
import { GET_TRANSACTIONS_QUERY } from '../../src/graphql/index.js';

const ROWS = [
  { id: 1, transactionId: 'tx-001', isActive: false },
  { id: 2, transactionId: 'tx-002', isActive: true },
];

/** Captures the query document and Hasura variables the service builds. */
function aCapturingGraphqlClient(result: Record<string, unknown> = { Transactions: [] }) {
  const request = vi.fn().mockResolvedValue(result);
  return { client: { request } as never, request };
}

function aService(client: never, mapTransactionsToSessions = vi.fn().mockResolvedValue([])) {
  const service = new SessionsService({
    ocpiGraphqlClient: client,
    sessionMapper: { mapTransactionsToSessions },
  } as never);
  return { service, mapTransactionsToSessions };
}

function variablesFrom(request: ReturnType<typeof aCapturingGraphqlClient>['request']) {
  expect(request).toHaveBeenCalledOnce();
  return request.mock.calls[0][1] as Record<string, any>;
}

describe('SessionsService.getSessions', () => {
  it('sends the shared GetTransactions document', async () => {
    // That document counts its aggregate under the same $where as the page, so X-Total-Count and
    // the page agree. Its text is pinned in test/graphql/query-documents.test.ts; what this
    // asserts is that the service sends that document and not one of its own.
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).service.getSessions('GB', 'EMS', 'DE', 'CPO');

    expect(request.mock.calls[0][0]).toBe(GET_TRANSACTIONS_QUERY);
  });

  it('addresses the receiving CPO by Tenant and the requesting party by TenantPartner', async () => {
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).service.getSessions('GB', 'EMS', 'DE', 'CPO');

    const { where } = variablesFrom(request);
    expect(where.Tenant).toEqual({ countryCode: { _eq: 'DE' }, partyId: { _eq: 'CPO' } });
    expect(where.Authorization).toEqual({
      TenantPartner: { countryCode: { _eq: 'GB' }, partyId: { _eq: 'EMS' } },
    });
  });

  it('forwards offset and limit and echoes them in the page envelope', async () => {
    const { client, request } = aCapturingGraphqlClient();

    const response = await aService(client).service.getSessions(
      'GB',
      'EMS',
      'DE',
      'CPO',
      undefined,
      undefined,
      40,
      20,
    );

    expect(variablesFrom(request)).toMatchObject({ offset: 40, limit: 20 });
    expect(response.offset).toBe(40);
    expect(response.limit).toBe(20);
  });

  it('defaults to offset 0 and limit 10 when the caller passes none', async () => {
    const { client, request } = aCapturingGraphqlClient();

    const response = await aService(client).service.getSessions('GB', 'EMS', 'DE', 'CPO');

    expect(variablesFrom(request)).toMatchObject({ offset: 0, limit: 10 });
    expect(response.offset).toBe(0);
    expect(response.limit).toBe(10);
  });

  it('includes active sessions unless endedOnly is set', async () => {
    // Unlike CDRs, the Sessions sender interface lists running sessions too.
    const { client, request } = aCapturingGraphqlClient();

    await aService(client).service.getSessions('GB', 'EMS', 'DE', 'CPO');

    expect(variablesFrom(request).where.isActive).toBeUndefined();
  });

  it('hands the mapper the raw graphql rows and returns its sessions', async () => {
    const mapped = [{ id: 'tx-001' }, { id: 'tx-002' }];
    const { client } = aCapturingGraphqlClient({
      Transactions: ROWS,
      Transactions_aggregate: { aggregate: { count: 2 } },
    });
    const { service, mapTransactionsToSessions } = aService(
      client,
      vi.fn().mockResolvedValue(mapped),
    );

    const response = await service.getSessions('GB', 'EMS', 'DE', 'CPO');

    expect(mapTransactionsToSessions).toHaveBeenCalledOnce();
    expect(mapTransactionsToSessions).toHaveBeenCalledWith(ROWS);
    expect(response.data).toBe(mapped);
    expect(response.status_code).toBe(1000);
  });

  it('takes total from the aggregate count, not the page size', async () => {
    const { client } = aCapturingGraphqlClient({
      Transactions: ROWS,
      Transactions_aggregate: { aggregate: { count: 42 } },
    });

    const response = await aService(client).service.getSessions('GB', 'EMS', 'DE', 'CPO');

    expect(response.total).toBe(42);
  });

  it('totals zero when the result has no aggregate', async () => {
    const { client } = aCapturingGraphqlClient({ Transactions: [] });

    const response = await aService(client).service.getSessions('GB', 'EMS', 'DE', 'CPO');

    expect(response.total).toBe(0);
    expect(response.data).toEqual([]);
    expect(response.status_code).toBe(1000);
  });

  it('propagates a graphql failure and never invokes the mapper', async () => {
    const request = vi.fn().mockRejectedValue(new Error('hasura unreachable'));
    const { service, mapTransactionsToSessions } = aService({ request } as never);

    await expect(service.getSessions('GB', 'EMS', 'DE', 'CPO')).rejects.toThrow(
      /hasura unreachable/,
    );
    expect(mapTransactionsToSessions).not.toHaveBeenCalled();
  });

  it('propagates a mapper failure', async () => {
    const { client } = aCapturingGraphqlClient({ Transactions: ROWS });
    const { service } = aService(
      client,
      vi.fn().mockRejectedValue(new Error('transaction has no start event')),
    );

    await expect(service.getSessions('GB', 'EMS', 'DE', 'CPO')).rejects.toThrow(/no start event/);
  });
});
