// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

function currencyFormat(locale: string, currency: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, { style: 'currency', currency });
}

/** An amount in the currency's minor units (cents), as the API reports totals. */
export function formatMinor(amount: number, currency: string, locale: string): string {
  const format = currencyFormat(locale, currency);
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(amount / 10 ** digits);
}

/** An amount in major units, as tariffs state prices; unit prices may need more decimals. */
export function formatMajor(amount: number, currency: string, locale: string): string {
  const format = currencyFormat(locale, currency);
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: Math.max(digits, 4),
  }).format(amount);
}

/** A net price with VAT added, rounded to the currency's minor unit. */
export function withVat(net: number, taxRate: number | null, currency: string): number {
  const digits = currencyFormat('en', currency).resolvedOptions().maximumFractionDigits ?? 2;
  const factor = 10 ** Math.max(digits, 4);
  return Math.round(net * (1 + (taxRate ?? 0) / 100) * factor) / factor;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatNumber(value: number, locale: string, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
}

export function formatDateTime(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function formatPower(watts: number, locale: string): string {
  return `${formatNumber(watts / 1000, locale, 1)} kW`;
}

/** Seconds between two instants, or until now while the second is unknown. */
export function secondsBetween(start: string, end: string | null, now: number): number {
  return ((end ? Date.parse(end) : now) - Date.parse(start)) / 1000;
}
