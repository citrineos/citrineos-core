// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { EventGroup, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type {
  IChangeConfigurationRepository,
  IConnectorRepository,
  ITariffRepository,
  ITransactionEventRepository,
} from '@citrineos/dal';
import type { Connector, Transaction } from '@citrineos/dal';
import { CaliforniaPricingService } from '@modules/california-pricing/california-pricing-service.js';
import {
  COSTMSG_VENDOR_ID,
  CostMsgId,
  CUSTOM_DISPLAY_COST_AND_PRICE_KEY,
  DEFAULT_PRICE_KEY,
} from '@modules/california-pricing/costmsg.js';
import type { CostCalculator } from '@modules/transactions/cost-calculator.js';
import { createTestContainer, getTestInstance, makeMockOcppSender } from '@test/test-container.js';
import { aTariff } from '../transactions/providers/tariff.js';

const STATION = 'station-001';
const START_TIME = '2026-09-07T15:00:00Z';

describe('CaliforniaPricingService', () => {
  const { container, logger } = createTestContainer();

  let changeConfigurationRepository: Mocked<IChangeConfigurationRepository>;
  let tariffRepository: Mocked<ITariffRepository>;
  let transactionEventRepository: Mocked<ITransactionEventRepository>;
  let locationRepository: Mocked<IConnectorRepository>;
  let costCalculator: Mocked<CostCalculator>;
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let service: CaliforniaPricingService;

  beforeEach(() => {
    vi.clearAllMocks();

    changeConfigurationRepository = {
      findByStationAndKey: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IChangeConfigurationRepository>;

    tariffRepository = {
      findByConnectorId: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<ITariffRepository>;

    transactionEventRepository = {
      readTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<ITransactionEventRepository>;

    locationRepository = {
      readConnectorsByStationId: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IConnectorRepository>;

    costCalculator = {
      calculateTotalCost: vi.fn().mockResolvedValue(0),
    } as unknown as Mocked<CostCalculator>;

    ocppSender = makeMockOcppSender();

    service = getTestInstance(container, CaliforniaPricingService, {
      changeConfigurationRepository,
      tariffRepository,
      transactionEventRepository,
      locationRepository,
      costCalculator,
      ocppSender,
    });
  });

  describe('isEnabled', () => {
    it('is true only when the charger reported the key as true', async () => {
      givenConfiguration(CUSTOM_DISPLAY_COST_AND_PRICE_KEY, 'true');
      await expect(service.isEnabled(DEFAULT_TENANT_ID, STATION)).resolves.toBe(true);
    });

    it.each(['false', 'TRUE', ''])('is false for value %s', async (value) => {
      givenConfiguration(CUSTOM_DISPLAY_COST_AND_PRICE_KEY, value);
      await expect(service.isEnabled(DEFAULT_TENANT_ID, STATION)).resolves.toBe(false);
    });

    it('is false when the key was never reported', async () => {
      await expect(service.isEnabled(DEFAULT_TENANT_ID, STATION)).resolves.toBe(false);
    });
  });

  describe('resolvePrice', () => {
    it('reports the tariff per-minute price as a price per hour', async () => {
      givenTransaction({ connectorId: 3 });
      tariffRepository.findByConnectorId.mockResolvedValue(
        aTariff({ pricePerKwh: 10, pricePerMin: 10, pricePerSession: 77 }),
      );

      await expect(service.resolvePrice(DEFAULT_TENANT_ID, STATION, 22)).resolves.toEqual({
        kWhPrice: 10,
        hourPrice: 600,
        flatFee: 77,
      });
      expect(tariffRepository.findByConnectorId).toHaveBeenCalledWith(DEFAULT_TENANT_ID, 3);
    });

    it('falls back to zero prices when the connector has no tariff', async () => {
      givenTransaction({ connectorId: 1 });

      await expect(service.resolvePrice(DEFAULT_TENANT_ID, STATION, 22)).resolves.toEqual({
        kWhPrice: 0,
        hourPrice: 0,
        flatFee: 0,
      });
    });

    it('returns undefined without a transaction id', async () => {
      await expect(
        service.resolvePrice(DEFAULT_TENANT_ID, STATION, undefined),
      ).resolves.toBeUndefined();
      expect(
        transactionEventRepository.readTransactionByStationIdAndTransactionId,
      ).not.toHaveBeenCalled();
    });

    it('returns undefined when the transaction is unknown', async () => {
      await expect(service.resolvePrice(DEFAULT_TENANT_ID, STATION, 22)).resolves.toBeUndefined();
    });

    it('returns undefined when the transaction has no connector', async () => {
      givenTransaction({ connectorId: undefined });
      await expect(service.resolvePrice(DEFAULT_TENANT_ID, STATION, 22)).resolves.toBeUndefined();
    });
  });

  describe('calculateCost', () => {
    it('costs the reading being handled rather than the persisted snapshot', async () => {
      // Snapshot lags one interval behind: 11.9 kWh at 47 minutes.
      const transaction = givenTransaction({
        connectorId: 1,
        meterStart: 0,
        totalKwh: 11.9,
        timeSpentCharging: 2820,
        startTime: START_TIME,
      });

      await service.calculateCost(DEFAULT_TENANT_ID, STATION, 22, {
        meterKwh: 13.2,
        timestamp: '2026-09-07T15:52:00Z',
      });

      expect(costCalculator.calculateTotalCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        transaction,
      );
      expect(transaction.totalKwh).toBe(13.2);
      expect(transaction.timeSpentCharging).toBe(52 * 60);
    });

    it('subtracts the meter start from the reading', async () => {
      const transaction = givenTransaction({
        connectorId: 1,
        meterStart: 5,
        startTime: START_TIME,
      });

      await service.calculateCost(DEFAULT_TENANT_ID, STATION, 22, {
        meterKwh: 13.5,
        timestamp: '2026-09-07T15:30:00Z',
      });

      expect(transaction.totalKwh).toBe(8.5);
    });

    it('never reports negative elapsed time', async () => {
      const transaction = givenTransaction({ connectorId: 1, startTime: START_TIME });

      await service.calculateCost(DEFAULT_TENANT_ID, STATION, 22, {
        meterKwh: 1,
        timestamp: '2026-09-07T14:59:00Z',
      });

      expect(transaction.timeSpentCharging).toBe(0);
    });

    it('returns undefined when the transaction is unknown', async () => {
      await expect(
        service.calculateCost(DEFAULT_TENANT_ID, STATION, 22, {
          meterKwh: 1,
          timestamp: START_TIME,
        }),
      ).resolves.toBeUndefined();
      expect(costCalculator.calculateTotalCost).not.toHaveBeenCalled();
    });
  });

  describe('applyStationDefaultPrice', () => {
    it('sends nothing when the station has no connectors', async () => {
      await service.applyStationDefaultPrice(DEFAULT_TENANT_ID, STATION, null);

      expect(ocppSender.sendCall).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });

    it('sends nothing when connectors use different tariffs', async () => {
      givenConnectors([
        { id: 1, tariffId: 1 },
        { id: 2, tariffId: 2 },
      ]);

      await service.applyStationDefaultPrice(DEFAULT_TENANT_ID, STATION, null);

      expect(ocppSender.sendCall).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it('lists only the price components that are set and non-zero', async () => {
      givenConnectors([{ id: 1, tariffId: 1 }]);
      tariffRepository.findByConnectorId.mockResolvedValue(
        aTariff({ currency: 'USD', pricePerKwh: 10, pricePerMin: 0, pricePerSession: 77 }),
      );

      await service.applyStationDefaultPrice(DEFAULT_TENANT_ID, STATION, null);

      expect(sentDefaultPrice()).toEqual({
        priceText: '10 USD/kWh + 77 USD',
        chargingPrice: { kWhPrice: 10, hourPrice: 0, flatFee: 77 },
      });
    });

    it('falls back to a placeholder text when the shared tariff is missing', async () => {
      givenConnectors([{ id: 1, tariffId: null }]);

      await service.applyStationDefaultPrice(DEFAULT_TENANT_ID, STATION, null);

      expect(sentDefaultPrice()).toEqual({
        priceText: 'No tariff configured',
        chargingPrice: { kWhPrice: 0, hourPrice: 0, flatFee: 0 },
      });
    });

    it('skips the send when the station already reports the price it would set', async () => {
      givenUsdTariffOnOneConnector();

      await service.applyStationDefaultPrice(
        DEFAULT_TENANT_ID,
        STATION,
        '{ "chargingPrice": { "flatFee": 77, "hourPrice": 0, "kWhPrice": 10 },\n' +
          '  "priceText": "10 USD/kWh + 77 USD" }',
      );

      expect(ocppSender.sendCall).not.toHaveBeenCalled();
    });

    it('sends when the station reports a different price', async () => {
      givenUsdTariffOnOneConnector();

      await service.applyStationDefaultPrice(
        DEFAULT_TENANT_ID,
        STATION,
        JSON.stringify({ priceText: 'stale' }),
      );

      expect(ocppSender.sendCall).toHaveBeenCalledOnce();
    });
  });

  describe('sendDefaultPrice', () => {
    const data = { priceText: '1 USD/kWh', chargingPrice: { kWhPrice: 1 } };

    it('sets the configuration key', async () => {
      await service.sendDefaultPrice(DEFAULT_TENANT_ID, STATION, data);

      expect(ocppSender.sendCall).toHaveBeenCalledWith(
        expect.objectContaining({
          ocppConnectionName: STATION,
          protocol: OCPPVersion.OCPP1_6,
          action: OCPP_CallAction.ChangeConfiguration,
          eventGroup: EventGroup.CaliforniaPricing,
          payload: { key: DEFAULT_PRICE_KEY, value: JSON.stringify(data) },
        }),
      );
    });

    it('logs when the charger rejects the call', async () => {
      ocppSender.sendCall.mockResolvedValue({ success: false, payload: 'nope' });

      await service.sendDefaultPrice(DEFAULT_TENANT_ID, STATION, data);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('requestCustomDisplayCostAndPrice', () => {
    it('asks for the one key rather than the whole configuration', async () => {
      await service.requestCustomDisplayCostAndPrice(DEFAULT_TENANT_ID, STATION);

      expect(ocppSender.sendCall).toHaveBeenCalledWith(
        expect.objectContaining({
          ocppConnectionName: STATION,
          protocol: OCPPVersion.OCPP1_6,
          action: OCPP_CallAction.GetConfiguration,
          eventGroup: EventGroup.CaliforniaPricing,
          payload: { key: [CUSTOM_DISPLAY_COST_AND_PRICE_KEY] },
        }),
      );
    });

    it('logs when the charger rejects the call', async () => {
      ocppSender.sendCall.mockResolvedValue({ success: false, payload: 'nope' });

      await service.requestCustomDisplayCostAndPrice(DEFAULT_TENANT_ID, STATION);

      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('costmsg DataTransfer', () => {
    it.each([
      {
        name: 'RunningCost',
        messageId: CostMsgId.RunningCost,
        send: () =>
          service.sendRunningCost(DEFAULT_TENANT_ID, STATION, {
            transactionId: 22,
            timestamp: START_TIME,
            meterValue: 13200,
            cost: 729,
            state: 'Charging',
            chargingPrice: { kWhPrice: 10 },
          }),
      },
      {
        name: 'FinalCost',
        messageId: CostMsgId.FinalCost,
        send: () =>
          service.sendFinalCost(DEFAULT_TENANT_ID, STATION, {
            transactionId: 22,
            cost: 729,
            priceText: 'Final cost is 729',
          }),
      },
      {
        name: 'SetUserPrice',
        messageId: CostMsgId.SetUserPrice,
        send: () =>
          service.sendSetUserPrice(DEFAULT_TENANT_ID, STATION, {
            idToken: 'TAG001',
            priceText: '1 USD/kWh',
          }),
      },
    ])('sends $name under the costmsg vendor id', async ({ messageId, send }) => {
      await send();

      const call = ocppSender.sendCall.mock.calls[0][0];
      expect(call).toMatchObject({
        action: OCPP_CallAction.DataTransfer,
        protocol: OCPPVersion.OCPP1_6,
        eventGroup: EventGroup.CaliforniaPricing,
      });
      expect(call.payload.vendorId).toBe(COSTMSG_VENDOR_ID);
      expect(call.payload.messageId).toBe(messageId);
      expect(() => JSON.parse(call.payload.data)).not.toThrow();
    });
  });

  function givenConfiguration(key: string, value: string) {
    changeConfigurationRepository.findByStationAndKey.mockImplementation(
      async (_tenantId: number, _ocppConnectionName: string, requestedKey: string) =>
        requestedKey === key ? ({ key, value } as never) : undefined,
    );
  }

  function givenTransaction(overrides: Partial<Transaction>): Transaction {
    const transaction = { id: 1, ...overrides } as Transaction;
    transactionEventRepository.readTransactionByStationIdAndTransactionId.mockResolvedValue(
      transaction,
    );
    return transaction;
  }

  function givenConnectors(connectors: { id: number; tariffId: number | null }[]) {
    locationRepository.readConnectorsByStationId.mockResolvedValue(connectors as Connector[]);
  }

  function givenUsdTariffOnOneConnector() {
    givenConnectors([{ id: 1, tariffId: 1 }]);
    tariffRepository.findByConnectorId.mockResolvedValue(
      aTariff({ currency: 'USD', pricePerKwh: 10, pricePerMin: 0, pricePerSession: 77 }),
    );
  }

  function sentDefaultPrice() {
    const call = ocppSender.sendCall.mock.calls[0][0];
    expect(call.payload.key).toBe(DEFAULT_PRICE_KEY);
    return JSON.parse(call.payload.value);
  }
});
