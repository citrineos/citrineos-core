// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  AuthorizationAttemptReasonEnum,
  AuthorizationStatusEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IAuthorizationRepository, ITransactionEventRepository } from '@citrineos/dal';
import { Transaction } from '@citrineos/dal';
import { StopTransactionRequestOcpp16Handler } from '@handlers/index.js';
import {
  createTestContainer,
  makeMockAuthorizationAttemptService,
  makeRewritingOcppSender,
} from '@test/test-container.js';

const STATION_DB_ID = vi.hoisted(() => 4242);
vi.mock('@citrineos/dal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@citrineos/dal')>()),
  resolveStationId: vi.fn().mockResolvedValue(STATION_DB_ID),
  stationIdFilter: vi.fn().mockResolvedValue(STATION_DB_ID),
}));

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

function anAuthorization(overrides: Record<string, unknown> = {}) {
  return { id: 7, idToken: 'TAG001', status: AuthorizationStatusEnum.Accepted, ...overrides };
}

function makeHandler(
  transaction: ReturnType<typeof aTransaction> | null,
  authorizations: ReturnType<typeof anAuthorization>[] = [anAuthorization()],
) {
  const { logger } = createTestContainer();
  const ocppSender = makeRewritingOcppSender();

  const authorizationRepository = {
    readAllByQuerystring: vi.fn().mockResolvedValue(authorizations),
    readOnlyOneByQuerystring: vi.fn(async () => {
      if (authorizations.length > 1) {
        throw new Error('More than one value found for query');
      }
      return authorizations[0];
    }),
  };

  const transactionEventRepository = {
    createStopTransaction: vi.fn().mockResolvedValue({ id: 1 }),
    updateTransactionTotalCostById: vi.fn().mockResolvedValue(undefined),
  };

  const costCalculator = {
    calculateTotalCost: vi.fn().mockResolvedValue(0),
  };

  const findOne = vi
    .spyOn(Transaction, 'findOne')
    .mockResolvedValue(transaction as unknown as Transaction);

  const authorizationAttemptService = makeMockAuthorizationAttemptService();

  const handler = new StopTransactionRequestOcpp16Handler({
    authorizationAttemptService,
    logger,
    ocppSender,
    authorizationRepository: authorizationRepository as unknown as IAuthorizationRepository,
    transactionEventRepository:
      transactionEventRepository as unknown as ITransactionEventRepository,
    transactionRepository: transactionEventRepository,
    costCalculator,
  } as never);

  return {
    handler,
    ocppSender,
    transactionEventRepository,
    costCalculator,
    findOne,
    authorizationAttemptService,
  };
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

  it('answers Invalid when the idTag matches more than one authorization', async () => {
    const { handler, ocppSender } = makeHandler(aTransaction(true), [
      anAuthorization({ id: 7, idTokenType: 'ISO14443' }),
      anAuthorization({ id: 8, idTokenType: 'Central' }),
    ]);

    await handler.handle(makeMessage(request));

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        idTagInfo: expect.objectContaining({
          status: OCPP1_6.StopTransactionResponseStatus.Invalid,
        }),
      }),
    );
  });

  it('still closes the transaction when the idTag matches more than one authorization', async () => {
    const transaction = aTransaction(true);
    const { handler, transactionEventRepository } = makeHandler(transaction, [
      anAuthorization({ id: 7, idTokenType: 'ISO14443' }),
      anAuthorization({ id: 8, idTokenType: 'Central' }),
    ]);

    await handler.handle(makeMessage(request));

    expect(transactionEventRepository.createStopTransaction).toHaveBeenCalledOnce();
    expect(transaction.save).toHaveBeenCalledOnce();
  });

  it('answers Expired for an accepted authorization whose cache expiry has passed', async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { handler, ocppSender } = makeHandler(aTransaction(true), [
      anAuthorization({ cacheExpiryDateTime: yesterday }),
    ]);

    await handler.handle(makeMessage(request));

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        idTagInfo: expect.objectContaining({
          status: OCPP1_6.StopTransactionResponseStatus.Expired,
        }),
      }),
    );
  });

  it('answers Accepted while the cache expiry is still ahead', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { handler, ocppSender } = makeHandler(aTransaction(true), [
      anAuthorization({ cacheExpiryDateTime: tomorrow }),
    ]);

    await handler.handle(makeMessage(request));

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        idTagInfo: expect.objectContaining({
          status: OCPP1_6.StopTransactionResponseStatus.Accepted,
        }),
      }),
    );
  });

  it('stores no SignedData sampled value from transactionData', async () => {
    const rawRegister = { value: '25000', unit: OCPP1_6.StopTransactionRequestUnit.Wh };
    const signedRegister = {
      value: 'OCMF|{}|{}',
      format: OCPP1_6.StopTransactionRequestFormat.SignedData,
    };
    const transaction = aTransaction(true);
    const { handler, transactionEventRepository } = makeHandler(transaction);

    await handler.handle(
      makeMessage({
        ...request,
        transactionData: [
          { timestamp: '2026-09-14T10:00:00.000Z', sampledValue: [rawRegister, signedRegister] },
          { timestamp: '2026-09-14T10:00:01.000Z', sampledValue: [signedRegister] },
        ],
      }),
    );

    const stored = transactionEventRepository.createStopTransaction.mock.calls[0][5];
    expect(stored).toEqual([
      expect.objectContaining({
        timestamp: '2026-09-14T10:00:00.000Z',
        sampledValue: [expect.objectContaining({ value: 25000 })],
      }),
    ]);
  });

  describe('authorization attempts', () => {
    it('records the idTag against the transaction it stopped', async () => {
      const transaction = aTransaction(true);
      const authorization = anAuthorization();
      const { handler, authorizationAttemptService } = makeHandler(transaction, [authorization]);
      const message = makeMessage(request);

      const { context } = message;

      await handler.handle(message);

      expect(authorizationAttemptService.record).toHaveBeenCalledWith(context, {
        ocppVersion: OCPPVersion.OCPP1_6,
        action: OCPP_CallAction.StopTransaction,
        idToken: 'TAG001',
        decision: { reason: AuthorizationAttemptReasonEnum.Accepted, authorization },
        responseStatus: OCPP1_6.StopTransactionResponseStatus.Accepted,
        transaction,
        transactionId: '100',
      });
    });

    it('records the attempt even when the transaction is unknown', async () => {
      const { handler, authorizationAttemptService } = makeHandler(null, []);

      await handler.handle(makeMessage(request));

      expect(authorizationAttemptService.record.mock.calls[0][1]).toMatchObject({
        decision: { reason: AuthorizationAttemptReasonEnum.NotFound },
        responseStatus: OCPP1_6.StopTransactionResponseStatus.Invalid,
        transaction: null,
        transactionId: '100',
      });
    });

    it('records an expired cache entry', async () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { handler, authorizationAttemptService } = makeHandler(aTransaction(true), [
        anAuthorization({ cacheExpiryDateTime: yesterday }),
      ]);

      await handler.handle(makeMessage(request));

      expect(authorizationAttemptService.record.mock.calls[0][1].decision.reason).toBe(
        AuthorizationAttemptReasonEnum.CacheExpired,
      );
    });

    it('records nothing when the station presented no idTag', async () => {
      const { idTag: _, ...withoutIdTag } = request;
      const { handler, authorizationAttemptService } = makeHandler(aTransaction(true));

      await handler.handle(makeMessage(withoutIdTag));

      expect(authorizationAttemptService.record).not.toHaveBeenCalled();
    });
  });
});
