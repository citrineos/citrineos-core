// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import Stripe from 'stripe';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  InvalidWebhookError,
  PaymentEventType,
  StripePaymentProvider,
} from '../../src/stripe/payment-provider.js';

const SECRET = 'whsec_test';

interface RecordedRequest {
  method: string;
  path: string;
  headers: Headers;
  form: URLSearchParams;
}

/** A Stripe client whose HTTP calls are recorded and answered here instead of sent. */
function aRecordingProvider(responses: Record<string, object>) {
  const requests: RecordedRequest[] = [];
  const fetchFn: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    requests.push({
      method: init?.method ?? 'GET',
      path: url.pathname,
      headers: new Headers(init?.headers),
      form: new URLSearchParams(typeof init?.body === 'string' ? init.body : ''),
    });
    return new Response(JSON.stringify(responses[url.pathname] ?? {}), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Request-Id': 'req_1' },
    });
  };
  const stripe = new Stripe('sk_test_123', {
    httpClient: Stripe.createFetchHttpClient(fetchFn),
    maxNetworkRetries: 0,
  });
  return { provider: new StripePaymentProvider(stripe, SECRET), requests };
}

function signed(event: object) {
  const payload = JSON.stringify(event);
  const signature = new Stripe('sk_test_123').webhooks.generateTestHeaderString({
    payload,
    secret: SECRET,
  });
  return { body: Buffer.from(payload), signature };
}

function completed(overrides: Record<string, unknown> = {}, account: string | null = 'acct_1') {
  return {
    id: 'evt_1',
    object: 'event',
    type: 'checkout.session.completed',
    ...(account ? { account } : {}),
    data: {
      object: {
        id: 'cs_1',
        object: 'checkout.session',
        payment_intent: 'pi_1',
        amount_total: 5000,
        metadata: { checkoutPublicId: 'c0ffee00-0000-4000-8000-000000000000' },
        ...overrides,
      },
    },
  };
}

describe('StripePaymentProvider', () => {
  let recording: ReturnType<typeof aRecordingProvider>;

  beforeEach(() => {
    recording = aRecordingProvider({
      '/v1/checkout/sessions': {
        id: 'cs_1',
        object: 'checkout.session',
        url: 'https://pay.stripe/cs_1',
      },
      '/v1/payment_intents/pi_1/capture': { id: 'pi_1', object: 'payment_intent' },
      '/v1/payment_intents/pi_1/cancel': { id: 'pi_1', object: 'payment_intent' },
    });
  });

  it('opens a Checkout Session for a manual-capture hold on the connected account', async () => {
    const created = await recording.provider.createCheckoutSession({
      stripeAccountId: 'acct_1',
      checkoutPublicId: 'c0ffee00-0000-4000-8000-000000000000',
      tenantId: 4,
      currency: 'USD',
      authorizationAmount: 5000,
      successUrl: 'https://pay.example.com/charging/x',
      cancelUrl: 'https://pay.example.com/checkout/7',
    });

    expect(created).toEqual({ url: 'https://pay.stripe/cs_1' });
    const [request] = recording.requests;
    expect(request.path).toBe('/v1/checkout/sessions');
    expect(request.headers.get('Stripe-Account')).toBe('acct_1');
    expect(request.headers.get('Idempotency-Key')).toBe(
      '4:c0ffee00-0000-4000-8000-000000000000:session',
    );
    expect(Object.fromEntries(request.form)).toMatchObject({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][unit_amount]': '5000',
      'line_items[0][quantity]': '1',
      'payment_intent_data[capture_method]': 'manual',
      'metadata[checkoutPublicId]': 'c0ffee00-0000-4000-8000-000000000000',
      'metadata[tenantId]': '4',
      success_url: 'https://pay.example.com/charging/x',
      cancel_url: 'https://pay.example.com/checkout/7',
    });
  });

  it('captures an amount on the connected account', async () => {
    await recording.provider.capture('acct_1', 'pi_1', 1234, 'key-1');

    const [request] = recording.requests;
    expect(request.path).toBe('/v1/payment_intents/pi_1/capture');
    expect(request.headers.get('Stripe-Account')).toBe('acct_1');
    expect(request.headers.get('Idempotency-Key')).toBe('key-1');
    expect(request.form.get('amount_to_capture')).toBe('1234');
  });

  it('cancels on the connected account', async () => {
    await recording.provider.cancel('acct_1', 'pi_1', 'key-2');

    const [request] = recording.requests;
    expect(request.path).toBe('/v1/payment_intents/pi_1/cancel');
    expect(request.headers.get('Stripe-Account')).toBe('acct_1');
  });

  describe('parseWebhook', () => {
    it('reads a completed Checkout Session', () => {
      const { body, signature } = signed(completed());

      expect(recording.provider.parseWebhook(body, signature)).toEqual({
        type: PaymentEventType.CheckoutCompleted,
        stripeAccountId: 'acct_1',
        checkoutPublicId: 'c0ffee00-0000-4000-8000-000000000000',
        paymentIntentId: 'pi_1',
        amountAuthorized: 5000,
      });
    });

    it('passes over other event types', () => {
      const { body, signature } = signed({ ...completed(), type: 'charge.refunded' });

      expect(recording.provider.parseWebhook(body, signature)).toEqual({
        type: PaymentEventType.Unhandled,
        stripeType: 'charge.refunded',
      });
    });

    it('refuses a body that does not match its signature', () => {
      const { signature } = signed(completed());
      const tampered = Buffer.from(JSON.stringify(completed({ amount_total: 1 })));

      expect(() => recording.provider.parseWebhook(tampered, signature)).toThrow(
        InvalidWebhookError,
      );
    });

    it.each([
      ['a platform event (no connected account)', completed({}, null)],
      ['a session without a payment intent', completed({ payment_intent: null })],
      ['a session that is not a checkout of this app', completed({ metadata: {} })],
    ])('refuses %s', (_name, event) => {
      const { body, signature } = signed(event);

      expect(() => recording.provider.parseWebhook(body, signature)).toThrow(InvalidWebhookError);
    });
  });
});
