// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { MeterValueDto, TenantDto, TransactionDto } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { type ILogObj, Logger } from 'tslog';

import { CdrBroadcaster } from '@ocpi/services/broadcaster/cdr-broadcaster.js';
import { SessionBroadcaster } from '@ocpi/services/broadcaster/session-broadcaster.js';
import { LIST_TENANT_PARTNERS_BY_CPO } from '@ocpi/transport/graphql/index.js';
import type { BaseClientApi } from '@ocpi/transport/trigger/base-client-api.js';
import { CdrsClientApi } from '@ocpi/transport/trigger/cdrs-client-api.js';
import { SessionsClientApi } from '@ocpi/transport/trigger/sessions-client-api.js';

const tenant = { countryCode: 'GB', partyId: 'CPO' } as TenantDto;
const OWNER = { id: 11, countryCode: 'GB', partyId: 'AAA', partnerProfileOCPI: {} };
const COMPETITOR = { id: 12, countryCode: 'GB', partyId: 'BBB', partnerProfileOCPI: {} };

function aGraphqlClient(owningPartnerId: number | null) {
  return {
    request: vi.fn(async (query: unknown) =>
      query === LIST_TENANT_PARTNERS_BY_CPO
        ? { TenantPartners: [OWNER, COMPETITOR] }
        : {
            Transactions: [
              {
                authorization: {
                  tenantPartner: owningPartnerId === null ? null : { id: owningPartnerId },
                },
              },
            ],
          },
    ),
  } as never;
}

function recipientsOf(clientApi: BaseClientApi) {
  const request = vi.spyOn(clientApi, 'request').mockResolvedValue({});
  return () => request.mock.calls.map((call) => call[3]);
}

function aSessionBroadcaster(owningPartnerId: number | null) {
  const logger = new Logger<ILogObj>({ type: 'hidden' });
  const ocpiGraphqlClient = aGraphqlClient(owningPartnerId);
  const sessionsClientApi = new SessionsClientApi({ logger, ocpiGraphqlClient });
  const recipients = recipientsOf(sessionsClientApi);
  const broadcaster = new SessionBroadcaster({
    logger,
    ocpiGraphqlClient,
    sessionsClientApi,
    sessionMapper: {
      mapTransactionToSession: vi.fn().mockResolvedValue({ id: '1' }),
      mapPartialTransactionToPartialSession: vi.fn().mockResolvedValue({ id: '1' }),
      getChargingPeriods: vi.fn().mockResolvedValue([]),
    },
  } as never);
  return { broadcaster, recipients };
}

function aCdrBroadcaster() {
  const logger = new Logger<ILogObj>({ type: 'hidden' });
  const cdrsClientApi = new CdrsClientApi({ logger, ocpiGraphqlClient: aGraphqlClient(null) });
  const recipients = recipientsOf(cdrsClientApi);
  const broadcaster = new CdrBroadcaster({
    logger,
    cdrsClientApi,
    cdrMapper: {
      mapTransactionsToCdrs: vi
        .fn()
        .mockResolvedValue([{ id: '1', country_code: 'GB', party_id: 'CPO' }]),
    },
  } as never);
  return { broadcaster, recipients };
}

const anEndedTransaction = (tenantPartner: { id: number } | null) =>
  ({ id: 1, transactionId: '1', authorization: { tenantPartner } }) as unknown as TransactionDto;

describe('Session and CDR pushes', () => {
  it('sends a new session only to the eMSP whose token started it', async () => {
    const { broadcaster, recipients } = aSessionBroadcaster(OWNER.id);

    await broadcaster.broadcastPutSession(tenant, { id: 1, transactionId: '1' } as TransactionDto);

    expect(recipients()).toEqual([OWNER.partyId]);
  });

  it('sends a session update only to the eMSP whose token started it', async () => {
    const { broadcaster, recipients } = aSessionBroadcaster(OWNER.id);

    await broadcaster.broadcastPatchSession(tenant, { id: 1, transactionId: '1', totalKwh: 3 });

    expect(recipients()).toEqual([OWNER.partyId]);
  });

  it('sends a charging period only to the eMSP whose token started the session', async () => {
    const { broadcaster, recipients } = aSessionBroadcaster(OWNER.id);

    await broadcaster.broadcastPatchSessionChargingPeriod(tenant, {
      transactionDatabaseId: 1,
      transactionId: '1',
      tariffId: 1,
    } as unknown as MeterValueDto);

    expect(recipients()).toEqual([OWNER.partyId]);
  });

  it('does not push a session whose token no eMSP owns', async () => {
    const { broadcaster, recipients } = aSessionBroadcaster(null);

    await broadcaster.broadcastPutSession(tenant, { id: 1, transactionId: '1' } as TransactionDto);

    expect(recipients()).toEqual([]);
  });

  it('sends a CDR only to the eMSP whose token started the session', async () => {
    const { broadcaster, recipients } = aCdrBroadcaster();

    await broadcaster.broadcastPostCdr(anEndedTransaction({ id: OWNER.id }));

    expect(recipients()).toEqual([OWNER.partyId]);
  });

  it('does not push a CDR whose token no eMSP owns', async () => {
    const { broadcaster, recipients } = aCdrBroadcaster();

    await broadcaster.broadcastPostCdr(anEndedTransaction(null));

    expect(recipients()).toEqual([]);
  });
});
