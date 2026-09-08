// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Money } from '../money/money.js';
import type { Price } from '../money/price.js';

/**
 * Builds a rounded {@link Price} from a unit price and quantity.
 *
 * The unit price is multiplied by the quantity using decimal arithmetic to avoid
 * floating-point rounding errors, then rounded down to the currency's scale.
 *
 * @param unitPrice - The price per unit (e.g. per kWh, per minute, or a flat fee). Returns undefined when null.
 * @param currency - The ISO currency code used for arithmetic and rounding.
 * @param taxRate - Optional tax rate as a percentage; when set, populates `incl_vat`.
 * @param quantity - The number of units to multiply by. Defaults to 1.
 * @returns The rounded price, or undefined when `unitPrice` is null.
 */
export function buildPrice(
  unitPrice: number | undefined,
  currency: string,
  taxRate?: number | null,
  quantity: number = 1,
): Price | undefined {
  if (unitPrice == null) {
    return undefined;
  }
  const money = Money.of(unitPrice, currency).multiply(quantity);
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
 * Sums a set of already-rounded Prices into one Price, so the
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

export function baseCalculateFixedCost(
  flatFee: number | null | undefined,
  currency: string,
  taxRate?: number | null,
): Price | undefined {
  if (flatFee == null) {
    return undefined;
  }
  return buildPrice(flatFee, currency, taxRate);
}

export function baseCalculateEnergyCost(
  totalKwh: number,
  feePerKwh: number | null | undefined,
  currency: string,
  taxRate?: number | null,
): Price | undefined {
  if (feePerKwh == null) {
    return undefined;
  }
  return buildPrice(feePerKwh, currency, taxRate, totalKwh);
}

export function baseCalculateTimeCost(
  totalMinutes: number,
  feePerMinute: number | null | undefined,
  currency: string,
  taxRate?: number | null,
): Price | undefined {
  if (feePerMinute == null) {
    return undefined;
  }
  return buildPrice(feePerMinute, currency, taxRate, totalMinutes);
}

export function baseCalculateTotalCost(
  totalKwh: number,
  totalMinutes: number,
  tariffPerSession: number | null | undefined,
  tariffPerKwh: number | null | undefined,
  tariffPerMinute: number | null | undefined,
  currency: string,
  taxRate?: number | null,
): Price {
  return sumPrices(currency, [
    baseCalculateFixedCost(tariffPerSession, currency, taxRate),
    baseCalculateEnergyCost(totalKwh, tariffPerKwh, currency, taxRate),
    baseCalculateTimeCost(totalMinutes, tariffPerMinute, currency, taxRate),
  ]);
}
