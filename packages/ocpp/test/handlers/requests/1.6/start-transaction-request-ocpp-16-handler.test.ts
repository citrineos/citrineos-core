// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  AuthorizationAttemptReasonEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IConnectorRepository, ITransactionRepository } from '@citrineos/dal';
import { StartTransactionRequestOcpp16Handler } from '@handlers/index.js';
import {
  createTestContainer,
  makeMockAuthorizationAttemptService,
  makeRewritingOcppSender,
} from '@test/test-container.js';

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
    action: OCPP_CallAction.StartTransaction,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

function makeHandler(
  overrides: {
    connectorRepository?: Partial<IConnectorRepository>;
    transactionEventRepository?: Partial<ITransactionRepository>;
    transactionService?: Record<string, unknown>;
  } = {},
) {
  const { logger } = createTestContainer();
  const ocppSender = makeRewritingOcppSender();

  const connectorRepository = {
    readConnectorByStationIdAndOcpp16ConnectorId: vi.fn().mockResolvedValue({
      id: 1,
      evse: { evseTypeId: 42 },
    }),
    ...overrides.connectorRepository,
  };

  const transactionEventRepository = {
    createTransactionByStartTransaction: vi.fn().mockResolvedValue({ transactionId: '100' }),
    ...overrides.transactionEventRepository,
  };

  const transactionService = {
    authorizeOcpp16IdToken: vi.fn().mockResolvedValue({
      idTagInfo: { status: OCPP1_6.StartTransactionResponseStatus.Accepted },
    }),
    deactivateReservation: vi.fn().mockResolvedValue(undefined),
    deactivateOtherActiveTransactionsAtEvse: vi.fn().mockResolvedValue(undefined),
    ...overrides.transactionService,
  };

  const authorizationAttemptService = makeMockAuthorizationAttemptService();

  const handler = new StartTransactionRequestOcpp16Handler({
    authorizationAttemptService,
    logger,
    ocppSender,
    connectorRepository: connectorRepository as unknown as IConnectorRepository,
    transactionRepository: transactionEventRepository as unknown as ITransactionRepository,
    transactionService: transactionService as any,
  });

  return {
    handler,
    ocppSender,
    connectorRepository,
    transactionEventRepository,
    transactionService,
    authorizationAttemptService,
  };
}

describe('StartTransactionRequestOcpp16Handler', () => {
  describe('deactivateOtherActiveTransactionsAtEvse16', () => {
    it('calls deactivateOtherActiveTransactionsAtEvse when connector is found', async () => {
      const { handler, transactionService } = makeHandler();

      const payload: OCPP1_6.StartTransactionRequest = {
        connectorId: 1,
        idTag: 'TAG001',
        meterStart: 0,
        timestamp: new Date().toISOString(),
      };

      await handler.handle(makeMessage(payload));

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).toHaveBeenCalledOnce();
      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.any(String),
        'station-001',
        1,
      );
    });

    it('does NOT call deactivateOtherActiveTransactionsAtEvse when authorization is rejected', async () => {
      const { handler, transactionService, transactionEventRepository } = makeHandler({
        transactionService: {
          authorizeOcpp16IdToken: vi.fn().mockResolvedValue({
            idTagInfo: { status: OCPP1_6.StartTransactionResponseStatus.ConcurrentTx },
            transactionId: 0,
          }),
        },
      });

      const payload: OCPP1_6.StartTransactionRequest = {
        connectorId: 1,
        idTag: 'TAG001',
        meterStart: 0,
        timestamp: new Date().toISOString(),
      };

      await handler.handle(makeMessage(payload));

      expect(transactionEventRepository.createTransactionByStartTransaction).not.toHaveBeenCalled();
      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).not.toHaveBeenCalled();
    });

    it('does NOT call deactivateOtherActiveTransactionsAtEvse when transaction creation errors', async () => {
      const { handler, transactionService } = makeHandler({
        transactionEventRepository: {
          createTransactionByStartTransaction: vi
            .fn()
            .mockRejectedValue(new Error('transient db error')),
        },
      });

      const payload: OCPP1_6.StartTransactionRequest = {
        connectorId: 1,
        idTag: 'TAG001',
        meterStart: 0,
        timestamp: new Date().toISOString(),
      };

      await handler.handle(makeMessage(payload));

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).not.toHaveBeenCalled();
    });

    it('throws and does NOT call deactivateOtherActiveTransactionsAtEvse when connector is not found', async () => {
      const { handler, connectorRepository, transactionService } = makeHandler();
      (
        connectorRepository.readConnectorByStationIdAndOcpp16ConnectorId as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      const payload: OCPP1_6.StartTransactionRequest = {
        connectorId: 99,
        idTag: 'TAG001',
        meterStart: 0,
        timestamp: new Date().toISOString(),
      };

      await expect(handler.handle(makeMessage(payload))).rejects.toThrow(
        'Unable to find connector 99',
      );

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).not.toHaveBeenCalled();
    });
  });

  describe('authorization attempts', () => {
    const payload: OCPP1_6.StartTransactionRequest = {
      connectorId: 1,
      idTag: 'TAG001',
      meterStart: 0,
      timestamp: new Date().toISOString(),
    };

    function acceptingTransactionService() {
      return {
        authorizeOcpp16IdToken: vi.fn(
          async (_context: unknown, _idTag: string, _connectorId: number, decision) => {
            decision.reason = AuthorizationAttemptReasonEnum.Accepted;
            return {
              idTagInfo: { status: OCPP1_6.StartTransactionResponseStatus.Accepted },
              transactionId: 0,
            };
          },
        ),
      };
    }

    it('records the accepted idTag against the transaction it started', async () => {
      const transaction = { id: 9, transactionId: '100', createdAt: new Date() };
      const { handler, authorizationAttemptService } = makeHandler({
        transactionService: acceptingTransactionService(),
        transactionEventRepository: {
          createTransactionByStartTransaction: vi.fn().mockResolvedValue(transaction),
        },
      });
      const message = makeMessage(payload);

      const { context } = message;

      await handler.handle(message);

      expect(authorizationAttemptService.record).toHaveBeenCalledWith(context, {
        ocppVersion: OCPPVersion.OCPP1_6,
        action: OCPP_CallAction.StartTransaction,
        idToken: 'TAG001',
        decision: { reason: AuthorizationAttemptReasonEnum.Accepted },
        responseStatus: OCPP1_6.StartTransactionResponseStatus.Accepted,
        connectorId: 1,
        transaction,
      });
    });

    it('records an Error when the accepted transaction could not be created', async () => {
      const { handler, authorizationAttemptService } = makeHandler({
        transactionService: acceptingTransactionService(),
        transactionEventRepository: {
          createTransactionByStartTransaction: vi.fn().mockRejectedValue(new Error('db down')),
        },
      });

      await handler.handle(makeMessage(payload));

      expect(authorizationAttemptService.record.mock.calls[0][1]).toMatchObject({
        decision: { reason: AuthorizationAttemptReasonEnum.Error },
        responseStatus: OCPP1_6.StartTransactionResponseStatus.Invalid,
        transaction: undefined,
      });
    });
  });
});
