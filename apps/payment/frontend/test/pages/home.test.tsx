// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { Home } from '../../src/pages/home';
import { button, click, fakeApi, render, text, type } from '../render';

async function searchFor(query: string) {
  const container = await render(<Home />);
  const input = container.querySelector('input');
  if (!input) {
    throw new Error('No input');
  }
  await type(input, query);
  await click(button(container, 'Continue'));
  return container;
}

describe('Home', () => {
  it('goes to the checkout of the EVSE the driver typed in', async () => {
    const { fetchFn, requests } = fakeApi({
      'GET /api/evses/lookup?q=US*CIT*E7': { body: { evseId: 7 } },
    });
    vi.stubGlobal('fetch', fetchFn);

    await searchFor(' US*CIT*E7 ');

    expect(requests.map((request) => request.path)).toEqual(['/api/evses/lookup?q=US*CIT*E7']);
    expect(window.location.pathname).toBe('/checkout/7');
  });

  it('says so when there is no such EVSE', async () => {
    vi.stubGlobal('fetch', fakeApi({}).fetchFn);

    const container = await searchFor('US*CIT*E99');

    expect(text(container)).toContain('We could not find a charger with that ID.');
    expect(window.location.pathname).toBe('/');
  });

  it('asks for an id before looking', async () => {
    const { fetchFn, requests } = fakeApi({});
    vi.stubGlobal('fetch', fetchFn);

    const container = await searchFor('   ');

    expect(text(container)).toContain('Please enter an EVSE ID.');
    expect(requests).toHaveLength(0);
  });

  it('tells a network failure apart', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));

    const container = await searchFor('US*CIT*E7');

    expect(text(container)).toContain('No connection.');
  });
});
