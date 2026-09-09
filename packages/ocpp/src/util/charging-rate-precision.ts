// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPPVersion, type OCPPVersionType } from '@citrineos/types';

const CHARGING_RATE_FIELDS = new Set(['limit', 'minChargingRate']);

const OCPP2_1_FRACTION_DIGITS = 6;
const OCPP2_0_1_FRACTION_DIGITS = 1;

export function maxChargingRateFractionDigits(protocol: OCPPVersionType): number {
  return protocol === OCPPVersion.OCPP2_1 ? OCPP2_1_FRACTION_DIGITS : OCPP2_0_1_FRACTION_DIGITS;
}

export function truncateFractionDigits(value: number, digits: number): number {
  if (!Number.isFinite(value)) {
    return value;
  }
  const text = value.toString();
  const point = text.indexOf('.');
  if (point < 0 || text.includes('e') || text.includes('E')) {
    return value;
  }
  if (text.length - point - 1 <= digits) {
    return value;
  }
  return Number(digits === 0 ? text.slice(0, point) : text.slice(0, point + 1 + digits));
}

export function truncateChargingRates<T>(payload: T, protocol: OCPPVersionType): T {
  return truncate(payload, maxChargingRateFractionDigits(protocol)) as T;
}

function truncate(value: unknown, digits: number): unknown {
  if (Array.isArray(value)) {
    const items = value.map((item) => truncate(item, digits));
    return items.some((item, index) => item !== value[index]) ? items : value;
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }

  let changed = false;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const next =
      CHARGING_RATE_FIELDS.has(key) && typeof item === 'number'
        ? truncateFractionDigits(item, digits)
        : truncate(item, digits);
    changed ||= next !== item;
    result[key] = next;
  }
  return changed ? result : value;
}
