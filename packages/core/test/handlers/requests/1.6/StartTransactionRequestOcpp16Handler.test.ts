// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
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
      // authorizeOcpp16IdToken seeds every response with 0 and only the accepted path replaces it.
      transactionId: 0,
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

    /**
     * The point of the sweep is that a *new* transaction has taken the connector, so anything still
     * marked active there is stale. A StartTransaction the CSMS refused starts nothing, and
     * authorizeOcpp16IdToken seeds the response with transactionId 0, so the "exclude the new
     * transaction" filter matches nothing and every live transaction on that connector is closed -
     * including the one that is actually charging.
     */
    it('does not sweep the connector when the idTag was refused', async () => {
      const { handler, transactionService } = makeHandler({
        transactionService: {
          authorizeOcpp16IdToken: vi.fn().mockResolvedValue({
            idTagInfo: { status: OCPP1_6.StartTransactionResponseStatus.Invalid },
            transactionId: 0,
          }),
        },
      });

      await handler.handle(
        makeMessage({
          connectorId: 1,
          idTag: 'UNKNOWN',
          meterStart: 0,
          timestamp: new Date().toISOString(),
        } as OCPP1_6.StartTransactionRequest),
      );

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).not.toHaveBeenCalled();
    });

    it('does not sweep the connector when the transaction could not be created', async () => {
      const { handler, transactionService } = makeHandler({
        transactionEventRepository: {
          createTransactionByStartTransaction: vi
            .fn()
            .mockRejectedValue(new Error('Charging station station-001 does not exist')),
        },
      });

      await handler.handle(
        makeMessage({
          connectorId: 1,
          idTag: 'TAG001',
          meterStart: 0,
          timestamp: new Date().toISOString(),
        } as OCPP1_6.StartTransactionRequest),
      );

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).not.toHaveBeenCalled();
    });

    it('does not consume a reservation when the idTag was refused', async () => {
      const { handler, transactionService } = makeHandler({
        transactionService: {
          authorizeOcpp16IdToken: vi.fn().mockResolvedValue({
            idTagInfo: { status: OCPP1_6.StartTransactionResponseStatus.Invalid },
            transactionId: 0,
          }),
        },
      });

      await handler.handle(
        makeMessage({
          connectorId: 1,
          idTag: 'UNKNOWN',
          meterStart: 0,
          reservationId: 5,
          timestamp: new Date().toISOString(),
        } as OCPP1_6.StartTransactionRequest),
      );

      expect(transactionService.deactivateReservation).not.toHaveBeenCalled();
    });
  });
});
