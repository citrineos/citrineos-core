// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  type SystemConfig,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { ITransactionEventRepository } from '@citrineos/dal';
import { MeterValuesRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';
import { describe, expect, it, vi } from 'vitest';

function makeConfig(sendCostUpdatedOnMeterValue: boolean): SystemConfig {
  return {
    transactions: {
      requests: [],
      responses: [],
      sendCostUpdatedOnMeterValue,
    },
  } as unknown as SystemConfig;
}

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
    action: OCPP_CallAction.MeterValues,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

const ACTIVE_TRANSACTION = {
  id: 42,
  transactionId: 'txn-001',
  tariffId: 7,
  isActive: true,
  totalKwh: 12.5,
};

function makeRequest(evseId: number): OCPP2_0_1.MeterValuesRequest {
  return {
    evseId,
    meterValue: [
      {
        timestamp: new Date().toISOString(),
        sampledValue: [
          {
            value: 112.5,
            context: OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
            measurand: OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
            unitOfMeasure: { unit: 'kWh', multiplier: 0 },
          },
        ],
      },
    ],
  } as OCPP2_0_1.MeterValuesRequest;
}

function makeHandler(
  overrides: {
    sendCostUpdatedOnMeterValue?: boolean;
    activeTransaction?: unknown;
  } = {},
) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const transactionEventRepository = {
    getActiveTransactionByStationIdAndEvseId: vi
      .fn()
      .mockResolvedValue(
        'activeTransaction' in overrides ? overrides.activeTransaction : ACTIVE_TRANSACTION,
      ),
  };

  const transactionService = {
    createMeterValues: vi.fn().mockResolvedValue([]),
    recalculateTotalKwh: vi.fn().mockResolvedValue(12.5),
  };

  const costNotifier = { calculateCostAndNotify: vi.fn().mockResolvedValue(undefined) };
  const signedMeterValuesUtil = { validateMeterValues: vi.fn().mockResolvedValue(true) };

  const handler = new MeterValuesRequestOcpp2Handler({
    logger,
    ocppSender,
    config: makeConfig(overrides.sendCostUpdatedOnMeterValue ?? false),
    costNotifier: costNotifier as any,
    signedMeterValuesUtil: signedMeterValuesUtil as any,
    transactionEventRepository:
      transactionEventRepository as unknown as ITransactionEventRepository,
    transactionService: transactionService as any,
  });

  return { handler, ocppSender, transactionEventRepository, transactionService, costNotifier };
}

describe('MeterValuesRequestOcpp2Handler', () => {
  describe('transaction association', () => {
    // Attaching a meter value to its transaction is what makes it billable and what the
    // operator UI reads; it must not depend on whether cost notifications are switched on.
    it('links meter values to the active transaction on the EVSE', async () => {
      const { handler, transactionService } = makeHandler();

      await handler.handle(makeMessage(makeRequest(1)));

      expect(transactionService.createMeterValues).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.any(Array),
        ACTIVE_TRANSACTION.id,
        ACTIVE_TRANSACTION.transactionId,
        ACTIVE_TRANSACTION.tariffId,
      );
    });

    it('links meter values when cost updates are driven by the interval instead', async () => {
      const { handler, transactionService } = makeHandler({ sendCostUpdatedOnMeterValue: false });

      await handler.handle(makeMessage(makeRequest(1)));

      expect(transactionService.createMeterValues).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.any(Array),
        ACTIVE_TRANSACTION.id,
        ACTIVE_TRANSACTION.transactionId,
        ACTIVE_TRANSACTION.tariffId,
      );
    });

    it('recalculates totalKwh from the newly stored meter values', async () => {
      const { handler, transactionService } = makeHandler();

      await handler.handle(makeMessage(makeRequest(1)));

      expect(transactionService.recalculateTotalKwh).toHaveBeenCalledOnce();
    });

    it('stores meter values unlinked when evseId is 0', async () => {
      // evseId 0 addresses the whole Charging Station, so there is no transaction to attach to.
      const { handler, transactionService, transactionEventRepository } = makeHandler();

      await handler.handle(makeMessage(makeRequest(0)));

      expect(
        transactionEventRepository.getActiveTransactionByStationIdAndEvseId,
      ).not.toHaveBeenCalled();
      expect(transactionService.createMeterValues).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.any(Array),
      );
      expect(transactionService.recalculateTotalKwh).not.toHaveBeenCalled();
    });

    it('stores meter values unlinked when the EVSE has no active transaction', async () => {
      const { handler, transactionService } = makeHandler({ activeTransaction: undefined });

      await handler.handle(makeMessage(makeRequest(1)));

      expect(transactionService.createMeterValues).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.any(Array),
        undefined,
        undefined,
        undefined,
      );
      expect(transactionService.recalculateTotalKwh).not.toHaveBeenCalled();
    });
  });

  describe('cost notification', () => {
    it('notifies cost when sendCostUpdatedOnMeterValue is enabled', async () => {
      const { handler, costNotifier } = makeHandler({ sendCostUpdatedOnMeterValue: true });

      await handler.handle(makeMessage(makeRequest(1)));

      expect(costNotifier.calculateCostAndNotify).toHaveBeenCalledOnce();
    });

    it('does not notify cost when sendCostUpdatedOnMeterValue is disabled', async () => {
      const { handler, costNotifier } = makeHandler({ sendCostUpdatedOnMeterValue: false });

      await handler.handle(makeMessage(makeRequest(1)));

      expect(costNotifier.calculateCostAndNotify).not.toHaveBeenCalled();
    });
  });
});
