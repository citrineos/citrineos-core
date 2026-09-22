// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { TariffDto } from '@citrineos/types';
import { describe, expect, it } from 'vitest';

import type { PricedSession } from '../../src/mappers/cdr-cost.js';
import {
  calculateEnergyCost,
  calculateFixedCost,
  calculateTimeCost,
  calculateTotalCdrCost,
  calculateTotalParkingTimeHours,
  calculateTotalTimeHours,
} from '../../src/mappers/cdr-cost.js';
import type { ChargingPeriod } from '../../src/types/charging-period.js';
import { CdrDimensionType } from '../../src/types/cdr-dimension-type.js';

/** 45 minutes, 10.5 kWh. */
function aSession(overrides: Partial<PricedSession> = {}): PricedSession {
  return {
    kwh: 10.5,
    start_date_time: new Date('2026-08-20T10:00:00Z'),
    end_date_time: new Date('2026-08-20T10:45:00Z'),
    ...overrides,
  };
}

/** A charging period carrying the given PARKING_TIME volume, in hours. */
function aParkingPeriod(hours: number): ChargingPeriod {
  return {
    start_date_time: new Date('2026-08-20T10:00:00Z'),
    dimensions: [
      { type: CdrDimensionType.TIME, volume: 0.25 },
      { type: CdrDimensionType.PARKING_TIME, volume: hours },
    ],
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

describe('calculateTotalParkingTimeHours', () => {
  it('sums the PARKING_TIME volumes across charging periods', () => {
    const session = aSession({
      charging_periods: [aParkingPeriod(0.1), aParkingPeriod(0.15)],
    });

    expect(calculateTotalParkingTimeHours(session)).toBeCloseTo(0.25, 10);
  });

  it('ignores every dimension that is not PARKING_TIME', () => {
    const session = aSession({
      charging_periods: [
        {
          start_date_time: new Date('2026-08-20T10:00:00Z'),
          dimensions: [
            { type: CdrDimensionType.TIME, volume: 0.5 },
            { type: CdrDimensionType.ENERGY, volume: 4 },
          ],
        },
      ],
    });

    expect(calculateTotalParkingTimeHours(session)).toBe(0);
  });

  it('is zero for a session with no charging periods', () => {
    expect(calculateTotalParkingTimeHours(aSession())).toBe(0);
    expect(calculateTotalParkingTimeHours(aSession({ charging_periods: null }))).toBe(0);
  });

  it('prefers the transaction figure over the periods when it is present', () => {
    // 45-minute session, station reports 15 minutes of charging -> 30 minutes parked.
    const session = aSession({
      charging_periods: [aParkingPeriod(0.1)],
      timeSpentChargingSeconds: 15 * 60,
    });

    expect(calculateTotalParkingTimeHours(session)).toBeCloseTo(0.5, 10);
  });

  it.each([
    ['a plain number', 2700],
    ['a bigint handed back as a string', '2700'],
  ])('reads the figure from %s', (_label, reported) => {
    const session = aSession({ timeSpentChargingSeconds: reported as never });

    expect(calculateTotalParkingTimeHours(session)).toBe(0);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
  ])('ignores %s and falls back to the dimensions', (_label, reported) => {
    const session = aSession({
      charging_periods: [aParkingPeriod(0.25)],
      timeSpentChargingSeconds: reported,
    });

    expect(calculateTotalParkingTimeHours(session)).toBeCloseTo(0.25, 10);
  });

  it('never reports negative parking when the station over-reports charging', () => {
    const session = aSession({ timeSpentChargingSeconds: 10 * 3600 });

    expect(calculateTotalParkingTimeHours(session)).toBe(0);
  });

  it('never reports a negative total from a malformed dimension', () => {
    expect(
      calculateTotalParkingTimeHours(aSession({ charging_periods: [aParkingPeriod(-2)] })),
    ).toBe(0);
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

  it('bills the charging time only, not the parking time', () => {
    // 45 min window - 15 min parked = 30 min x 0.019 = 0.57
    const session = aSession({ charging_periods: [aParkingPeriod(0.25)] });

    expect(calculateTimeCost(session, aTariff())).toStrictEqual({ excl_vat: 0.57 });
  });

  it('charges nothing when parking covers the whole session', () => {
    const session = aSession({ charging_periods: [aParkingPeriod(0.75)] });

    expect(calculateTimeCost(session, aTariff())).toStrictEqual({ excl_vat: 0 });
  });

  it('does not go negative when parking exceeds the session window', () => {
    const session = aSession({ charging_periods: [aParkingPeriod(5)] });

    expect(calculateTimeCost(session, aTariff())).toStrictEqual({ excl_vat: 0 });
  });
});

describe('calculateChargingMinutes reconciles with the OCPP figure', () => {
  it.each([
    ['half the session', 15 * 60, 15],
    ['the whole session', 45 * 60, 45],
    ['nothing at all', 0, 0],
  ])('bills exactly the reported charging time: %s', (_label, seconds, expectedMinutes) => {
    const session = aSession({
      charging_periods: [aParkingPeriod(0.75)],
      timeSpentChargingSeconds: seconds,
    });

    // total_time - total_parking_time, in minutes.
    const billed =
      (calculateTotalTimeHours(session) - calculateTotalParkingTimeHours(session)) * 60;

    expect(billed).toBeCloseTo(expectedMinutes, 10);
  });

  it('bills the whole session for 1.6, whose figure is wall-clock elapsed', () => {
    // The 1.6 StopTransaction handler sets timeSpentCharging to the full duration, so a flat
    // register late in the session must not shorten the bill.
    const session = aSession({
      charging_periods: [aParkingPeriod(0.5)],
      timeSpentChargingSeconds: 45 * 60,
    });

    expect(calculateTimeCost(session, aTariff())).toStrictEqual({ excl_vat: 0.85 });
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
