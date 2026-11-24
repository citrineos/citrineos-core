// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffData } from '@citrineos/dal';
import { describe, expect, it } from 'vitest';
import { calculatePricing, toMinorUnits } from '../../src/pricing/index.js';
import type { ChargingUsage } from '../../src/pricing/index.js';
import {
  CHARGING_MINUTES_CASES,
  ENERGY_COST_CASES,
  TAX_CASES,
  TIME_COST_CASES,
  TOTAL_GROSS_CASES,
  TOTAL_NET_CASES,
} from './pricing-cases.js';

// A typical session: 31.74 kWh over 10:00:00–10:30:59.
function aTariff(overrides: Partial<TariffData> = {}): TariffData {
  return {
    id: 3,
    currency: 'USD',
    pricePerKwh: 0.3,
    pricePerMin: 0.05,
    pricePerSession: 3,
    taxRate: 23,
    authorizationAmount: 10,
    paymentFee: 1,
    ...overrides,
  };
}

function aUsage(overrides: Partial<ChargingUsage> = {}): ChargingUsage {
  return { energyKwh: 31.74, chargingSeconds: 1859, ...overrides };
}

describe('calculatePricing', () => {
  it.each(['USD', 'EUR', 'CAD', 'GBP'])('prices in the tariff currency (%s)', (currency) => {
    expect(calculatePricing(aTariff({ currency }), aUsage()).currency).toBe(currency);
  });

  it('refuses a currency Core cannot price in', () => {
    expect(() => calculatePricing(aTariff({ currency: 'JPY' }), aUsage())).toThrow(/JPY/);
  });

  it.each([1, 2, 5, 23, null])('carries the tariff tax rate (%s)', (taxRate) => {
    expect(calculatePricing(aTariff({ taxRate }), aUsage()).taxRate).toBe(taxRate);
  });

  it.each([1, 2, 5, 23, null])('carries the tariff payment fee (%s)', (paymentFee) => {
    expect(calculatePricing(aTariff({ paymentFee }), aUsage()).paymentFee).toBe(paymentFee);
  });

  it.each([0, 0.01, 0.00001, 0.99999, 1, 10.23, 39.99])(
    'reports the energy consumed (%s kWh)',
    (energyKwh) => {
      expect(calculatePricing(aTariff(), aUsage({ energyKwh })).energyKwh).toBe(energyKwh);
    },
  );

  describe('energy costs', () => {
    it.each(ENERGY_COST_CASES)(
      '$kwh kWh at $pricePerKwh costs $expected',
      ({ pricePerKwh, kwh, expected }) => {
        const pricing = calculatePricing(aTariff({ pricePerKwh }), aUsage({ energyKwh: kwh }));
        expect(pricing.energyCosts).toBe(expected);
      },
    );

    it('are unknown until the energy consumed is known', () => {
      expect(calculatePricing(aTariff(), aUsage({ energyKwh: null })).energyCosts).toBeNull();
    });
  });

  describe('charging time', () => {
    it.each(CHARGING_MINUTES_CASES)('$seconds s is $minutes min', ({ seconds, minutes }) => {
      const pricing = calculatePricing(aTariff(), aUsage({ chargingSeconds: seconds }));
      expect(pricing.chargingMinutes).toBeCloseTo(minutes, 10);
    });

    it('is zero until the charging time is known', () => {
      expect(calculatePricing(aTariff(), aUsage({ chargingSeconds: null })).chargingMinutes).toBe(
        0,
      );
    });
  });

  describe('time costs', () => {
    it.each(TIME_COST_CASES)(
      '$seconds s at $pricePerMin/min costs $expected',
      ({ pricePerMin, seconds, expected }) => {
        const pricing = calculatePricing(
          aTariff({ pricePerMin }),
          aUsage({ chargingSeconds: seconds }),
        );
        expect(pricing.timeCosts).toBe(expected);
      },
    );

    it('are zero until the charging time is known', () => {
      const pricing = calculatePricing(
        aTariff({ pricePerMin: 0.09 }),
        aUsage({ chargingSeconds: null }),
      );
      expect(pricing.timeCosts).toBe(0);
    });

    it('are null when the tariff has no price per minute', () => {
      expect(calculatePricing(aTariff({ pricePerMin: null }), aUsage()).timeCosts).toBeNull();
    });
  });

  describe('session costs', () => {
    it.each([
      [0, 0],
      [0.99, 99],
      [1.99, 199],
      [5.01, 501],
    ])('a session fee of %s costs %s', (pricePerSession, expected) => {
      expect(calculatePricing(aTariff({ pricePerSession }), aUsage()).sessionCosts).toBe(expected);
    });

    it('are null when the tariff has no session fee', () => {
      expect(
        calculatePricing(aTariff({ pricePerSession: null }), aUsage()).sessionCosts,
      ).toBeNull();
    });
  });

  describe('totals', () => {
    it.each(TOTAL_NET_CASES)(
      'net total of $kwh kWh, $seconds s at $pricePerKwh/$pricePerMin/$pricePerSession is $expected',
      ({ pricePerKwh, pricePerMin, pricePerSession, kwh, seconds, expected }) => {
        const pricing = calculatePricing(
          aTariff({ pricePerKwh, pricePerMin, pricePerSession }),
          aUsage({ energyKwh: kwh, chargingSeconds: seconds }),
        );
        expect(pricing.totalCostsNet).toBe(expected);
      },
    );

    it.each(TAX_CASES)(
      'VAT at $taxRate% is $expected',
      ({ pricePerKwh, pricePerMin, pricePerSession, taxRate, kwh, seconds, expected }) => {
        const pricing = calculatePricing(
          aTariff({ pricePerKwh, pricePerMin, pricePerSession, taxRate }),
          aUsage({ energyKwh: kwh, chargingSeconds: seconds }),
        );
        expect(pricing.taxCosts).toBe(expected);
      },
    );

    it.each(TOTAL_GROSS_CASES)(
      'gross total at $taxRate% VAT is $expected',
      ({ pricePerKwh, pricePerMin, pricePerSession, taxRate, kwh, seconds, expected }) => {
        const pricing = calculatePricing(
          aTariff({ pricePerKwh, pricePerMin, pricePerSession, taxRate }),
          aUsage({ energyKwh: kwh, chargingSeconds: seconds }),
        );
        expect(pricing.totalCostsGross).toBe(expected);
      },
    );

    it('add up from rounded components', () => {
      const pricing = calculatePricing(
        aTariff({ pricePerKwh: 0.25, pricePerMin: 0.61, pricePerSession: 2.99, taxRate: 8 }),
        aUsage({ energyKwh: 39.99, chargingSeconds: 3599 }),
      );

      expect(pricing).toMatchObject({
        energyCosts: 999,
        timeCosts: 3658,
        sessionCosts: 299,
        // Summing before rounding would give 4957 and 5354.
        totalCostsNet: 4956,
        taxCosts: 396,
        totalCostsGross: 5352,
      });
    });

    it('charge no VAT when the tariff has no tax rate', () => {
      const pricing = calculatePricing(aTariff({ taxRate: null }), aUsage());

      expect(pricing.taxCosts).toBe(0);
      expect(pricing.totalCostsGross).toBe(pricing.totalCostsNet);
    });

    it('leave out energy until it is known', () => {
      const pricing = calculatePricing(aTariff(), aUsage({ energyKwh: null }));

      expect(pricing.totalCostsNet).toBe(154 + 300);
    });
  });

  describe('payment costs', () => {
    it('are the payment fee percent of the net total, rounded down', () => {
      const pricing = calculatePricing(aTariff({ paymentFee: 1 }), aUsage());

      expect(pricing.totalCostsNet).toBe(1406);
      expect(pricing.paymentCosts).toBe(14);
    });

    it('are null when the tariff has no payment fee', () => {
      expect(calculatePricing(aTariff({ paymentFee: null }), aUsage()).paymentCosts).toBeNull();
    });

    it('are not part of what the driver pays', () => {
      const withFee = calculatePricing(aTariff({ paymentFee: 20 }), aUsage());
      const withoutFee = calculatePricing(aTariff({ paymentFee: null }), aUsage());

      expect(withFee.totalCostsGross).toBe(withoutFee.totalCostsGross);
    });
  });
});

describe('toMinorUnits', () => {
  it.each([
    [50, 'EUR', 5000],
    [0.29, 'USD', 29],
    [10.005, 'GBP', 1000],
    [0, 'CAD', 0],
  ])('%s %s is %s minor units', (amount, currency, expected) => {
    expect(toMinorUnits(amount, currency)).toBe(expected);
  });
});
