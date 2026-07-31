// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import type { IMessage, OcppRequest } from '@citrineos/base';
import {
  DEFAULT_TENANT_ID,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import type {
  ILocationRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import { StartTransactionRequestOcpp16Handler } from '@handlers/index.js';
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
    action: OCPP_CallAction.StartTransaction,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

function makeHandler(
  overrides: {
    locationRepository?: Partial<ILocationRepository>;
    transactionEventRepository?: Partial<ITransactionEventRepository>;
    transactionService?: Record<string, unknown>;
  } = {},
) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const locationRepository = {
    readConnectorByStationIdAndOcpp16ConnectorId: vi.fn().mockResolvedValue({
      id: 1,
      evse: { evseTypeId: 42 },
    }),
    ...overrides.locationRepository,
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

  const handler = new StartTransactionRequestOcpp16Handler({
    logger,
    ocppSender,
    locationRepository: locationRepository as unknown as ILocationRepository,
    transactionEventRepository:
      transactionEventRepository as unknown as ITransactionEventRepository,
    transactionService: transactionService as any,
  });

  return {
    handler,
    ocppSender,
    locationRepository,
    transactionEventRepository,
    transactionService,
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

    it('throws and does NOT call deactivateOtherActiveTransactionsAtEvse when connector is not found', async () => {
      const { handler, locationRepository, transactionService } = makeHandler();
      (
        locationRepository.readConnectorByStationIdAndOcpp16ConnectorId as ReturnType<typeof vi.fn>
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
});
