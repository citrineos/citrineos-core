// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { type ITariffRepository, Tariff } from '@citrineos/core';
import { CostCalculator } from '@modules/Transactions/src/module/CostCalculator.js';
import { TransactionService } from '@modules/Transactions/src/module/TransactionService.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { afterEach, beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { aTariff } from '../providers/Tariff.js';
import { aTransaction } from '../providers/TransactionProvider.js';

describe('CostCalculator', () => {
  const { container } = createTestContainer();
  let tariffRepository: Mocked<ITariffRepository>;
  let transactionService: Mocked<TransactionService>;
  let costCalculator: CostCalculator;

  beforeEach(() => {
    tariffRepository = {
      findByConnectorId: vi.fn(),
    } as unknown as Mocked<ITariffRepository>;

    transactionService = {
      recalculateTotalKwh: vi.fn(),
    } as unknown as Mocked<TransactionService>;

    costCalculator = getTestInstance(container, CostCalculator, {
      tariffRepository,
      transactionService,
    });
  });

  afterEach(() => {
    tariffRepository.findByConnectorId.mockReset();
    transactionService.recalculateTotalKwh.mockReset();
  });

  describe('calculateTotalCost', () => {
    it.each([
      { tariff: anEnergyTariff(0.09), kwh: 20, expectedCost: 1.8 },
      { tariff: anEnergyTariff(0.14), kwh: 20, expectedCost: 2.8 },
      { tariff: anEnergyTariff(0.23), kwh: 20, expectedCost: 4.6 },
      { tariff: anEnergyTariff(0.25), kwh: 20, expectedCost: 5.0 },
      { tariff: anEnergyTariff(0.47), kwh: 20, expectedCost: 9.4 },
      { tariff: anEnergyTariff(0.61), kwh: 20, expectedCost: 12.2 },
    ])('should calculate cost using provided kWh', async ({ tariff, kwh, expectedCost }) => {
      givenTariff(tariff);
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, aChargingTransaction(kwh)),
      ).toBe(expectedCost);
    });

    it.each([
      { tariff: anEnergyTariff(0.09), kwh: 20.99, expectedCost: 1.88 },
      { tariff: anEnergyTariff(0.14), kwh: 20.99, expectedCost: 2.93 },
      { tariff: anEnergyTariff(0.23), kwh: 20.99, expectedCost: 4.82 },
      { tariff: anEnergyTariff(0.25), kwh: 20.99, expectedCost: 5.24 },
      { tariff: anEnergyTariff(0.47), kwh: 20.99, expectedCost: 9.86 },
      { tariff: anEnergyTariff(0.61), kwh: 20.99, expectedCost: 12.8 },
    ])('should floor cost to 2 decimal places', async ({ tariff, kwh, expectedCost }) => {
      givenTariff(tariff);
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, aChargingTransaction(kwh)),
      ).toBe(expectedCost);
    });

    it('should add time cost using minutes converted from timeSpentCharging seconds', async () => {
      givenTariff(aTariff({ pricePerKwh: undefined, pricePerMin: 0.3, pricePerSession: null }));
      const transaction = aChargingTransaction(0, 120);
      expect(await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, transaction)).toBe(0.6);
    });

    it('should add per-session cost', async () => {
      givenTariff(
        aTariff({ pricePerKwh: undefined, pricePerMin: undefined, pricePerSession: 1.5 }),
      );
      const transaction = aChargingTransaction(0, 0);
      expect(await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, transaction)).toBe(1.5);
    });

    it('should sum energy, time and session costs', async () => {
      givenTariff(aTariff({ pricePerKwh: 0.2, pricePerMin: 0.1, pricePerSession: 1 }));
      const transaction = aChargingTransaction(10, 600);
      // 10 kWh * 0.2 + 10 min * 0.1 + 1 session = 2 + 1 + 1
      expect(await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, transaction)).toBe(4);
    });

    it('should return 0 when tariff not found', async () => {
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, aChargingTransaction(20.99)),
      ).toBe(0);
    });

    it('should return 0 when connectorId is not set', async () => {
      givenTariff(anEnergyTariff(0.61));
      const transaction = aChargingTransaction(20);
      transaction.connectorId = undefined;
      expect(await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, transaction)).toBe(0);
    });

    it('should return 0 when totalKwh is not set', async () => {
      givenTariff(anEnergyTariff(0.61));
      const transaction = aChargingTransaction(20);
      transaction.totalKwh = null;
      expect(await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, transaction)).toBe(0);
    });

    it('should return 0 when timeSpentCharging is not set', async () => {
      givenTariff(anEnergyTariff(0.61));
      const transaction = aChargingTransaction(20);
      transaction.timeSpentCharging = null;
      expect(await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, transaction)).toBe(0);
    });

    it('should return 0 when pricePerKwh is 0', async () => {
      givenTariff(anEnergyTariff(0.0));
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, aChargingTransaction(20.99)),
      ).toBe(0);
    });

    it('should return 0 when kWh is 0', async () => {
      givenTariff(anEnergyTariff(0.61));
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, aChargingTransaction(0)),
      ).toBe(0);
    });

    it.each([
      { tariff: anEnergyTariff(0.01), kwh: 0.99 },
      { tariff: anEnergyTariff(0.2), kwh: 0.049 },
      { tariff: anEnergyTariff(0.23), kwh: 0.02 },
    ])('should return 0 when calculated cost is less than 0.01', async ({ tariff, kwh }) => {
      givenTariff(tariff);
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, aChargingTransaction(kwh)),
      ).toBe(0);
    });
  });

  function anEnergyTariff(pricePerKwh: number): Tariff {
    return aTariff({ pricePerKwh, pricePerMin: null, pricePerSession: null });
  }

  function aChargingTransaction(totalKwh: number, timeSpentCharging = 0, connectorId = 1) {
    return aTransaction((transaction) => {
      transaction.connectorId = connectorId;
      transaction.totalKwh = totalKwh;
      transaction.timeSpentCharging = timeSpentCharging;
    });
  }

  function givenTariff(tariff: Tariff) {
    tariffRepository.findByConnectorId.mockResolvedValue(tariff);
    return tariff;
  }
});
