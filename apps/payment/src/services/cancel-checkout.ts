// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj, Logger } from 'tslog';
import type { ICheckoutRepository } from '../repositories/index.js';
import type { IPaymentProvider } from '../stripe/payment-provider.js';
import type { CheckoutDto, CheckoutStatus, CheckoutUpdate } from '../types/index.js';
import { CheckoutStatus as Status } from '../types/index.js';

export interface CancelCheckoutDependencies {
  checkouts: ICheckoutRepository;
  payments: IPaymentProvider;
  logger: Logger<ILogObj>;
}

/**
 * The session will not be paid for: cancels the checkout if it is still in one of `from`, and
 * releases its hold, if it has one, so the driver is not charged.
 */
export async function cancelCheckout(
  dependencies: CancelCheckoutDependencies,
  checkout: CheckoutDto,
  from: CheckoutStatus[],
  changes: CheckoutUpdate = {},
): Promise<CheckoutDto | undefined> {
  const cancelled = await dependencies.checkouts.transition(checkout.tenantId, checkout.id, from, {
    ...changes,
    status: Status.Cancelled,
  });
  if (!cancelled?.paymentIntentId) {
    return cancelled;
  }
  await releaseHold(dependencies, cancelled, cancelled.paymentIntentId, 'cancel');
  return cancelled;
}

/** Cancels a payment intent; a failure is logged for someone to release the hold in Stripe. */
export async function releaseHold(
  dependencies: Pick<CancelCheckoutDependencies, 'payments' | 'logger'>,
  checkout: CheckoutDto,
  paymentIntentId: string,
  idempotencySuffix: string,
): Promise<void> {
  try {
    await dependencies.payments.cancel(
      checkout.stripeAccountId,
      paymentIntentId,
      `${checkout.tenantId}:${checkout.publicId}:${idempotencySuffix}`,
    );
  } catch (error) {
    dependencies.logger.error(
      `Could not release hold ${paymentIntentId} of checkout ${checkout.publicId}; ` +
        'release it in Stripe',
      error,
    );
  }
}
