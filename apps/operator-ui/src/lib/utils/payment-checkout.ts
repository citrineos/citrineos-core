// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1 } from '@citrineos/types';
import { z } from 'zod';

/** A checkout's status, as the payment app's admin API reports it. */
export const PaymentCheckoutStatusSchema = z.enum([
  'Created',
  'Authorized',
  'StartRequested',
  'Charging',
  'Capturing',
  'Captured',
  'Cancelled',
  'Failed',
]);
export const PaymentCheckoutStatus = PaymentCheckoutStatusSchema.enum;
export type PaymentCheckoutStatus = z.infer<typeof PaymentCheckoutStatusSchema>;

/** The part of `GET /api/admin/checkouts` this app reads. */
export const PaymentCheckoutPageSchema = z.object({
  checkouts: z.array(z.object({ publicId: z.uuid(), status: PaymentCheckoutStatusSchema })),
});

/**
 * Whether the payment app can have a checkout for a transaction, so it is worth asking. It
 * authorizes its sessions with Central idTokens that start with its prefix; a scan-and-charge
 * checkout exists before anyone has authorized the transaction. A transaction another token
 * authorized can have, at most, a scan-and-charge checkout that was canceled unpaid.
 */
export function mayHavePaymentCheckout(
  transaction: {
    authorizationId?: number | null;
    authorization?: { idToken?: string | null; idTokenType?: string | null } | null;
  },
  idTokenPrefix: string,
): boolean {
  if (transaction.authorizationId == null) {
    return true;
  }
  const authorization = transaction.authorization;
  if (!authorization?.idToken) {
    // Authorized, but by a token this page was not given: it cannot be ruled out.
    return true;
  }
  return (
    authorization.idTokenType === OCPP2_0_1.IdTokenEnumType.Central &&
    authorization.idToken.startsWith(idTokenPrefix)
  );
}

/** The payment app's driver pages a checkout can be looked at on. */
export const PaymentPage = {
  Receipt: 'receipt',
  Charging: 'charging',
} as const;
export type PaymentPage = (typeof PaymentPage)[keyof typeof PaymentPage];

export interface PaymentCheckoutLink {
  status: PaymentCheckoutStatus;
  page: PaymentPage;
  url: string;
}

/**
 * Where a driver sees a checkout: its receipt once the payment is captured, else the page that
 * follows the session.
 */
export function paymentCheckoutLink(
  checkout: { publicId: string; status: PaymentCheckoutStatus },
  publicUrl: string,
): PaymentCheckoutLink {
  const page =
    checkout.status === PaymentCheckoutStatus.Captured ? PaymentPage.Receipt : PaymentPage.Charging;
  return {
    status: checkout.status,
    page,
    url: new URL(`/${page}/${encodeURIComponent(checkout.publicId)}`, publicUrl).toString(),
  };
}
