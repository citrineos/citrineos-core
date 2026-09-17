// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffDto } from '@citrineos/types';
import {
  baseCalculateFixedCost,
  baseCalculateEnergyCost,
  baseCalculateTimeCost,
  baseCalculateTotalCost,
} from '@citrineos/base';
import type { Price } from '@citrineos/base';
import type { Session } from '../types/session.js';
import { CdrDimensionType } from '../types/cdr-dimension-type.js';
import { MINUTES_IN_HOUR } from '../util/consts.js';

export type PricedSession = Pick<
  Session,
  'kwh' | 'start_date_time' | 'end_date_time' | 'charging_periods'
>;

export function calculateTotalTimeHours(session: PricedSession): number {
  if (session.end_date_time) {
    return (session.end_date_time.getTime() - session.start_date_time.getTime()) / 3600000;
  }
  return 0;
}

export function calculateTotalParkingTimeHours(session: PricedSession): number {
  const totalHours = (session.charging_periods ?? [])
    .flatMap((period) => period.dimensions)
    .filter((dimension) => dimension.type === CdrDimensionType.PARKING_TIME)
    .reduce(
      (total, dimension) => total + (Number.isFinite(dimension.volume) ? dimension.volume : 0),
      0,
    );

  return Math.max(totalHours, 0);
}

/**
 * Billable charging time, in minutes.
 * OCPI 2.2.1, total_charging_time = total_time - total_parking_time
 */
export function calculateChargingMinutes(session: PricedSession): number {
  const chargingHours = calculateTotalTimeHours(session) - calculateTotalParkingTimeHours(session);
  return Math.max(chargingHours, 0) * MINUTES_IN_HOUR;
}

export function calculateFixedCost(tariff: TariffDto): Price | undefined {
  return baseCalculateFixedCost(tariff.pricePerSession, tariff.currency, tariff.taxRate);
}

export function calculateEnergyCost(session: PricedSession, tariff: TariffDto): Price | undefined {
  return baseCalculateEnergyCost(session.kwh, tariff.pricePerKwh, tariff.currency, tariff.taxRate);
}

export function calculateTimeCost(session: PricedSession, tariff: TariffDto): Price | undefined {
  const chargingMinutes = calculateChargingMinutes(session);
  return baseCalculateTimeCost(
    chargingMinutes,
    tariff.pricePerMin,
    tariff.currency,
    tariff.taxRate,
  );
}

export function calculateTotalCdrCost(session: PricedSession, tariff: TariffDto): Price {
  return baseCalculateTotalCost(
    session.kwh,
    calculateChargingMinutes(session),
    tariff.pricePerSession,
    tariff.pricePerKwh,
    tariff.pricePerMin,
    tariff.currency,
    tariff.taxRate,
  );
}
