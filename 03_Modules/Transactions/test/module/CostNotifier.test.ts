// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ITransactionEventRepository, Transaction } from '@citrineos/data';
import {
  AbstractModule,
  DEFAULT_TENANT_ID,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { CostCalculator } from '../../src/module/CostCalculator.js';
import { CostNotifier } from '../../src/module/CostNotifier.js';
import { aTransaction } from '../providers/TransactionProvider.js';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('CostNotifier', () => {
  const anyTenantId = DEFAULT_TENANT_ID;

  let transactionEventRepository: Mocked<ITransactionEventRepository>;
  let module: Mocked<AbstractModule>;
  let costCalculator: Mocked<CostCalculator>;
  let costNotifier: CostNotifier;

  beforeEach(() => {
    vi.useFakeTimers();

    transactionEventRepository = {
      readTransactionByStationIdAndTransactionId: vi.fn(),
      updateTransactionTotalCostById: vi.fn(),
    } as unknown as Mocked<ITransactionEventRepository>;

    module = {
      sendCall: vi.fn(),
    } as unknown as Mocked<AbstractModule>;

    costCalculator = {
      calculateTotalCost: vi.fn(),
    } as unknown as Mocked<CostCalculator>;

    costNotifier = new CostNotifier(module, transactionEventRepository, costCalculator);
  });

  afterEach(() => {
    transactionEventRepository.readTransactionByStationIdAndTransactionId.mockReset();
    module.sendCall.mockReset();
    costCalculator.calculateTotalCost.mockReset();
    vi.clearAllTimers();
  });

  describe('notifyWhileActive', () => {
    beforeEach(() => {
      module.sendCall.mockResolvedValue({
        success: true,
      });
    });

    it('should periodically send cost updates', async () => {
      const intervalSeconds = 1;
      const transaction = givenTransaction(aTransaction());

      costNotifier.notifyWhileActive(
        transaction.stationId,
        transaction.transactionId,
        anyTenantId,
        intervalSeconds,
      );

      expect(module.sendCall).toHaveBeenCalledTimes(0);

      const firstTotalCost = givenTotalCost(3.41);
      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(1);
      assertLastCostUpdatedCall(transaction, anyTenantId, firstTotalCost);

      const secondTotalCost = givenTotalCost(6.84);
      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(2);
      assertLastCostUpdatedCall(transaction, anyTenantId, secondTotalCost);

      const thirdTotalCost = givenTotalCost(11.14);
      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(3);
      assertLastCostUpdatedCall(transaction, anyTenantId, thirdTotalCost);
    });

    it('should stop sending cost updates when transaction becomes inactive', async () => {
      const intervalSeconds = 1;
      const transaction = givenTransaction(aTransaction());

      costNotifier.notifyWhileActive(
        transaction.stationId,
        transaction.transactionId,
        anyTenantId,
        intervalSeconds,
      );

      expect(module.sendCall).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(2);

      givenTransaction({ ...transaction, isActive: false } as Transaction);
      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate schedules for the same station and transaction', async () => {
      const intervalSeconds = 1;
      const transaction = givenTransaction(aTransaction());

      costNotifier.notifyWhileActive(
        transaction.stationId,
        transaction.transactionId,
        anyTenantId,
        intervalSeconds,
      );

      costNotifier.notifyWhileActive(
        transaction.stationId,
        transaction.transactionId,
        anyTenantId,
        intervalSeconds,
      );

      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(1);
    });
  });

  function assertLastCostUpdatedCall(
    transaction: Transaction,
    tenantId: number,
    totalCost: number,
  ) {
    expect(module.sendCall).toHaveBeenLastCalledWith(
      transaction.stationId,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.CostUpdated,
      {
        totalCost: totalCost,
        transactionId: transaction.transactionId,
      },
    );
  }

  function givenTotalCost(cost: number) {
    costCalculator.calculateTotalCost.mockResolvedValue(cost);
    return cost;
  }

  function givenTransaction(transaction: Transaction) {
    transactionEventRepository.readTransactionByStationIdAndTransactionId.mockResolvedValue(
      transaction,
    );
    return transaction;
  }
});
