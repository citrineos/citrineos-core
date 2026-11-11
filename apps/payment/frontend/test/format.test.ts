// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  formatMajor,
  formatMinor,
  formatPower,
  secondsBetween,
  withVat,
} from '../src/format';

describe('format', () => {
  it('shows minor units in the currency’s major unit', () => {
    expect(formatMinor(856, 'USD', 'en')).toBe('$8.56');
    expect(formatMinor(856, 'USD', 'de')).toBe('8,56 $');
    expect(formatMinor(856, 'JPY', 'en')).toBe('¥856');
  });

  it('shows unit prices with as many decimals as they have, up to four', () => {
    expect(formatMajor(0.5, 'USD', 'en')).toBe('$0.50');
    expect(formatMajor(0.4998, 'USD', 'en')).toBe('$0.4998');
  });

  it('adds VAT to a net price', () => {
    expect(withVat(0.42, 19, 'USD')).toBe(0.4998);
    expect(withVat(1.5, null, 'USD')).toBe(1.5);
  });

  it('shows a duration as h:mm:ss', () => {
    expect(formatDuration(3725)).toBe('1:02:05');
    expect(formatDuration(-3)).toBe('0:00:00');
  });

  it('measures time until now while a session runs', () => {
    const start = '2026-10-23T10:00:00.000Z';
    expect(secondsBetween(start, '2026-10-23T10:30:00.000Z', 0)).toBe(1800);
    expect(secondsBetween(start, null, Date.parse('2026-10-23T10:01:00.000Z'))).toBe(60);
  });

  it('shows power in kW', () => {
    expect(formatPower(22000, 'en')).toBe('22 kW');
    expect(formatPower(7400, 'de')).toBe('7,4 kW');
  });
});
