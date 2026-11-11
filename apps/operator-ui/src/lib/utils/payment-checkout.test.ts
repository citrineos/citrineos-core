// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { OCPP2_0_1 } from '@citrineos/types';
import {
  mayHavePaymentCheckout,
  PaymentCheckoutPageSchema,
  PaymentCheckoutStatus,
  paymentCheckoutLink,
  PaymentPage,
} from './payment-checkout';

const PUBLIC_ID = 'c0ffee00-0000-4000-8000-000000000000';

describe('paymentCheckoutLink', () => {
  it('links a captured checkout to its receipt', () => {
    expect(
      paymentCheckoutLink(
        { publicId: PUBLIC_ID, status: PaymentCheckoutStatus.Captured },
        'https://pay.example.com',
      ),
    ).toEqual({
      status: PaymentCheckoutStatus.Captured,
      page: PaymentPage.Receipt,
      url: `https://pay.example.com/receipt/${PUBLIC_ID}`,
    });
  });

  it.each([
    PaymentCheckoutStatus.Created,
    PaymentCheckoutStatus.Charging,
    PaymentCheckoutStatus.Capturing,
    PaymentCheckoutStatus.Cancelled,
    PaymentCheckoutStatus.Failed,
  ])('links a %s checkout to the page that follows the session', (status) => {
    expect(paymentCheckoutLink({ publicId: PUBLIC_ID, status }, 'http://localhost:9010/')).toEqual({
      status,
      page: PaymentPage.Charging,
      url: `http://localhost:9010/charging/${PUBLIC_ID}`,
    });
  });
});

describe('PaymentCheckoutPageSchema', () => {
  it('reads the checkouts out of the admin API answer', () => {
    const page = PaymentCheckoutPageSchema.parse({
      checkouts: [{ id: 3, publicId: PUBLIC_ID, status: 'Captured', tenantId: 1 }],
      nextBeforeId: null,
    });

    expect(page.checkouts).toEqual([{ publicId: PUBLIC_ID, status: 'Captured' }]);
  });

  it.each([
    ['an unknown status', { publicId: PUBLIC_ID, status: 'Lost' }],
    ['a public id that is not a UUID', { publicId: '../admin', status: 'Captured' }],
  ])('refuses %s', (_name, checkout) => {
    expect(PaymentCheckoutPageSchema.safeParse({ checkouts: [checkout] }).success).toBe(false);
  });
});

describe('mayHavePaymentCheckout', () => {
  const Central = OCPP2_0_1.IdTokenEnumType.Central;

  it.each([
    ['nothing has authorized it yet: scan and charge', {}],
    ['its authorization was not loaded', { authorizationId: 9 }],
    [
      'the payment app authorized it',
      { authorizationId: 9, authorization: { idToken: 'PAY_12', idTokenType: Central } },
    ],
  ])('asks when %s', (_name, transaction) => {
    expect(mayHavePaymentCheckout(transaction, 'PAY_')).toBe(true);
  });

  it.each([
    [
      'an RFID card',
      {
        authorizationId: 9,
        authorization: { idToken: '04A1B2C3', idTokenType: OCPP2_0_1.IdTokenEnumType.ISO14443 },
      },
    ],
    [
      'a card whose number happens to start with the prefix',
      {
        authorizationId: 9,
        authorization: { idToken: 'PAY_12', idTokenType: OCPP2_0_1.IdTokenEnumType.ISO14443 },
      },
    ],
    [
      'another Central token',
      { authorizationId: 9, authorization: { idToken: 'APP_12', idTokenType: Central } },
    ],
  ])('does not ask when %s authorized it', (_name, transaction) => {
    expect(mayHavePaymentCheckout(transaction, 'PAY_')).toBe(false);
  });

  it("follows the payment app's prefix", () => {
    const transaction = {
      authorizationId: 9,
      authorization: { idToken: 'PAYMENT-12', idTokenType: Central },
    };

    expect(mayHavePaymentCheckout(transaction, 'PAY_')).toBe(false);
    expect(mayHavePaymentCheckout(transaction, 'PAYMENT-')).toBe(true);
  });
});
