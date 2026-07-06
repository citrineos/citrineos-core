// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ITransactionEventRepository, Transaction } from '@citrineos/core';
import { DEFAULT_TENANT_ID, OCPPVersion } from '@citrineos/base';
import { CostCalculator } from '../../src/module/CostCalculator.js';
import { CostNotifier, CostUpdatedNotifier } from '../../src/module/CostNotifier.js';
import { aTransaction } from '../providers/TransactionProvider.js';
import { afterEach, beforeEach, describe, expect, it, Mock, Mocked, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '../../../../test/testContainer.js';

describe('CostNotifier', () => {
  const { container } = createTestContainer();
  const anyTenantId = DEFAULT_TENANT_ID;
  const anyProtocol = OCPPVersion.OCPP2_0_1;

  let transactionEventRepository: Mocked<ITransactionEventRepository>;
  let costUpdatedNotifier: Mock<CostUpdatedNotifier>;
  let costCalculator: Mocked<CostCalculator>;
  let costNotifier: CostNotifier;

  beforeEach(() => {
    vi.useFakeTimers();

    transactionEventRepository = {
      readTransactionByStationIdAndTransactionId: vi.fn(),
      updateTransactionTotalCostById: vi.fn(),
    } as unknown as Mocked<ITransactionEventRepository>;

    costUpdatedNotifier = vi.fn();

    costCalculator = {
      calculateTotalCost: vi.fn(),
    } as unknown as Mocked<CostCalculator>;

    costNotifier = getTestInstance(container, CostNotifier, {
      transactionEventRepository,
      costCalculator,
      costUpdatedNotifier,
    });
  });

  afterEach(() => {
    transactionEventRepository.readTransactionByStationIdAndTransactionId.mockReset();
    costUpdatedNotifier.mockReset();
    costCalculator.calculateTotalCost.mockReset();
    vi.clearAllTimers();
  });

  describe('notifyWhileActive', () => {
    beforeEach(() => {
      costUpdatedNotifier.mockResolvedValue(undefined);
    });

    it('should periodically send cost updates', async () => {
      const intervalSeconds = 1;
      const transaction = givenTransaction(aTransaction());

      costNotifier.notifyWhileActive(
        transaction.ocppConnectionName,
        transaction.transactionId,
        anyTenantId,
        intervalSeconds,
        anyProtocol,
      );

      expect(costUpdatedNotifier).toHaveBeenCalledTimes(0);

      const firstTotalCost = givenTotalCost(3.41);
      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(costUpdatedNotifier).toHaveBeenCalledTimes(1);
      assertLastCostUpdatedCall(transaction, anyTenantId, firstTotalCost);

      const secondTotalCost = givenTotalCost(6.84);
      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(costUpdatedNotifier).toHaveBeenCalledTimes(2);
      assertLastCostUpdatedCall(transaction, anyTenantId, secondTotalCost);

      const thirdTotalCost = givenTotalCost(11.14);
      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(costUpdatedNotifier).toHaveBeenCalledTimes(3);
      assertLastCostUpdatedCall(transaction, anyTenantId, thirdTotalCost);
    });

    it('should stop sending cost updates when transaction becomes inactive', async () => {
      const intervalSeconds = 1;
      const transaction = givenTransaction(aTransaction());

      costNotifier.notifyWhileActive(
        transaction.ocppConnectionName,
        transaction.transactionId,
        anyTenantId,
        intervalSeconds,
        anyProtocol,
      );

      expect(costUpdatedNotifier).toHaveBeenCalledTimes(0);

      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(costUpdatedNotifier).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(costUpdatedNotifier).toHaveBeenCalledTimes(2);

      givenTransaction({ ...transaction, isActive: false } as Transaction);
      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(costUpdatedNotifier).toHaveBeenCalledTimes(2);
    });

    it('should not duplicate schedules for the same station and transaction', async () => {
      const intervalSeconds = 1;
      const transaction = givenTransaction(aTransaction());

      costNotifier.notifyWhileActive(
        transaction.ocppConnectionName,
        transaction.transactionId,
        anyTenantId,
        intervalSeconds,
        anyProtocol,
      );

      costNotifier.notifyWhileActive(
        transaction.ocppConnectionName,
        transaction.transactionId,
        anyTenantId,
        intervalSeconds,
        anyProtocol,
      );

      await vi.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(costUpdatedNotifier).toHaveBeenCalledTimes(1);
    });
  });

  function assertLastCostUpdatedCall(
    transaction: Transaction,
    tenantId: number,
    totalCost: number,
  ) {
    expect(costUpdatedNotifier).toHaveBeenLastCalledWith({
      ocppConnectionName: transaction.ocppConnectionName,
      tenantId,
      totalCost,
      transactionId: transaction.transactionId,
      protocol: anyProtocol,
    });
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
