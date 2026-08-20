// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';

// The mapper barrel pulls in the whole typedi service graph, which needs a configured container.
// These tests construct the services by hand and never map a row, so a stub is enough to load them.
vi.mock('../../src/mapper/index.js', () => ({
  CdrMapper: class {},
  SessionMapper: class {},
}));

import { CdrsService } from '../../src/services/CdrsService.js';
import { SessionsService } from '../../src/services/SessionsService.js';

const DATE_FROM = new Date('2026-08-01T00:00:00.000Z');
const DATE_TO = new Date('2026-08-19T00:00:00.000Z');

/** Captures the Hasura variables the service builds, and returns an empty result set. */
function aCapturingGraphqlClient() {
  const request = vi.fn().mockResolvedValue({ Transactions: [] });
  return { client: { request } as never, request };
}

function whereFrom(request: ReturnType<typeof aCapturingGraphqlClient>['request']) {
  expect(request).toHaveBeenCalledOnce();
  return (request.mock.calls[0][1] as { where: Record<string, any> }).where;
}

describe('OCPI date_from / date_to filters', () => {
  it('CdrsService treats date_to as exclusive', async () => {
    // OCPI defines date_from as inclusive and date_to as exclusive. Making date_to inclusive means
    // a record whose last_updated lands exactly on the boundary is returned by the poll that ends
    // there and again by the poll that starts there - the same CDR billed twice.
    const { client, request } = aCapturingGraphqlClient();
    const service = new CdrsService(client, {
      mapTransactionsToCdrs: vi.fn().mockResolvedValue([]),
    } as never);

    await service.getCdrs('GB', 'ABC', 'GB', 'VLT', DATE_FROM, DATE_TO);

    const where = whereFrom(request);
    expect(where.updatedAt).toEqual({ _gte: DATE_FROM.toISOString(), _lt: DATE_TO.toISOString() });
  });

  it('SessionsService treats date_to as exclusive', async () => {
    const { client, request } = aCapturingGraphqlClient();
    const service = new SessionsService(client, {
      mapTransactionsToSessions: vi.fn().mockResolvedValue([]),
    } as never);

    await service.getSessions('GB', 'ABC', 'GB', 'VLT', DATE_FROM, DATE_TO);

    const where = whereFrom(request);
    expect(where.updatedAt).toEqual({ _gte: DATE_FROM.toISOString(), _lt: DATE_TO.toISOString() });
  });

  it('omits the filter entirely when neither bound is given', async () => {
    const { client, request } = aCapturingGraphqlClient();
    const service = new CdrsService(client, {
      mapTransactionsToCdrs: vi.fn().mockResolvedValue([]),
    } as never);

    await service.getCdrs('GB', 'ABC', 'GB', 'VLT');

    expect(whereFrom(request).updatedAt).toBeUndefined();
  });

  it('CdrsService excludes still-running transactions in the query, not afterwards', async () => {
    // CdrMapper drops active transactions in memory, but the query and its aggregate count did
    // not, so X-Total-Count counted sessions that never become CDRs and every page came back
    // short of its limit.
    const { client, request } = aCapturingGraphqlClient();
    const service = new CdrsService(client, {
      mapTransactionsToCdrs: vi.fn().mockResolvedValue([]),
    } as never);

    await service.getCdrs('GB', 'ABC', 'GB', 'VLT');

    expect(whereFrom(request).isActive).toEqual({ _eq: false });
  });

  it('SessionsService decides endedOnly on isActive, not on delivered energy', async () => {
    // totalKwh > 0 is not a completion signal: a session still running has delivered energy, and
    // one that ended without delivering any is still ended.
    const { client, request } = aCapturingGraphqlClient();
    const service = new SessionsService(client, {
      mapTransactionsToSessions: vi.fn().mockResolvedValue([]),
    } as never);

    await service.getSessions('GB', 'ABC', 'GB', 'VLT', undefined, undefined, 0, 10, true);

    const where = whereFrom(request) as Record<string, unknown>;
    expect(where.isActive).toEqual({ _eq: false });
    expect(where.totalKwh).toBeUndefined();
  });
});
