// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { NOT_APPLICABLE } from '@lib/utils/consts';

/**
 * Compact power formatting: values above 10 kW render as kW (1 decimal place), smaller values as
 * watts. Falsy values (0 / null / undefined) render as `fallback`.
 *
 * @example formatPower(15000) // "15.0 kW"
 * @example formatPower(8000)  // "8000 W"
 * @example formatPower(null)  // "N/A"
 */
export const formatPower = (value?: number | null, fallback: string = NOT_APPLICABLE): string =>
  value ? (value > 10000 ? `${(value / 1000).toFixed(1)} kW` : `${value} W`) : fallback;
