// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import type { CheckoutState } from '../../src/api';
import { Receipt } from '../../src/pages/receipt';
import { aState, PUBLIC_ID } from '../fixtures';
import { fakeApi, render, settle, text } from '../render';

const SETTLED = aState({
  status: 'Captured',
  capturedAmount: 856,
  transaction: {
    startTime: '2026-10-23T10:00:00.000Z',
    endTime: '2026-10-23T10:30:00.000Z',
    isActive: false,
  },
});

async function show(state: CheckoutState, locale = 'en') {
  vi.stubGlobal('fetch', fakeApi({ [`GET /api/checkouts/${PUBLIC_ID}`]: { body: state } }).fetchFn);
  const container = await render(<Receipt publicId={PUBLIC_ID} />, locale);
  await settle();
  return container;
}

function rows(container: HTMLElement): string[][] {
  return [...container.querySelectorAll('tr')].map((row) =>
    [...row.querySelectorAll('th, td')].map((cell) => cell.textContent ?? ''),
  );
}

describe('Receipt', () => {
  it('itemises a settled session', async () => {
    const container = await show(SETTLED);

    expect(rows(container)).toEqual([
      ['Item', 'Quantity', 'Unit price (net)', 'Net'],
      ['Session fee', '1', '$1.50', '$1.50'],
      ['Energy (kWh)', '10', '$0.42', '$4.20'],
      ['Time (min)', '30', '$0.05', '$1.50'],
      ['Total (net)', '$7.20'],
      ['VAT 19%', '$1.36'],
      ['Total (gross)', '$8.56'],
      ['Charged to card', '$8.56'],
    ]);
    const shown = text(container);
    expect(shown).toContain('CitrineOS');
    expect(shown).toContain('1 Main Street, 02110 Boston, USA');
    expect(shown).toContain(PUBLIC_ID);
    expect(shown).not.toContain('Limited to the amount reserved');
  });

  it('notes when the charge was limited to the hold', async () => {
    const container = await show({ ...SETTLED, capturedAmount: 500 });

    expect(text(container)).toContain('Limited to the amount reserved on your card.');
  });

  it('speaks German to a German browser', async () => {
    const container = await show(SETTLED, 'de-DE');

    expect(rows(container)[6]).toEqual(['Summe (brutto)', '8,56 $']);
  });

  it('waits until the session is settled', async () => {
    const container = await show(aState());

    expect(text(container)).toContain('The receipt is available once the session is settled.');
  });
});
