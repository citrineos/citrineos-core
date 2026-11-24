// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import { authedAction, type ActionResult } from '@lib/utils/action-guard';
import config from '@lib/utils/config';
import {
  PaymentCheckoutPageSchema,
  paymentCheckoutLink,
  type PaymentCheckoutLink,
} from '@lib/utils/payment-checkout';

/**
 * The payment app's checkout for a Core transaction, if a driver paid for it there; null when
 * there is none or no payment app is configured. `coreToken` is the signed-in user's own Core
 * token: the payment app asks Core whether its roles grant `payment.checkouts.get`, and for which
 * tenant, so the user sees only what Core lets them.
 */
export async function getPaymentCheckoutAction(
  transactionDatabaseId: number,
  coreToken: string | undefined,
): Promise<ActionResult<PaymentCheckoutLink | null>> {
  return authedAction(async (_session) => {
    if (!Number.isInteger(transactionDatabaseId) || transactionDatabaseId < 1) {
      throw new Error('Invalid transaction id');
    }
    const { paymentUrl } = config;
    if (!paymentUrl) {
      return null;
    }

    const url = new URL('/api/admin/checkouts', paymentUrl);
    url.searchParams.set('transactionDatabaseId', String(transactionDatabaseId));
    url.searchParams.set('limit', '1');
    const response = await fetch(url, {
      headers: coreToken ? { Authorization: `Bearer ${coreToken}` } : {},
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`The payment app answered ${response.status}`);
    }
    const [checkout] = PaymentCheckoutPageSchema.parse(await response.json()).checkouts;
    return checkout ? paymentCheckoutLink(checkout, config.paymentPublicUrl ?? paymentUrl) : null;
  });
}
