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
import type { Session } from '../model/Session.js';
import { MINUTES_IN_HOUR } from '../util/Consts.js';

export type PricedSession = Pick<Session, 'kwh' | 'start_date_time' | 'end_date_time'>;

export function calculateTotalTimeHours(session: PricedSession): number {
  if (session.end_date_time) {
    return (session.end_date_time.getTime() - session.start_date_time.getTime()) / 3600000;
  }
  return 0;
}

export function calculateFixedCost(tariff: TariffDto): Price | undefined {
  return baseCalculateFixedCost(tariff.pricePerSession, tariff.currency, tariff.taxRate);
}

export function calculateEnergyCost(session: PricedSession, tariff: TariffDto): Price | undefined {
  return baseCalculateEnergyCost(session.kwh, tariff.pricePerKwh, tariff.currency, tariff.taxRate);
}

export function calculateTimeCost(session: PricedSession, tariff: TariffDto): Price | undefined {
  const totalMinutes = calculateTotalTimeHours(session) * MINUTES_IN_HOUR;
  return baseCalculateTimeCost(totalMinutes, tariff.pricePerMin, tariff.currency, tariff.taxRate);
}

export function calculateTotalCdrCost(session: PricedSession, tariff: TariffDto): Price {
  const totalMinutes = calculateTotalTimeHours(session) * MINUTES_IN_HOUR;
  return baseCalculateTotalCost(
    session.kwh,
    totalMinutes,
    tariff.pricePerSession,
    tariff.pricePerKwh,
    tariff.pricePerMin,
    tariff.currency,
    tariff.taxRate,
  );
}
