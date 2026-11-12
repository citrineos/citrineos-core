// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
  formatDateTime,
  formatDuration,
  formatElapsed,
  formatMajor,
  formatMinor,
  formatPower,
  secondsBetween,
  withVat,
} from '../src/format';
import { createI18n } from '../src/i18n';

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

  it('shows a length of time in its non-zero units', () => {
    const { t } = createI18n('en');
    expect(formatElapsed(185, t)).toBe('3m 5s');
    expect(formatElapsed(12 * 3600, t)).toBe('12h');
    expect(formatElapsed(3600 + 120 + 5, t)).toBe('1h 2m 5s');
    expect(formatElapsed(3605, t)).toBe('1h 5s');
    expect(formatElapsed(29.6, t)).toBe('30s');
    expect(formatElapsed(0, t)).toBe('0s');
    expect(formatElapsed(3600 + 185, createI18n('de').t)).toBe('1 Std. 3 Min. 5 Sek.');
  });

  it('shows a date and time to the second', () => {
    // Seconds read the same in every time zone; the hour and day depend on where the tests run.
    expect(formatDateTime('2026-10-23T10:00:05.000Z', 'en')).toMatch(
      /2026, \d{1,2}:\d{2}:05\s[AP]M$/,
    );
    expect(formatDateTime('2026-10-23T10:00:05.000Z', 'de')).toMatch(/2026, \d{2}:\d{2}:05$/);
  });
});
