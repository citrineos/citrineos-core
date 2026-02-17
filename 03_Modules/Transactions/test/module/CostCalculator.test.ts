// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { ITariffRepository, Tariff } from '@citrineos/data';
import { faker } from '@faker-js/faker';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import { CostCalculator } from '../../src/module/CostCalculator.js';
import { TransactionService } from '../../src/module/TransactionService.js';
import { aTariff } from '../providers/Tariff.js';

describe('CostCalculator', () => {
  let tariffRepository: Mocked<ITariffRepository>;
  let transactionService: Mocked<TransactionService>;
  let costCalculator: CostCalculator;

  beforeEach(() => {
    tariffRepository = {
      findByStationId: vi.fn(),
    } as unknown as Mocked<ITariffRepository>;

    transactionService = {
      recalculateTotalKwh: vi.fn(),
    } as unknown as Mocked<TransactionService>;

    costCalculator = new CostCalculator(tariffRepository, transactionService);
  });

  afterEach(() => {
    tariffRepository.findByStationId.mockReset();
    transactionService.recalculateTotalKwh.mockReset();
  });

  describe('calculateTotalCost', () => {
    it.each([
      { tariff: aTariff({ pricePerKwh: 0.09 }), kwh: 20, expectedCost: 1.8 },
      { tariff: aTariff({ pricePerKwh: 0.14 }), kwh: 20, expectedCost: 2.8 },
      { tariff: aTariff({ pricePerKwh: 0.23 }), kwh: 20, expectedCost: 4.6 },
      { tariff: aTariff({ pricePerKwh: 0.25 }), kwh: 20, expectedCost: 5.0 },
      { tariff: aTariff({ pricePerKwh: 0.47 }), kwh: 20, expectedCost: 9.4 },
      { tariff: aTariff({ pricePerKwh: 0.61 }), kwh: 20, expectedCost: 12.2 },
    ])('should calculate cost using provided kWh', async ({ tariff, kwh, expectedCost }) => {
      givenTariff(tariff);
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, tariff.stationId, kwh),
      ).toBe(expectedCost);
    });

    it.each([
      {
        tariff: aTariff({ pricePerKwh: 0.09 }),
        kwh: 20.99,
        expectedCost: 1.88,
      },
      {
        tariff: aTariff({ pricePerKwh: 0.14 }),
        kwh: 20.99,
        expectedCost: 2.93,
      },
      {
        tariff: aTariff({ pricePerKwh: 0.23 }),
        kwh: 20.99,
        expectedCost: 4.82,
      },
      {
        tariff: aTariff({ pricePerKwh: 0.25 }),
        kwh: 20.99,
        expectedCost: 5.24,
      },
      {
        tariff: aTariff({ pricePerKwh: 0.47 }),
        kwh: 20.99,
        expectedCost: 9.86,
      },
      {
        tariff: aTariff({ pricePerKwh: 0.61 }),
        kwh: 20.99,
        expectedCost: 12.8,
      },
    ])('should floor cost to 2 decimal places', async ({ tariff, kwh, expectedCost }) => {
      givenTariff(tariff);
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, tariff.stationId, kwh),
      ).toBe(expectedCost);
    });

    it('should return 0 when tariff not found', async () => {
      const anyStationId = faker.string.uuid();
      expect(await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, anyStationId, 20.99)).toBe(
        0,
      );
    });

    it('should return 0 when pricePerKwh is 0', async () => {
      const tariff = givenTariff(aTariff({ pricePerKwh: 0.0 }));
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, tariff.stationId, 20.99),
      ).toBe(0);
    });

    it('should return 0 when kWh is 0', async () => {
      const tariff = givenTariff(aTariff({ pricePerKwh: 0.61 }));
      expect(await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, tariff.stationId, 0)).toBe(
        0,
      );
    });

    it.each([
      { tariff: aTariff({ pricePerKwh: 0.01 }), kwh: 0.99 },
      { tariff: aTariff({ pricePerKwh: 0.2 }), kwh: 0.049 },
      { tariff: aTariff({ pricePerKwh: 0.23 }), kwh: 0.02 },
    ])('should return 0 when calculated cost is less than 0.01', async ({ tariff, kwh }) => {
      givenTariff(tariff);
      expect(
        await costCalculator.calculateTotalCost(DEFAULT_TENANT_ID, tariff.stationId, kwh),
      ).toBe(0);
    });
  });

  function givenTariff(tariff: Tariff) {
    tariffRepository.findByStationId.mockResolvedValue(tariff);
    return tariff;
  }
});
