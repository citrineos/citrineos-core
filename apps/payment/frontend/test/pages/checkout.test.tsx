// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import type { EvseOffer } from '../../src/api';
import { Checkout, redirect } from '../../src/pages/checkout';
import { aConnector, anOffer, PUBLIC_ID } from '../fixtures';
import type { FakeResponse } from '../render';
import { button, click, fakeApi, render, settle, text } from '../render';

async function open(
  offer: EvseOffer | null,
  created: FakeResponse = {
    status: 201,
    body: { publicId: PUBLIC_ID, url: 'https://checkout.stripe.test/x' },
  },
) {
  const api = fakeApi({
    ...(offer ? { 'GET /api/evses/7': { body: offer } } : {}),
    'POST /api/checkouts': created,
  });
  vi.stubGlobal('fetch', api.fetchFn);
  const to = vi.spyOn(redirect, 'to').mockImplementation(() => undefined);
  const container = await render(<Checkout evseId={7} />);
  await settle();
  return { container, requests: api.requests, to };
}

describe('Checkout', () => {
  it('shows where the charger is, who runs it and what it costs with VAT', async () => {
    const { container } = await open(anOffer());

    const shown = text(container);
    expect(shown).toContain('US*CIT*E7');
    expect(shown).toContain('1 Main Street, 02110 Boston, USA');
    expect(shown).toContain('CitrineOS');
    expect(shown).toContain('$0.4998per kWh');
    expect(shown).toContain('$0.0595per minute');
    expect(shown).toContain('$1.785per session');
    expect(shown).toContain('incl. 19% VAT');
    expect(shown).toContain('$50.00 will be reserved on your card');
    expect(shown).toContain('22 kW');
  });

  it('opens a checkout for the connector and sends the driver to pay', async () => {
    const { container, requests, to } = await open(anOffer());

    await click(button(container, 'Pay and charge'));

    expect(requests.at(-1)).toEqual({
      method: 'POST',
      path: '/api/checkouts',
      body: { evseId: 7, connectorId: 70 },
    });
    expect(to).toHaveBeenCalledWith('https://checkout.stripe.test/x');
  });

  it('asks the driver to accept the operator’s terms first, when it has any', async () => {
    const { container, requests, to } = await open(
      anOffer({ termsUrl: 'https://operator.example.com/terms' }),
    );
    const terms = [...container.querySelectorAll('a')].find(
      (a) => a.textContent === 'terms and conditions',
    );
    expect(terms?.getAttribute('href')).toBe('https://operator.example.com/terms');

    await click(button(container, 'Pay and charge'));
    expect(text(container)).toContain('Please accept the terms and conditions first.');
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(0);

    const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]');
    await click(checkbox!);
    await click(button(container, 'Pay and charge'));
    expect(to).toHaveBeenCalled();
  });

  it('links no terms that are not a web page', async () => {
    const { container } = await open(anOffer({ termsUrl: 'javascript:alert(1)' }));

    const terms = [...container.querySelectorAll('a')].find(
      (a) => a.textContent === 'terms and conditions',
    );
    expect(terms?.hasAttribute('href')).toBe(false);
  });

  it('lets the driver choose among several connectors, but not one out of service', async () => {
    const { container, requests } = await open(
      anOffer({
        connectors: [
          aConnector({ id: 70, evseTypeConnectorId: 1 }),
          aConnector({
            id: 71,
            evseTypeConnectorId: 2,
            type: 'IEC62196T2COMBO',
            maximumPowerWatts: 150000,
          }),
          aConnector({ id: 72, evseTypeConnectorId: 3, status: 'Faulted' }),
        ],
      }),
    );

    await click(button(container, 'Pay and charge'));
    expect(text(container)).toContain('Choose a connector');
    expect(requests.filter((request) => request.method === 'POST')).toHaveLength(0);
    expect(button(container, 'Connector 3').disabled).toBe(true);

    await click(button(container, 'Connector 2'));
    await click(button(container, 'Pay and charge'));
    expect(requests.at(-1)?.body).toEqual({ evseId: 7, connectorId: 71 });
  });

  it.each([
    ['takes no card payments', anOffer({ payable: false }), 'does not take card payments'],
    ['is offline', anOffer({ stationOnline: false }), 'offline at the moment'],
  ])('offers no payment when the charger %s', async (_name, offer, message) => {
    const { container } = await open(offer);

    expect(text(container)).toContain(message);
    expect(() => button(container, 'Pay and charge')).toThrow();
  });

  it('cannot pay on a connector without a price', async () => {
    const { container } = await open(anOffer({ connectors: [aConnector({ tariff: null })] }));

    expect(text(container)).toContain('No price is set for this connector.');
    expect(button(container, 'Pay and charge').disabled).toBe(true);
  });

  it('says why the server would not open a checkout', async () => {
    const { container, to } = await open(anOffer(), {
      status: 409,
      body: { error: 'Connector 70 is Occupied' },
    });

    await click(button(container, 'Pay and charge'));

    expect(text(container)).toContain('This connector cannot be used right now.');
    expect(to).not.toHaveBeenCalled();
    expect(button(container, 'Pay and charge').disabled).toBe(false);
  });

  it('says so when there is no such charger', async () => {
    const { container } = await open(null);

    expect(text(container)).toContain('We could not find this charger.');
  });
});
