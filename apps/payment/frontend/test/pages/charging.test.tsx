// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { CheckoutState } from '../../src/api';
import { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from '../../src/api';
import { Charging, POLL_INTERVAL_MS } from '../../src/pages/charging';
import { aState, PUBLIC_ID } from '../fixtures';
import { fakeApi, link, render, settle, text } from '../render';

const PATH = `GET /api/checkouts/${PUBLIC_ID}`;

async function show(...states: CheckoutState[]) {
  let call = 0;
  const api = fakeApi({
    [PATH]: () => ({ body: states[Math.min(call++, states.length - 1)] }),
  });
  vi.stubGlobal('fetch', api.fetchFn);
  const container = await render(<Charging publicId={PUBLIC_ID} />);
  await settle();
  return { container, requests: api.requests };
}

async function wait(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
  await settle();
}

describe('Charging', () => {
  it('shows the session’s cost, time and energy so far', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-10-23T10:12:34.000Z'));

    const { container } = await show(aState());

    const shown = text(container);
    expect(shown).toContain('Charging');
    expect(shown).toContain('$8.56');
    expect(shown).toContain('0:12:34');
    expect(shown).toContain('10 kWh');
    expect(shown).toContain('US*CIT*E7');
  });

  it('keeps asking until the session is settled, then shows what was charged', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    const { container, requests } = await show(
      aState({ status: CheckoutStatus.StartRequested, transaction: null, pricing: null }),
      aState(),
      aState({
        status: CheckoutStatus.Captured,
        capturedAmount: 856,
        transaction: {
          startTime: '2026-10-23T10:00:00.000Z',
          endTime: '2026-10-23T10:30:00.000Z',
          isActive: false,
        },
      }),
    );
    expect(text(container)).toContain('Waiting for the charger to start');

    await wait(POLL_INTERVAL_MS);
    expect(text(container)).toContain('Cost so far');

    await wait(POLL_INTERVAL_MS);
    expect(text(container)).toContain('Session finished');
    expect(text(container)).toContain('Charged to your card$8.56');
    expect(text(container)).toContain('0:30:00');
    expect(link(container, 'View receipt').getAttribute('href')).toBe(`/receipt/${PUBLIC_ID}`);

    const asked = requests.length;
    await wait(POLL_INTERVAL_MS * 3);
    expect(requests).toHaveLength(asked);
  });

  it('reassures the driver when the charger refused to start', async () => {
    const { container } = await show(
      aState({
        status: CheckoutStatus.Cancelled,
        remoteStartStatus: RemoteStartStatus.Rejected,
        transaction: null,
        pricing: null,
      }),
    );

    expect(text(container)).toContain('The charger did not start the session.');
    expect(text(container)).toContain('Nothing was charged.');
    expect(link(container, 'Try again').getAttribute('href')).toBe('/checkout/7');
  });

  it('sends a scan-and-charge driver who has not paid back to pay', async () => {
    const { container } = await show(
      aState({
        flow: CheckoutFlow.ScanAndCharge,
        status: CheckoutStatus.Created,
        transaction: null,
        pricing: null,
      }),
    );

    expect(text(container)).toContain('Waiting for your payment.');
    expect(link(container, 'Pay now').getAttribute('href')).toBe(`/api/checkouts/${PUBLIC_ID}/pay`);
  });

  it('sends a web-portal driver who left the payment back to the charger', async () => {
    const { container } = await show(
      aState({ status: CheckoutStatus.Created, transaction: null, pricing: null }),
    );

    expect(text(container)).toContain('The payment was not completed.');
    expect(link(container, 'Try again').getAttribute('href')).toBe('/checkout/7');
  });

  it('says so when there is no such session', async () => {
    vi.stubGlobal('fetch', fakeApi({}).fetchFn);

    const container = await render(<Charging publicId="unknown" />);
    await settle();

    expect(text(container)).toContain('We could not find this session.');
  });
});
