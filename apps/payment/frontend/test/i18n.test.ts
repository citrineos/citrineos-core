// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { pickLocale } from '../src/i18n';

describe('i18n', () => {
  it('speaks the first of the browser’s languages it knows', () => {
    expect(pickLocale(['fr-FR', 'de-AT', 'en'])).toBe('de-AT');
    expect(pickLocale(['fr-FR'])).toBe('en');
    expect(pickLocale([])).toBe('en');
  });
});
