// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use server';

import { AuthProviderTypeEnum } from '@lib/providers/auth-provider/types';
import { authedAction, type ActionResult } from '@lib/utils/action-guard';
import config from '@lib/utils/config';
import {
  PaymentCheckoutPageSchema,
  paymentCheckoutLink,
  type PaymentCheckoutLink,
} from '@lib/utils/payment-checkout';

/**
 * The payment app's checkout for a Core transaction, if a driver paid for it there; null when
 * there is none or no payment app is configured.
 */
export async function getPaymentCheckoutAction(
  transactionDatabaseId: number,
): Promise<ActionResult<PaymentCheckoutLink | null>> {
  return authedAction(async (session) => {
    if (!Number.isInteger(transactionDatabaseId) || transactionDatabaseId < 1) {
      throw new Error('Invalid transaction id');
    }
    const { paymentUrl, paymentAdminApiKey } = config;
    if (!paymentUrl || !paymentAdminApiKey) {
      return null;
    }
    // The API key sees every tenant's checkouts: only ever ask for the signed-in user's.
    const tenantId =
      config.authProvider === AuthProviderTypeEnum.enum.generic
        ? config.tenantId
        : session.user.tenantId;
    if (!/^\d+$/.test(String(tenantId ?? ''))) {
      throw new Error('The session names no tenant');
    }

    const url = new URL('/api/admin/checkouts', paymentUrl);
    url.searchParams.set('tenantId', String(tenantId));
    url.searchParams.set('transactionDatabaseId', String(transactionDatabaseId));
    url.searchParams.set('limit', '1');
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${paymentAdminApiKey}` },
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`The payment app answered ${response.status}`);
    }
    const [checkout] = PaymentCheckoutPageSchema.parse(await response.json()).checkouts;
    return checkout ? paymentCheckoutLink(checkout, config.paymentPublicUrl ?? paymentUrl) : null;
  });
}
