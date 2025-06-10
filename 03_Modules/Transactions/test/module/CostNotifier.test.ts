import { expect, jest } from '@jest/globals';
import { ITransactionEventRepository, Transaction } from '@citrineos/data';
import {
  AbstractModule,
  DEFAULT_TENANT_ID,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { CostCalculator } from '../../src/module/CostCalculator';
import { CostNotifier } from '../../src/module/CostNotifier';
import { aTransaction } from '../providers/TransactionProvider';

describe('CostNotifier', () => {
  const anyTenantId = DEFAULT_TENANT_ID;

  let transactionEventRepository: jest.Mocked<ITransactionEventRepository>;
  let module: jest.Mocked<AbstractModule>;
  let costCalculator: jest.Mocked<CostCalculator>;
  let costNotifier: CostNotifier;

  beforeEach(() => {
    jest.useFakeTimers();

    transactionEventRepository = {
      readTransactionByStationIdAndTransactionId: jest.fn(),
      updateTransactionTotalCostById: jest.fn(),
    } as unknown as jest.Mocked<ITransactionEventRepository>;

    module = {
      sendCall: jest.fn(),
    } as unknown as jest.Mocked<AbstractModule>;

    costCalculator = {
      calculateTotalCost: jest.fn(),
    } as unknown as jest.Mocked<CostCalculator>;

    costNotifier = new CostNotifier(module, transactionEventRepository, costCalculator);
  });

  afterEach(() => {
    transactionEventRepository.readTransactionByStationIdAndTransactionId.mockReset();
    module.sendCall.mockReset();
    costCalculator.calculateTotalCost.mockReset();
    jest.clearAllTimers();
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
      await jest.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(1);
      assertLastCostUpdatedCall(transaction, anyTenantId, firstTotalCost);

      const secondTotalCost = givenTotalCost(6.84);
      await jest.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(2);
      assertLastCostUpdatedCall(transaction, anyTenantId, secondTotalCost);

      const thirdTotalCost = givenTotalCost(11.14);
      await jest.advanceTimersByTimeAsync(intervalSeconds * 1000);
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

      await jest.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(intervalSeconds * 1000);
      expect(module.sendCall).toHaveBeenCalledTimes(2);

      givenTransaction({ ...transaction, isActive: false } as Transaction);
      await jest.advanceTimersByTimeAsync(intervalSeconds * 1000);
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

      await jest.advanceTimersByTimeAsync(intervalSeconds * 1000);
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
