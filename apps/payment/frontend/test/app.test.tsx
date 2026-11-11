// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { App } from '../src/app';
import { anOffer } from './fixtures';
import { click, fakeApi, link, render, settle, text } from './render';

describe('App', () => {
  it('shows the page the address names, and moves between pages without reloading', async () => {
    vi.stubGlobal('fetch', fakeApi({ 'GET /api/evses/7': { body: anOffer() } }).fetchFn);
    window.history.replaceState(null, '', '/checkout/7');

    const container = await render(<App locale="en" />);
    await settle();
    expect(text(container)).toContain('Pay and charge');

    await click(link(container, 'Pay to charge'));
    expect(window.location.pathname).toBe('/');
    expect(text(container)).toContain('EVSE ID');
  });
});
