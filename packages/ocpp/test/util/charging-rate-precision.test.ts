// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { OCPPVersion } from '@citrineos/types';
import {
  maxChargingRateFractionDigits,
  truncateChargingRates,
  truncateFractionDigits,
} from '@util/index.js';

describe('truncateFractionDigits', () => {
  it.each([
    [8.123, 1, 8.1],
    [8.15, 1, 8.1],
    [-8.15, 1, -8.1],
    [8.1, 1, 8.1],
    [0.3, 1, 0.3],
    [8, 1, 8],
    [1.2345678, 6, 1.234567],
    [1.23456, 6, 1.23456],
  ])('truncates %s to %s fraction digits as %s', (value, digits, expected) => {
    expect(truncateFractionDigits(value, digits)).toBe(expected);
  });

  it('leaves a value in exponent notation alone', () => {
    expect(truncateFractionDigits(1e-7, 6)).toBe(1e-7);
  });
});

describe('maxChargingRateFractionDigits', () => {
  it.each([
    [OCPPVersion.OCPP1_6, 1],
    [OCPPVersion.OCPP2_0_1, 1],
    [OCPPVersion.OCPP2_1, 6],
  ])('allows %s fraction digits on %s', (protocol, expected) => {
    expect(maxChargingRateFractionDigits(protocol)).toBe(expected);
  });
});

describe('truncateChargingRates', () => {
  const aProfile = (minChargingRate: number, limit: number) => ({
    chargingProfileId: 1,
    chargingSchedule: [
      {
        id: 1,
        minChargingRate,
        chargingSchedulePeriod: [{ startPeriod: 0, limit }],
      },
    ],
  });

  it('truncates a charging rate to one fraction digit for a 2.0.1 station', () => {
    const truncated = truncateChargingRates(aProfile(8.123, 22.55), OCPPVersion.OCPP2_0_1);

    expect(truncated.chargingSchedule[0].minChargingRate).toBe(8.1);
    expect(truncated.chargingSchedule[0].chargingSchedulePeriod[0].limit).toBe(22.5);
  });

  it('truncates a charging rate to six fraction digits for a 2.1 station', () => {
    const truncated = truncateChargingRates(aProfile(8.1234567, 22.5), OCPPVersion.OCPP2_1);

    expect(truncated.chargingSchedule[0].minChargingRate).toBe(8.123456);
    expect(truncated.chargingSchedule[0].chargingSchedulePeriod[0].limit).toBe(22.5);
  });

  it('leaves the payload untouched when every rate already fits', () => {
    const payload = aProfile(8.1, 22.5);

    expect(truncateChargingRates(payload, OCPPVersion.OCPP2_0_1)).toBe(payload);
  });

  it('leaves fields that are not charging rates alone', () => {
    const payload = { evseId: 1, totalCost: 12.3456, chargingSchedule: [] };

    const truncated = truncateChargingRates(payload, OCPPVersion.OCPP2_0_1);

    expect(truncated.totalCost).toBe(12.3456);
  });
});
