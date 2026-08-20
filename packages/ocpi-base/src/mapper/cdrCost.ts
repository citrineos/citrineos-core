// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffDto } from '@citrineos/types';
import { Money } from '@citrineos/base';
import type { Price } from '../model/Price.js';
import type { Session } from '../model/Session.js';
import { MINUTES_IN_HOUR } from '../util/Consts.js';

/** The part of a session that determines what it costs. */
export type PricedSession = Pick<Session, 'kwh' | 'start_date_time' | 'end_date_time'>;

export function buildPrice(amount: number, currency: string, taxRate?: number | null): Price {
  const money = Money.of(amount, currency);
  const price: Price = { excl_vat: money.roundToCurrencyScale().toNumber() };
  if (taxRate != null) {
    price.incl_vat = money
      .multiply(1 + taxRate / 100)
      .roundToCurrencyScale()
      .toNumber();
  }
  return price;
}

/**
 * Sums a set of already-rounded CDR line-item Prices into one Price, so the
 * resulting total always reconciles against the sum of its own components.
 */
export function sumPrices(currency: string, prices: (Price | undefined)[]): Price {
  const defined = prices.filter((price): price is Price => price !== undefined);
  const exclVat = defined.reduce(
    (total, price) => total.add(Money.of(price.excl_vat, currency)),
    Money.of(0, currency),
  );
  if (!defined.some((price) => price.incl_vat != null)) {
    return { excl_vat: exclVat.toNumber() };
  }
  const inclVat = defined.reduce(
    (total, price) => total.add(Money.of(price.incl_vat ?? price.excl_vat, currency)),
    Money.of(0, currency),
  );
  return { excl_vat: exclVat.toNumber(), incl_vat: inclVat.toNumber() };
}

export function calculateTotalTimeHours(session: PricedSession): number {
  if (session.end_date_time) {
    return (session.end_date_time.getTime() - session.start_date_time.getTime()) / 3600000;
  }
  return 0;
}

export function calculateFixedCost(tariff: TariffDto): Price | undefined {
  if (!tariff.pricePerSession) {
    return undefined;
  }
  return buildPrice(tariff.pricePerSession, tariff.currency, tariff.taxRate);
}

export function calculateEnergyCost(session: PricedSession, tariff: TariffDto): Price {
  return buildPrice(session.kwh * tariff.pricePerKwh, tariff.currency, tariff.taxRate);
}

export function calculateTimeCost(session: PricedSession, tariff: TariffDto): Price | undefined {
  if (!tariff.pricePerMin) {
    return undefined;
  }
  const totalMinutes = calculateTotalTimeHours(session) * MINUTES_IN_HOUR;
  return buildPrice(totalMinutes * tariff.pricePerMin, tariff.currency, tariff.taxRate);
}

export function calculateTotalCdrCost(session: PricedSession, tariff: TariffDto): Price {
  return sumPrices(tariff.currency, [
    calculateFixedCost(tariff),
    calculateEnergyCost(session, tariff),
    calculateTimeCost(session, tariff),
  ]);
}
