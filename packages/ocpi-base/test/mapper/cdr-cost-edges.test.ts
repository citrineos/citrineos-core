// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { TariffDto } from '@citrineos/types';
import { describe, expect, it } from 'vitest';

import type { PricedSession } from '../../src/mapper/cdr-cost.js';
import {
  calculateEnergyCost,
  calculateFixedCost,
  calculateTimeCost,
  calculateTotalCdrCost,
  calculateTotalTimeHours,
} from '../../src/mapper/cdr-cost.js';

/** 45 minutes, 10.5 kWh. */
function aSession(overrides: Partial<PricedSession> = {}): PricedSession {
  return {
    kwh: 10.5,
    start_date_time: new Date('2026-08-20T10:00:00Z'),
    end_date_time: new Date('2026-08-20T10:45:00Z'),
    ...overrides,
  };
}

// Every rate lands off the cent boundary, so any rounding shows up in the result.
function aTariff(overrides: Partial<TariffDto> = {}): TariffDto {
  return {
    id: 7,
    currency: 'EUR',
    pricePerKwh: 0.333,
    pricePerMin: 0.019,
    pricePerSession: 1.005,
    ...overrides,
  } as TariffDto;
}

describe('calculateTotalTimeHours', () => {
  it('converts the session window to fractional hours', () => {
    expect(calculateTotalTimeHours(aSession())).toBe(0.75);
  });

  it('treats a session without an end date as zero hours', () => {
    expect(calculateTotalTimeHours(aSession({ end_date_time: undefined }))).toBe(0);
  });
});

describe('calculateFixedCost', () => {
  it('is undefined when the tariff has no session fee', () => {
    expect(calculateFixedCost(aTariff({ pricePerSession: undefined }))).toBeUndefined();
  });

  it('omits incl_vat when the tariff has no tax rate', () => {
    expect(calculateFixedCost(aTariff({ pricePerSession: 1.5 }))).toStrictEqual({ excl_vat: 1.5 });
  });

  it('keeps incl_vat for a 0% tax rate', () => {
    expect(calculateFixedCost(aTariff({ pricePerSession: 1.5, taxRate: 0 }))).toStrictEqual({
      excl_vat: 1.5,
      incl_vat: 1.5,
    });
  });

  it('truncates the fee to the currency scale', () => {
    // 1.005 -> 1.00, not 1.01
    expect(calculateFixedCost(aTariff())).toStrictEqual({ excl_vat: 1 });
  });
});

describe('calculateEnergyCost', () => {
  it('truncates at the cent and takes VAT from the unrounded amount', () => {
    // 10.5 kWh x 0.333 = 3.4965 -> 3.49; VAT: 3.4965 x 1.2 = 4.1958 -> 4.19
    // (rounding before VAT would give 3.49 x 1.2 = 4.188 -> 4.18)
    expect(calculateEnergyCost(aSession(), aTariff({ taxRate: 20 }))).toStrictEqual({
      excl_vat: 3.49,
      incl_vat: 4.19,
    });
  });

  it('prices zero kWh as zero', () => {
    expect(calculateEnergyCost(aSession({ kwh: 0 }), aTariff({ taxRate: 20 }))).toStrictEqual({
      excl_vat: 0,
      incl_vat: 0,
    });
  });

  it('keeps the sign of a negative energy reading', () => {
    expect(calculateEnergyCost(aSession({ kwh: -2 }), aTariff({ pricePerKwh: 0.1 }))).toStrictEqual(
      {
        excl_vat: -0.2,
      },
    );
  });
});

describe('calculateTimeCost', () => {
  it('charges per minute of the session window', () => {
    // 45 min x 0.019 = 0.855 -> 0.85
    expect(calculateTimeCost(aSession(), aTariff())).toStrictEqual({ excl_vat: 0.85 });
  });

  it('charges zero minutes while the session has no end date', () => {
    expect(calculateTimeCost(aSession({ end_date_time: undefined }), aTariff())).toStrictEqual({
      excl_vat: 0,
    });
  });

  it('is undefined when the tariff has no per-minute rate', () => {
    expect(calculateTimeCost(aSession(), aTariff({ pricePerMin: undefined }))).toBeUndefined();
  });
});

describe('calculateTotalCdrCost', () => {
  it('rounds each component before summing', () => {
    // 1.00 + 3.49 + 0.85; rounding the raw sum 5.3565 once would give 5.35
    expect(calculateTotalCdrCost(aSession(), aTariff())).toStrictEqual({ excl_vat: 5.34 });
  });

  it('sums per-component VAT-inclusive amounts', () => {
    // 1.20 + 4.19 + 1.02
    expect(calculateTotalCdrCost(aSession(), aTariff({ taxRate: 20 }))).toStrictEqual({
      excl_vat: 5.34,
      incl_vat: 6.41,
    });
  });

  it('skips components the tariff does not price', () => {
    const energyOnly = aTariff({
      pricePerKwh: 0.45,
      pricePerMin: undefined,
      pricePerSession: undefined,
    });

    expect(calculateTotalCdrCost(aSession({ kwh: 50 }), energyOnly)).toStrictEqual({
      excl_vat: 22.5,
    });
  });

  it('charges no time for a still-running session', () => {
    expect(calculateTotalCdrCost(aSession({ end_date_time: undefined }), aTariff())).toStrictEqual({
      excl_vat: 4.49,
    });
  });

  it('totals zero for an energy-only tariff before any energy flows', () => {
    const energyOnly = aTariff({ pricePerMin: undefined, pricePerSession: undefined });

    expect(
      calculateTotalCdrCost(aSession({ kwh: 0, end_date_time: undefined }), energyOnly),
    ).toStrictEqual({ excl_vat: 0 });
  });

  it('rejects a currency outside the supported set', () => {
    expect(() => calculateTotalCdrCost(aSession(), aTariff({ currency: 'SEK' }))).toThrow(
      'Unsupported currency code: SEK',
    );
  });
});
