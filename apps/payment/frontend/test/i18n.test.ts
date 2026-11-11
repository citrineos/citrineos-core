// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { createI18n, pickLocale } from '../src/i18n';

describe('i18n', () => {
  it('speaks the first of the browser’s languages it knows', () => {
    expect(pickLocale(['fr-FR', 'de-AT', 'en'])).toBe('de-AT');
    expect(pickLocale(['fr-FR'])).toBe('en');
    expect(pickLocale([])).toBe('en');
  });

  it('fills in values', () => {
    expect(createI18n('en').t('checkout.connector', { number: 2 })).toBe('Connector 2');
    expect(createI18n('de-DE').t('checkout.connector', { number: 2 })).toBe('Anschluss 2');
  });
});
