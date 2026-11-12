// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import type { CheckoutState } from '../../src/api';
import { CheckoutStatus } from '../../src/api';
import { formatDateTime } from '../../src/format';
import { Receipt } from '../../src/pages/receipt';
import { aState, PUBLIC_ID, TRANSACTION_ID } from '../fixtures';
import { fakeApi, render, settle, text } from '../render';

const SETTLED = aState({
  status: CheckoutStatus.Captured,
  capturedAmount: 856,
  transaction: {
    transactionId: TRANSACTION_ID,
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

/** Each line of the receipt, as its label and value, section by section. */
function sections(container: HTMLElement): string[][][] {
  return [...container.querySelectorAll('dl')].map((list) =>
    [...list.querySelectorAll(':scope > div')].map((row) =>
      [...row.querySelectorAll('dt, dd')].map((cell) => cell.textContent ?? ''),
    ),
  );
}

describe('Receipt', () => {
  it('itemises a settled session', async () => {
    const container = await show(SETTLED);

    expect(sections(container)).toEqual([
      [
        ['Operator', 'CitrineOS'],
        ['Location', '1 Main Street, 02110 Boston, USA'],
        ['EVSE ID', 'US*CIT*E7'],
        ['ID', TRANSACTION_ID],
        // In the time zone the tests run in.
        ['Start', formatDateTime('2026-10-23T10:00:00.000Z', 'en')],
        ['End', formatDateTime('2026-10-23T10:30:00.000Z', 'en')],
      ],
      [
        ['Total (incl. VAT)', '$8.56'],
        ['Charged to card', '$8.56'],
      ],
      [
        ['Energy delivered', '10 kWh'],
        ['Charging time', '30m'],
      ],
      [
        ['Energy price ($0.42 per kWh)', '$4.20'],
        ['Time price ($0.05 per min)', '$1.50'],
        ['Session fee', '$1.50'],
        ['Total (excl. VAT)', '$7.20'],
        ['VAT (19%)', '$1.36'],
      ],
    ]);
    expect([...container.querySelectorAll('h2')].map((heading) => heading.textContent)).toEqual([
      'Overview',
      'Cost breakdown',
    ]);
    const shown = text(container);
    expect(shown).toContain('CitrineOS');
    expect(shown).toContain('1 Main Street, 02110 Boston, USA');
    expect(shown).not.toContain('Limited to the amount reserved');
  });

  it('notes when the charge was limited to the hold', async () => {
    const container = await show({ ...SETTLED, capturedAmount: 500 });

    expect(text(container)).toContain('Limited to the amount reserved on your card.');
  });

  it('speaks German to a German browser', async () => {
    const container = await show(SETTLED, 'de-DE');

    expect(sections(container)[1][0]).toEqual(['Summe (inkl. MwSt.)', '8,56 $']);
    expect(text(container)).toContain('Kostenaufstellung');
  });

  it('waits until the session is settled', async () => {
    const container = await show(aState());

    expect(text(container)).toContain('The receipt is available once the session is settled.');
  });
});
