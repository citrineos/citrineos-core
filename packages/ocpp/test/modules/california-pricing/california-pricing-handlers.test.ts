// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { DEFAULT_TENANT_ID, type IMessage } from '@citrineos/base';
import {
  type OcppRequest,
  type OcppResponse,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import {
  CUSTOM_DISPLAY_COST_AND_PRICE_KEY,
  DEFAULT_PRICE_KEY,
} from '@modules/california-pricing/costmsg.js';
import type { CaliforniaPricingService } from '@modules/california-pricing/california-pricing-service.js';
import { CustomDisplayCostAndPriceOcpp16Handler } from '@modules/california-pricing/handlers/custom-display-cost-and-price-16-handler.js';
import { DefaultPriceCaliforniaPricingOcpp16Handler } from '@modules/california-pricing/handlers/default-price-ocpp-16-handler.js';
import { FinalCostCaliforniaPricingOcpp16Handler } from '@modules/california-pricing/handlers/final-cost-ocpp-16-handler.js';
import { RunningCostCaliforniaPricingOcpp16Handler } from '@modules/california-pricing/handlers/running-cost-ocpp-16-handler.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

const STATION = 'station-001';
const TIMESTAMP = '2026-09-07T15:52:00Z';

function makeMessage<T extends OcppRequest | OcppResponse>(
  payload: T,
  action: OCPP_CallAction,
  state: MessageState,
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-001',
      timestamp: TIMESTAMP,
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.CaliforniaPricing,
    action,
    state,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

function registerReading(
  value: string,
  timestamp: string,
  measurand?: OCPP1_6.MeterValuesRequestMeasurand,
): OCPP1_6.MeterValuesRequest['meterValue'][0] {
  return {
    timestamp,
    sampledValue: [
      {
        value,
        measurand,
        unit: OCPP1_6.MeterValuesRequestUnit.Wh,
      },
    ],
  } as OCPP1_6.MeterValuesRequest['meterValue'][0];
}

describe('CaliforniaPricing handlers', () => {
  const { container } = createTestContainer();
  let californiaPricingService: Mocked<CaliforniaPricingService>;

  beforeEach(() => {
    vi.clearAllMocks();
    californiaPricingService = {
      isEnabled: vi.fn().mockResolvedValue(true),
      resolvePrice: vi.fn().mockResolvedValue({ kWhPrice: 10, hourPrice: 600, flatFee: 77 }),
      calculateCost: vi.fn().mockResolvedValue(729),
      applyStationDefaultPrice: vi.fn().mockResolvedValue(undefined),
      sendRunningCost: vi.fn().mockResolvedValue(undefined),
      sendFinalCost: vi.fn().mockResolvedValue(undefined),
      sendSetUserPrice: vi.fn().mockResolvedValue(undefined),
      requestCustomDisplayCostAndPrice: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<CaliforniaPricingService>;
  });

  describe('RunningCostCaliforniaPricingOcpp16Handler', () => {
    function handle(payload: Partial<OCPP1_6.MeterValuesRequest>) {
      const handler = getTestInstance(container, RunningCostCaliforniaPricingOcpp16Handler, {
        californiaPricingService,
      });
      return handler.handle(
        makeMessage(
          {
            connectorId: 1,
            transactionId: 22,
            meterValue: [registerReading('13200', TIMESTAMP)],
            ...payload,
          } as OCPP1_6.MeterValuesRequest,
          OCPP_CallAction.MeterValues,
          MessageState.Request,
        ),
      );
    }

    it('sends the running cost for the reading being handled', async () => {
      await handle({});

      expect(californiaPricingService.calculateCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
        22,
        // Wh to kWh conversion carries the usual binary floating point noise.
        { meterKwh: expect.closeTo(13.2, 6), timestamp: TIMESTAMP },
      );
      expect(californiaPricingService.sendRunningCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
        {
          transactionId: 22,
          timestamp: TIMESTAMP,
          meterValue: 13200,
          cost: 729,
          state: 'Charging',
          chargingPrice: { kWhPrice: 10, hourPrice: 600, flatFee: 77 },
        },
      );
    });

    it('uses the newest register reading in the batch', async () => {
      await handle({
        meterValue: [
          registerReading('13200', TIMESTAMP),
          registerReading('14000', '2026-09-07T15:57:00Z'),
        ],
      });

      expect(californiaPricingService.calculateCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
        22,
        { meterKwh: expect.closeTo(14, 6), timestamp: '2026-09-07T15:57:00Z' },
      );
    });

    it('skips a batch without an energy register reading', async () => {
      await handle({
        meterValue: [
          registerReading('16', TIMESTAMP, OCPP1_6.MeterValuesRequestMeasurand.Current_Import),
        ],
      });

      expect(californiaPricingService.calculateCost).not.toHaveBeenCalled();
      expect(californiaPricingService.sendRunningCost).not.toHaveBeenCalled();
    });

    it.each([
      { name: 'no transaction', payload: { transactionId: undefined } },
      { name: 'the station-wide connector 0', payload: { connectorId: 0 } },
    ])('sends nothing for $name', async ({ payload }) => {
      await handle(payload);

      expect(californiaPricingService.isEnabled).not.toHaveBeenCalled();
      expect(californiaPricingService.sendRunningCost).not.toHaveBeenCalled();
    });

    it('sends nothing when the customization is disabled', async () => {
      californiaPricingService.isEnabled.mockResolvedValue(false);

      await handle({});

      expect(californiaPricingService.sendRunningCost).not.toHaveBeenCalled();
    });
  });

  describe('FinalCostCaliforniaPricingOcpp16Handler', () => {
    function handle(payload?: Partial<OCPP1_6.StopTransactionRequest>) {
      const handler = getTestInstance(container, FinalCostCaliforniaPricingOcpp16Handler, {
        californiaPricingService,
      });
      return handler.handle(
        makeMessage(
          {
            transactionId: 22,
            meterStop: 13200,
            timestamp: TIMESTAMP,
            ...payload,
          } as OCPP1_6.StopTransactionRequest,
          OCPP_CallAction.StopTransaction,
          MessageState.Request,
        ),
      );
    }

    it('costs the stop reading and sends the final cost', async () => {
      await handle();

      expect(californiaPricingService.calculateCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
        22,
        { meterKwh: expect.closeTo(13.2, 6), timestamp: TIMESTAMP },
      );
      expect(californiaPricingService.sendFinalCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
        expect.objectContaining({ transactionId: 22, cost: 729 }),
      );
    });

    it('reports zero when the cost can not be resolved', async () => {
      californiaPricingService.calculateCost.mockResolvedValue(undefined);

      await handle();

      expect(californiaPricingService.sendFinalCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
        expect.objectContaining({ cost: 0 }),
      );
    });

    it('sends nothing when the customization is disabled', async () => {
      californiaPricingService.isEnabled.mockResolvedValue(false);

      await handle();

      expect(californiaPricingService.sendFinalCost).not.toHaveBeenCalled();
    });
  });

  describe('DefaultPriceCaliforniaPricingOcpp16Handler', () => {
    function handle(configurationKey?: OCPP1_6.GetConfigurationResponse['configurationKey']) {
      const handler = getTestInstance(container, DefaultPriceCaliforniaPricingOcpp16Handler, {
        californiaPricingService,
      });
      return handler.handle(
        makeMessage(
          { configurationKey } as OCPP1_6.GetConfigurationResponse,
          OCPP_CallAction.GetConfiguration,
          MessageState.Response,
        ),
      );
    }

    it('applies the default price when the charger supports the customization', async () => {
      await handle([{ key: CUSTOM_DISPLAY_COST_AND_PRICE_KEY, value: 'true', readonly: false }]);

      expect(californiaPricingService.applyStationDefaultPrice).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
        null,
      );
    });

    it('passes the reported DefaultPrice on so a redundant write can be skipped', async () => {
      const reported = '{"priceText":"1 EUR/kWh","chargingPrice":{"kWhPrice":1}}';

      await handle([
        { key: CUSTOM_DISPLAY_COST_AND_PRICE_KEY, value: 'true', readonly: false },
        { key: DEFAULT_PRICE_KEY, value: reported, readonly: false },
      ]);

      expect(californiaPricingService.applyStationDefaultPrice).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
        reported,
      );
    });

    it.each([
      {
        name: 'the key is false',
        keys: [{ key: CUSTOM_DISPLAY_COST_AND_PRICE_KEY, value: 'false' }],
      },
      { name: 'the key is absent', keys: [{ key: 'HeartbeatInterval', value: '60' }] },
      { name: 'no keys were reported', keys: undefined },
    ])('does nothing when $name', async ({ keys }) => {
      await handle(keys as OCPP1_6.GetConfigurationResponse['configurationKey']);

      expect(californiaPricingService.applyStationDefaultPrice).not.toHaveBeenCalled();
    });
  });

  describe('CustomDisplayCostAndPriceOcpp16Handler', () => {
    function handle() {
      const handler = getTestInstance(container, CustomDisplayCostAndPriceOcpp16Handler, {
        californiaPricingService,
      });
      return handler.handle(
        makeMessage(
          {
            chargePointVendor: 'CTEK',
            chargePointModel: 'Chargestorm',
          } as OCPP1_6.BootNotificationRequest,
          OCPP_CallAction.BootNotification,
          MessageState.Request,
        ),
      );
    }

    it('asks the station for the customization flag on boot', async () => {
      await handle();

      expect(californiaPricingService.requestCustomDisplayCostAndPrice).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        STATION,
      );
    });
  });
});
