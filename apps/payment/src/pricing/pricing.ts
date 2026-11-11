// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  baseCalculateEnergyCost,
  baseCalculateFixedCost,
  baseCalculateTimeCost,
  baseCalculateTotalCost,
  Money,
} from '@citrineos/base';
import type { Price } from '@citrineos/base';
import type { TariffData } from '@citrineos/dal';

export interface ChargingUsage {
  energyKwh: number | null;
  chargingSeconds: number | null;
}

/**
 * A charging session's cost. Amounts are in the currency's minor units (cents for USD), excluding
 * VAT unless named gross, and null where the tariff has no price for that component or the usage
 * it is priced on is unknown.
 */
export interface Pricing {
  currency: string;
  taxRate: number | null;
  paymentFee: number | null;
  energyKwh: number | null;
  energyCosts: number | null;
  chargingMinutes: number;
  timeCosts: number | null;
  sessionCosts: number | null;
  totalCostsNet: number;
  taxCosts: number;
  totalCostsGross: number;
  /** What `paymentFee` percent of the net total comes to. Shown only; never charged. */
  paymentCosts: number | null;
}

function minorUnits(money: Money): number {
  return money
    .roundToCurrencyScale()
    .multiply(10 ** money.currency.scale)
    .toNumber();
}

export function toMinorUnits(amount: number, currency: string): number {
  return minorUnits(Money.of(amount, currency));
}

export function fromMinorUnits(amount: number, currency: string): number {
  const money = Money.of(amount, currency);
  return money.multiply(1 / 10 ** money.currency.scale).toNumber();
}

/**
 * Prices a session with the calculation Core uses for a transaction's cost
 * (`baseCalculateTotalCost`), so for the same kWh and charging time the net total equals the
 * `totalCost` Core records and reports to the station.
 */
export function calculatePricing(tariff: TariffData, usage: ChargingUsage): Pricing {
  const { currency } = tariff;
  const taxRate = tariff.taxRate ?? null;
  const chargingMinutes = (usage.chargingSeconds ?? 0) / 60;
  const exclVat = (price: Price | undefined) =>
    price === undefined ? null : toMinorUnits(price.excl_vat, currency);

  const energy =
    usage.energyKwh === null
      ? undefined
      : baseCalculateEnergyCost(usage.energyKwh, tariff.pricePerKwh, currency, taxRate);
  const time = baseCalculateTimeCost(chargingMinutes, tariff.pricePerMin, currency, taxRate);
  const session = baseCalculateFixedCost(tariff.pricePerSession, currency, taxRate);
  const total = baseCalculateTotalCost(
    usage.energyKwh ?? 0,
    chargingMinutes,
    tariff.pricePerSession,
    tariff.pricePerKwh,
    tariff.pricePerMin,
    currency,
    taxRate,
  );

  const totalCostsNet = toMinorUnits(total.excl_vat, currency);
  const totalCostsGross = toMinorUnits(total.incl_vat ?? total.excl_vat, currency);
  const paymentFee = tariff.paymentFee ?? null;

  return {
    currency,
    taxRate,
    paymentFee,
    energyKwh: usage.energyKwh,
    energyCosts: exclVat(energy),
    chargingMinutes,
    timeCosts: exclVat(time),
    sessionCosts: exclVat(session),
    totalCostsNet,
    taxCosts: totalCostsGross - totalCostsNet,
    totalCostsGross,
    paymentCosts:
      paymentFee === null
        ? null
        : minorUnits(Money.of(total.excl_vat, currency).multiply(paymentFee / 100)),
  };
}
