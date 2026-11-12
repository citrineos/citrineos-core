// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type Stripe from 'stripe';
import type { PythonPaidCheckout, StripeFindings } from './types.js';

/** What the migration asks Stripe. */
export interface StripeLookup {
  /** Whether the key's platform can act on the connected account. */
  accountReachable(stripeAccountId: string): Promise<boolean>;
  paymentIntentStatus(
    stripeAccountId: string,
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent.Status>;
}

/** A manual-capture payment Stripe still holds on the driver's card. */
const HELD: Stripe.PaymentIntent.Status = 'requires_capture';

export function stripeLookup(stripe: Stripe): StripeLookup {
  return {
    async accountReachable(stripeAccountId) {
      try {
        await stripe.accounts.retrieve(stripeAccountId);
        return true;
      } catch {
        return false;
      }
    },
    async paymentIntentStatus(stripeAccountId, paymentIntentId) {
      const intent = await stripe.paymentIntents.retrieve(
        paymentIntentId,
        {},
        { stripeAccount: stripeAccountId },
      );
      return intent.status;
    },
  };
}

/**
 * Asks Stripe which of the Python service's payments are still held (`requires_capture`), and
 * whether this app's key reaches every operator's account. Read-only.
 */
export async function checkStripe(
  lookup: StripeLookup,
  stripeAccountIds: string[],
  checkouts: PythonPaidCheckout[],
): Promise<StripeFindings> {
  const unreachableAccounts = new Set<string>();
  for (const account of new Set(stripeAccountIds)) {
    if (!(await lookup.accountReachable(account))) {
      unreachableAccounts.add(account);
    }
  }
  const held = new Set<string>();
  const unknown = new Set<string>();
  for (const checkout of checkouts) {
    if (!checkout.stripeAccountId || unreachableAccounts.has(checkout.stripeAccountId)) {
      unknown.add(checkout.paymentIntentId);
      continue;
    }
    try {
      const status = await lookup.paymentIntentStatus(
        checkout.stripeAccountId,
        checkout.paymentIntentId,
      );
      if (status === HELD) {
        held.add(checkout.paymentIntentId);
      }
    } catch {
      unknown.add(checkout.paymentIntentId);
    }
  }
  return { held, unknown, unreachableAccounts };
}
