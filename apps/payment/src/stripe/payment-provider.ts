// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import Stripe from 'stripe';

export interface CheckoutSessionRequest {
  stripeAccountId: string;
  checkoutPublicId: string;
  tenantId: number;
  currency: string;
  /** Minor units. */
  authorizationAmount: number;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionCreated {
  url: string;
}

export const PaymentEventType = {
  CheckoutCompleted: 'checkout.completed',
  Unhandled: 'unhandled',
} as const;
export type PaymentEventType = (typeof PaymentEventType)[keyof typeof PaymentEventType];

/** A Checkout Session on a connected account was paid: the authorisation hold is in place. */
export interface CheckoutCompletedEvent {
  type: typeof PaymentEventType.CheckoutCompleted;
  stripeAccountId: string;
  checkoutPublicId: string;
  paymentIntentId: string;
  /** Minor units. */
  amountAuthorized: number;
}

export interface UnhandledEvent {
  type: typeof PaymentEventType.Unhandled;
  stripeType: string;
  /** Why an event of a type this app handles is still not its own to act on. */
  reason?: string;
}

export type PaymentEvent = CheckoutCompletedEvent | UnhandledEvent;

export class InvalidWebhookError extends Error {}

/**
 * The payment operations this app needs. Every call names the connected account it acts on:
 * payments are direct charges on the operator's own Stripe account.
 */
export interface IPaymentProvider {
  createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionCreated>;
  capture(
    stripeAccountId: string,
    paymentIntentId: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<void>;
  cancel(stripeAccountId: string, paymentIntentId: string, idempotencyKey: string): Promise<void>;
  /** Verifies the signature and reduces the event to what this app acts on. */
  parseWebhook(rawBody: Buffer, signature: string): PaymentEvent;
}

export class StripePaymentProvider implements IPaymentProvider {
  constructor(
    private readonly _stripe: Stripe,
    private readonly _connectWebhookSecret: string,
  ) {}

  static create(
    apiKey: string,
    connectWebhookSecret: string,
    config: Stripe.StripeConfig = {},
  ): StripePaymentProvider {
    return new StripePaymentProvider(new Stripe(apiKey, config), connectWebhookSecret);
  }

  async createCheckoutSession(request: CheckoutSessionRequest): Promise<CheckoutSessionCreated> {
    const session = await this._stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: request.currency.toLowerCase(),
              product_data: { name: 'Charging Session Authorization Amount' },
              unit_amount: request.authorizationAmount,
              tax_behavior: 'inclusive',
            },
            quantity: 1,
          },
        ],
        metadata: {
          checkoutPublicId: request.checkoutPublicId,
          tenantId: String(request.tenantId),
        },
        payment_intent_data: { capture_method: 'manual' },
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
      },
      {
        stripeAccount: request.stripeAccountId,
        idempotencyKey: `${request.tenantId}:${request.checkoutPublicId}:session`,
      },
    );
    if (!session.url) {
      throw new Error(`Stripe returned no URL for Checkout Session ${session.id}`);
    }
    return { url: session.url };
  }

  async capture(
    stripeAccountId: string,
    paymentIntentId: string,
    amount: number,
    idempotencyKey: string,
  ): Promise<void> {
    await this._stripe.paymentIntents.capture(
      paymentIntentId,
      { amount_to_capture: amount },
      { stripeAccount: stripeAccountId, idempotencyKey },
    );
  }

  async cancel(
    stripeAccountId: string,
    paymentIntentId: string,
    idempotencyKey: string,
  ): Promise<void> {
    await this._stripe.paymentIntents.cancel(
      paymentIntentId,
      {},
      { stripeAccount: stripeAccountId, idempotencyKey },
    );
  }

  parseWebhook(rawBody: Buffer, signature: string): PaymentEvent {
    let event: Stripe.Event;
    try {
      event = this._stripe.webhooks.constructEvent(rawBody, signature, this._connectWebhookSecret);
    } catch (error) {
      throw new InvalidWebhookError(error instanceof Error ? error.message : String(error));
    }

    if (event.type !== 'checkout.session.completed') {
      return { type: PaymentEventType.Unhandled, stripeType: event.type };
    }
    const session = event.data.object;
    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    const checkoutPublicId = session.metadata?.checkoutPublicId;
    if (!checkoutPublicId) {
      // Another app's session on the same connected account, e.g. citrineos-payment's while both
      // run during a migration: acknowledged, so Stripe does not retry it here or fail this endpoint.
      return {
        type: PaymentEventType.Unhandled,
        stripeType: event.type,
        reason: `Checkout Session ${session.id} was not opened by this app`,
      };
    }
    if (!event.account || !paymentIntentId || session.amount_total == null) {
      throw new InvalidWebhookError(
        `checkout.session.completed ${event.id} is missing its account, payment intent, checkout or amount`,
      );
    }
    return {
      type: PaymentEventType.CheckoutCompleted,
      stripeAccountId: event.account,
      checkoutPublicId,
      paymentIntentId,
      amountAuthorized: session.amount_total,
    };
  }
}
