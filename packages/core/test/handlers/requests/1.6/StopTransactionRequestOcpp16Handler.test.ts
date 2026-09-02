// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  AuthorizationStatusEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IAuthorizationRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import { Transaction } from '@dal/index.js';
import { StopTransactionRequestOcpp16Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/testContainer.js';

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Transactions,
    action: OCPP_CallAction.StopTransaction,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

/**
 * A Transaction row as the handler finds it, with just enough surface for the handler to run:
 * the StartTransaction association it reads meterStart from, and a no-op save().
 */
function aTransaction(isActive: boolean) {
  return {
    id: 1,
    transactionId: '100',
    isActive,
    startTransaction: { meterStart: 1000 },
    save: vi.fn().mockResolvedValue(undefined),
  };
}

function makeHandler(transaction: ReturnType<typeof aTransaction> | null) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const authorizationRepository = {
    readOnlyOneByQuerystring: vi.fn().mockResolvedValue({
      id: 7,
      idToken: 'TAG001',
      status: AuthorizationStatusEnum.Accepted,
    }),
  };

  const transactionEventRepository = {
    createStopTransaction: vi.fn().mockResolvedValue({ id: 1 }),
  };

  const findOne = vi
    .spyOn(Transaction, 'findOne')
    .mockResolvedValue(transaction as unknown as Transaction);

  const handler = new StopTransactionRequestOcpp16Handler({
    logger,
    ocppSender,
    authorizationRepository: authorizationRepository as unknown as IAuthorizationRepository,
    transactionEventRepository:
      transactionEventRepository as unknown as ITransactionEventRepository,
  } as never);

  return { handler, ocppSender, transactionEventRepository, findOne };
}

const request: OCPP1_6.StopTransactionRequest = {
  transactionId: 100,
  idTag: 'TAG001',
  meterStop: 25000,
  timestamp: new Date().toISOString(),
};

describe('StopTransactionRequestOcpp16Handler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records the stop for an active transaction', async () => {
    const transaction = aTransaction(true);
    const { handler, transactionEventRepository } = makeHandler(transaction);

    await handler.handle(makeMessage(request));

    expect(transactionEventRepository.createStopTransaction).toHaveBeenCalledOnce();
    expect(transaction.save).toHaveBeenCalledOnce();
  });

  it('does not record a second stop for an already-ended transaction', async () => {
    const transaction = aTransaction(false);
    const { handler, transactionEventRepository } = makeHandler(transaction);

    await handler.handle(makeMessage(request));

    // A charger that misses our CallResult retries the StopTransaction. Writing it again
    // duplicates the StopTransaction row and every meter value in transactionData.
    expect(transactionEventRepository.createStopTransaction).not.toHaveBeenCalled();
    expect(transaction.save).not.toHaveBeenCalled();
  });

  it('still acknowledges a retried StopTransaction so the charger stops resending', async () => {
    const { handler, ocppSender } = makeHandler(aTransaction(false));

    await handler.handle(makeMessage(request));

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  });

  it('records the same stoppedReason on the transaction as on the StopTransaction row', async () => {
    const transaction = aTransaction(true);
    const { handler, transactionEventRepository } = makeHandler(transaction);

    await handler.handle(makeMessage({ ...request, reason: undefined }));

    // OCPP 1.6 makes reason optional, so the handler derives one. Assigning request.reason
    // straight through left Transaction.stoppedReason null while the StopTransaction row
    // carried the derived value - two rows disagreeing about why the same session ended.
    const derived = transactionEventRepository.createStopTransaction.mock.calls[0][6];
    expect(derived).toBeDefined();
    expect((transaction as unknown as { stoppedReason?: string }).stoppedReason).toBe(derived);
  });

  it('derives Local as the stop reason when the driver presented an identification', async () => {
    const transaction = aTransaction(true);
    const { handler } = makeHandler(transaction);

    await handler.handle(makeMessage({ ...request, reason: undefined }));

    // 4.10 gives "EV-driver presented his identification to stop the transaction" as its own
    // example of the omitted-reason case, so an idTag is not evidence of a remote stop.
    expect((transaction as unknown as { stoppedReason?: string }).stoppedReason).toBe('Local');
  });

  it('derives Local as the stop reason when no idTag was presented', async () => {
    const transaction = aTransaction(true);
    const { handler } = makeHandler(transaction);

    await handler.handle(makeMessage({ ...request, idTag: undefined, reason: undefined }));

    expect((transaction as unknown as { stoppedReason?: string }).stoppedReason).toBe('Local');
  });
});
