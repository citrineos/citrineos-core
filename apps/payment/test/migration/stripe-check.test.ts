// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { StripeLookup } from '../../src/migration/stripe-check.js';
import { checkStripe } from '../../src/migration/stripe-check.js';
import type { PythonPaidCheckout } from '../../src/migration/types.js';

function aCheckout(id: number, stripeAccountId: string | null = 'acct_a'): PythonPaidCheckout {
  return {
    id,
    paymentIntentId: `pi_${id}`,
    stripeAccountId,
    stationId: 'CS-1',
    transactionId: null,
    ended: false,
  };
}

const lookup: StripeLookup = {
  accountReachable: async (account) => account !== 'acct_elsewhere',
  paymentIntentStatus: async (_account, paymentIntentId) => {
    if (paymentIntentId === 'pi_4') {
      throw new Error('No such payment_intent');
    }
    return paymentIntentId === 'pi_1' ? 'requires_capture' : 'canceled';
  },
};

describe('checkStripe', () => {
  it('sorts the payments into held and unknown, and finds accounts the key cannot reach', async () => {
    const findings = await checkStripe(
      lookup,
      ['acct_a', 'acct_elsewhere', 'acct_a'],
      [
        aCheckout(1),
        aCheckout(2),
        aCheckout(3, 'acct_elsewhere'),
        aCheckout(4),
        aCheckout(5, null),
      ],
    );

    expect([...findings.held]).toEqual(['pi_1']);
    expect([...findings.unknown]).toEqual(['pi_3', 'pi_4', 'pi_5']);
    expect([...findings.unreachableAccounts]).toEqual(['acct_elsewhere']);
  });
});
