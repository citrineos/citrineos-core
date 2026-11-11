// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import type { ILogObj, Logger } from 'tslog';
import type { ICoreData, TransactionView } from '../core/core-data.js';
import { calculatePricing } from '../pricing/index.js';
import type { ICheckoutRepository } from '../repositories/index.js';
import type { IPaymentProvider } from '../stripe/payment-provider.js';
import type { CheckoutDto } from '../types/index.js';
import { CheckoutStatus, RemoteStartStatus } from '../types/index.js';
import { cancelCheckout } from './cancel-checkout.js';
import type { IdTokens } from './id-tokens.js';
import type { PollOptions } from './poll.js';
import { DEFAULT_POLL, pollFor } from './poll.js';

export interface TransactionStarted {
  tenantId: number;
  ocppConnectionName: string;
  idToken: string;
  /** OCPP 2.x only: a 1.6 StartTransaction has no transaction id yet. */
  transactionId?: string;
}

export interface TransactionEnded {
  tenantId: number;
  ocppConnectionName: string;
  transactionId: string;
}

export interface SettlementServiceDependencies {
  coreData: ICoreData;
  payments: IPaymentProvider;
  checkoutRepository: ICheckoutRepository;
  idTokens: IdTokens;
  poll?: PollOptions;
  logger?: Logger<ILogObj>;
}

/** A checkout paid for whose session the station has yet to start. */
const STARTING: CheckoutStatus[] = [CheckoutStatus.Authorized, CheckoutStatus.StartRequested];

/** Follows a paid session through Core's transaction and settles it when the transaction ends. */
export class SettlementService {
  private readonly _coreData: ICoreData;
  private readonly _payments: IPaymentProvider;
  private readonly _checkouts: ICheckoutRepository;
  private readonly _idTokens: IdTokens;
  private readonly _poll: PollOptions;
  private readonly _logger: Logger<ILogObj>;

  constructor(dependencies: SettlementServiceDependencies) {
    this._coreData = dependencies.coreData;
    this._payments = dependencies.payments;
    this._checkouts = dependencies.checkoutRepository;
    this._idTokens = dependencies.idTokens;
    this._poll = dependencies.poll ?? DEFAULT_POLL;
    this._logger = childLogger(dependencies.logger, this.constructor.name);
  }

  async onTransactionStarted(event: TransactionStarted): Promise<void> {
    const checkoutId = this._idTokens.checkoutIdOf(event.idToken);
    if (checkoutId === undefined) {
      return;
    }
    const checkout = await this._checkouts.findById(event.tenantId, checkoutId);
    if (!checkout || !STARTING.includes(checkout.status)) {
      return;
    }
    const authorizationId = await this._coreData.readAuthorizationId(event.tenantId, event.idToken);
    if (authorizationId === undefined) {
      this._logger.warn(
        `No Authorization for ${event.idToken}; checkout ${checkout.publicId} unlinked`,
      );
      return;
    }

    const transaction = await this._pollFor(() =>
      this._coreData.readActiveTransactionForAuthorization(event.tenantId, authorizationId),
    );
    if (!transaction) {
      this._logger.warn(
        `Core recorded no transaction for ${event.idToken} at ${event.ocppConnectionName}`,
      );
      return;
    }
    if (
      checkout.transactionDatabaseId !== null &&
      checkout.transactionDatabaseId !== transaction.id
    ) {
      this._logger.info(
        `${event.ocppConnectionName} started transaction ${transaction.transactionId} for ` +
          `checkout ${checkout.publicId} instead of authorising the one it was plugged in for`,
      );
    }
    await this._checkouts.transition(event.tenantId, checkout.id, STARTING, {
      status: CheckoutStatus.Charging,
      transactionDatabaseId: transaction.id,
      remoteStartStatus: RemoteStartStatus.Accepted,
    });
  }

  async onTransactionEnded(event: TransactionEnded): Promise<void> {
    const read = () =>
      this._coreData.readTransaction(event.tenantId, event.ocppConnectionName, event.transactionId);
    const transaction = await this._pollFor(read);
    const checkout =
      transaction &&
      (await this._checkouts.findByTransactionDatabaseId(event.tenantId, transaction.id));
    if (!checkout) {
      return;
    }
    if (checkout.status !== CheckoutStatus.Charging) {
      // Scan and charge: the EV left before the driver paid, or before the station took the payment.
      await cancelCheckout(
        { checkouts: this._checkouts, payments: this._payments, logger: this._logger },
        checkout,
        [CheckoutStatus.Created, ...STARTING],
      );
      return;
    }

    const ended = await this._pollFor(async () => {
      const latest = await read();
      return latest && this.isSettled(latest) ? latest : undefined;
    });
    if (!ended) {
      this._logger.error(
        `Transaction ${event.transactionId} at ${event.ocppConnectionName} ended without its ` +
          `final kWh and charging time; checkout ${checkout.publicId} is left uncaptured`,
      );
      return;
    }
    await this.capture(checkout, ended);
  }

  /**
   * Charges what the session cost, up to the hold; releases the hold when it cost nothing. A retry
   * passes the status the last attempt stopped in as `from`; Stripe's idempotency keys make a
   * repeated capture or release a no-op.
   */
  async capture(
    checkout: CheckoutDto,
    transaction: TransactionView,
    from: CheckoutStatus[] = [CheckoutStatus.Charging],
  ): Promise<void> {
    const capturing = await this._checkouts.transition(checkout.tenantId, checkout.id, from, {
      status: CheckoutStatus.Capturing,
    });
    if (!capturing || !capturing.paymentIntentId) {
      return;
    }

    const pricing = calculatePricing(capturing.tariffSnapshot, {
      energyKwh: transaction.totalKwh ?? null,
      chargingSeconds: transaction.timeSpentCharging ?? null,
    });
    const authorized = capturing.authorizedAmount ?? 0;
    const amount = Math.min(pricing.totalCostsGross, authorized);
    if (pricing.totalCostsGross > authorized) {
      this._logger.warn(
        `Checkout ${capturing.publicId} cost ${pricing.totalCostsGross} but only ${authorized} ` +
          `was authorised; ${pricing.totalCostsGross - authorized} ${capturing.currency} minor units go uncollected`,
      );
    }

    try {
      if (amount <= 0) {
        await this._payments.cancel(
          capturing.stripeAccountId,
          capturing.paymentIntentId,
          `${capturing.tenantId}:${capturing.publicId}:cancel`,
        );
        await this._checkouts.transition(
          capturing.tenantId,
          capturing.id,
          [CheckoutStatus.Capturing],
          {
            status: CheckoutStatus.Cancelled,
            capturedAmount: 0,
          },
        );
        return;
      }
      await this._payments.capture(
        capturing.stripeAccountId,
        capturing.paymentIntentId,
        amount,
        `${capturing.tenantId}:${capturing.publicId}:capture`,
      );
      await this._checkouts.transition(
        capturing.tenantId,
        capturing.id,
        [CheckoutStatus.Capturing],
        {
          status: CheckoutStatus.Captured,
          capturedAmount: amount,
        },
      );
    } catch (error) {
      this._logger.error(`Capturing checkout ${capturing.publicId} failed`, error);
      await this._checkouts.transition(
        capturing.tenantId,
        capturing.id,
        [CheckoutStatus.Capturing],
        {
          status: CheckoutStatus.Failed,
        },
      );
    }
  }

  /** The transaction is over and Core has recorded what it took to price it. */
  isSettled(transaction: TransactionView): boolean {
    return (
      !transaction.isActive && transaction.totalKwh != null && transaction.timeSpentCharging != null
    );
  }

  private _pollFor<T>(read: () => Promise<T | undefined>): Promise<T | undefined> {
    return pollFor(this._poll, read);
  }
}
