// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { CallbackSigner } from '../../src/services/callback-signer.js';
import { IdTokens } from '../../src/services/id-tokens.js';

describe('IdTokens', () => {
  const idTokens = new IdTokens('PAY_');

  it('issues the prefix and checkout id, short enough for an OCPP 1.6 idTag', () => {
    expect(idTokens.forCheckout(123456789012)).toBe('PAY_123456789012');
    expect(idTokens.forCheckout(123456789012).length).toBeLessThanOrEqual(20);
  });

  it('reads back the checkout id of a token it issued', () => {
    expect(idTokens.checkoutIdOf('PAY_42')).toBe(42);
  });

  it.each([null, undefined, '', 'PAY_', 'PAY_4a', 'XPAY_4', 'PAY_42 ', 'RFID-00042'])(
    'does not claim %j',
    (idToken) => {
      expect(idTokens.checkoutIdOf(idToken)).toBeUndefined();
    },
  );

  it('treats the prefix literally', () => {
    expect(new IdTokens('P.Y').checkoutIdOf('PAY7')).toBeUndefined();
    expect(new IdTokens('P.Y').checkoutIdOf('P.Y7')).toBe(7);
  });
});

describe('CallbackSigner', () => {
  const signer = new CallbackSigner('a-callback-secret-that-is-long-enough!');

  it('accepts its own signature for the checkout it signed', () => {
    expect(signer.verify('checkout-a', signer.sign('checkout-a'))).toBe(true);
  });

  it.each([
    ['another checkout’s signature', () => signer.sign('checkout-b')],
    ['another secret’s signature', () => new CallbackSigner('x'.repeat(40)).sign('checkout-a')],
    ['an empty signature', () => ''],
  ])('refuses %s', (_name, signature) => {
    expect(signer.verify('checkout-a', signature())).toBe(false);
  });
});
