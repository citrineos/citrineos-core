// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import 'reflect-metadata';
import type { TenantDto, TransactionDto } from '@citrineos/types';
import { describe, expect, it, vi } from 'vitest';
import { type ILogObj, Logger } from 'tslog';

// Barrel first: the module resolves its dependencies through src/index.js.
import {
  DtoEventObjectType,
  DtoEventType,
  GET_TRANSACTION_BY_ID_QUERY,
  type IDtoEvent,
} from '../../index.js';
import { SessionsModule } from '../../src/modules/sessions/index.js';

const tenant = { id: 1, countryCode: 'US', partyId: 'S44' } as TenantDto;

/** What the TransactionNotification trigger sends: the Transactions row, with no relations. */
const aNotifiedRow = (overrides: Partial<TransactionDto> = {}) =>
  ({ id: 7, transactionId: 'tx-7', stationId: 1, tenant, ...overrides }) as TransactionDto;

const aFetchedTransaction = {
  id: 7,
  transactionId: 'tx-7',
  stationId: 1,
  station: { id: 1, ocppConnectionName: 'cp001', isOnline: true },
  authorization: { id: 1, idToken: 'DEADBEEF', additionalInfo: [] },
};

function anEvent<T extends object>(eventType: DtoEventType, payload: T): IDtoEvent<T> {
  return {
    _eventId: 'TransactionNotification',
    _context: { eventType, objectType: DtoEventObjectType.Transaction },
    _payload: payload,
  };
}

function aSessionsModule(transactions: object[]) {
  const request = vi.fn().mockResolvedValue({ Transactions: transactions });
  const sessionBroadcaster = {
    broadcastPutSession: vi.fn(),
    broadcastPatchSession: vi.fn(),
  };
  const cdrBroadcaster = { broadcastPostCdr: vi.fn() };
  const module = new SessionsModule({
    config: {},
    logger: new Logger<ILogObj>({ type: 'hidden' }),
    dtoEventReceiverFactory: () => ({}),
    ocpiGraphqlClient: { request },
    sessionBroadcaster,
    cdrBroadcaster,
  } as never);
  return { module, request, sessionBroadcaster, cdrBroadcaster };
}

describe('SessionsModule.handleTransactionInsert', () => {
  it('puts the session from the fetched transaction, not the bare notified row', async () => {
    const { module, request, sessionBroadcaster } = aSessionsModule([aFetchedTransaction]);

    await module.handleTransactionInsert(anEvent(DtoEventType.INSERT, aNotifiedRow()));

    expect(request).toHaveBeenCalledWith(GET_TRANSACTION_BY_ID_QUERY, { id: 7 });
    expect(sessionBroadcaster.broadcastPutSession).toHaveBeenCalledWith(
      tenant,
      aFetchedTransaction,
    );
  });

  it('puts nothing when the transaction cannot be fetched', async () => {
    const { module, sessionBroadcaster } = aSessionsModule([]);

    await module.handleTransactionInsert(anEvent(DtoEventType.INSERT, aNotifiedRow()));

    expect(sessionBroadcaster.broadcastPutSession).not.toHaveBeenCalled();
  });
});

describe('SessionsModule.handleTransactionUpdate', () => {
  it('posts the CDR from the fetched transaction once the transaction ends', async () => {
    const { module, request, cdrBroadcaster } = aSessionsModule([aFetchedTransaction]);

    await module.handleTransactionUpdate(
      anEvent(DtoEventType.UPDATE, aNotifiedRow({ isActive: false })),
    );

    expect(request).toHaveBeenCalledWith(GET_TRANSACTION_BY_ID_QUERY, { id: 7 });
    expect(cdrBroadcaster.broadcastPostCdr).toHaveBeenCalledWith(aFetchedTransaction);
  });

  it('posts no CDR while the transaction is still active', async () => {
    const { module, request, cdrBroadcaster } = aSessionsModule([aFetchedTransaction]);

    await module.handleTransactionUpdate(
      anEvent(DtoEventType.UPDATE, aNotifiedRow({ isActive: true })),
    );

    expect(request).not.toHaveBeenCalled();
    expect(cdrBroadcaster.broadcastPostCdr).not.toHaveBeenCalled();
  });
});
