// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import type { ILogObj, Logger } from 'tslog';
import type { ICoreData, TransactionView } from '../core/core-data.js';
import type { ICheckoutRepository } from '../repositories/index.js';
import type { IPaymentProvider } from '../stripe/payment-provider.js';
import type { CheckoutDto } from '../types/index.js';
import { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from '../types/index.js';
import { cancelCheckout } from './cancel-checkout.js';
import type { IdTokens } from './id-tokens.js';
import type { SettlementService } from './settlement-service.js';

/** Stripe expires an unpaid Checkout Session after 24 hours; nothing can be paid after that. */
const CHECKOUT_SESSION_LIFETIME_MS = 25 * 60 * 60 * 1000;
const SWEEP_BATCH = 100;

/** What reconciling a checkout did. */
export const ReconcileOutcome = {
  Settled: 'settled',
  Linked: 'linked',
  Cancelled: 'cancelled',
  Expired: 'expired',
  Waiting: 'waiting',
  Unchanged: 'unchanged',
} as const;
export type ReconcileOutcome = (typeof ReconcileOutcome)[keyof typeof ReconcileOutcome];

export interface ReconciliationServiceDependencies {
  coreData: ICoreData;
  payments: IPaymentProvider;
  checkoutRepository: ICheckoutRepository;
  settlementService: SettlementService;
  idTokens: IdTokens;
  /** How long a checkout sits in one status before the sweep acts on it. */
  staleAfterMs: number;
  now?: () => Date;
  logger?: Logger<ILogObj>;
}

/**
 * Finishes checkouts the event-driven path left behind: a capture interrupted by a crash or a
 * Stripe outage, a transaction end this app never heard of, a start the station never made.
 * Every step goes through the same status transitions as the event-driven path, so it is safe
 * to run beside it and on several instances.
 */
export class ReconciliationService {
  private readonly _coreData: ICoreData;
  private readonly _payments: IPaymentProvider;
  private readonly _checkouts: ICheckoutRepository;
  private readonly _settlement: SettlementService;
  private readonly _idTokens: IdTokens;
  private readonly _staleAfterMs: number;
  private readonly _now: () => Date;
  private readonly _logger: Logger<ILogObj>;
  private _sweeping = false;
  private _timer?: NodeJS.Timeout;

  constructor(dependencies: ReconciliationServiceDependencies) {
    this._coreData = dependencies.coreData;
    this._payments = dependencies.payments;
    this._checkouts = dependencies.checkoutRepository;
    this._settlement = dependencies.settlementService;
    this._idTokens = dependencies.idTokens;
    this._staleAfterMs = dependencies.staleAfterMs;
    this._now = dependencies.now ?? (() => new Date());
    this._logger = childLogger(dependencies.logger, this.constructor.name);
  }

  /** Sweeps every `intervalMs` until stopped. */
  start(intervalMs: number): void {
    this.stop();
    this._timer = setInterval(() => void this.sweep(), intervalMs);
    this._timer.unref();
  }

  stop(): void {
    clearInterval(this._timer);
    this._timer = undefined;
  }

  /** Reconciles the checkouts that have not moved for a while; overlapping calls do nothing. */
  async sweep(): Promise<number> {
    if (this._sweeping) {
      return 0;
    }
    this._sweeping = true;
    try {
      const stale = await this._checkouts.findStale(
        [
          CheckoutStatus.Created,
          CheckoutStatus.Authorized,
          CheckoutStatus.StartRequested,
          CheckoutStatus.Charging,
          CheckoutStatus.Capturing,
        ],
        new Date(this._now().getTime() - this._staleAfterMs),
        SWEEP_BATCH,
      );
      for (const checkout of stale) {
        try {
          const outcome = await this.reconcile(checkout);
          if (outcome !== ReconcileOutcome.Waiting && outcome !== ReconcileOutcome.Unchanged) {
            this._logger.info(`Reconciled checkout ${checkout.publicId}: ${outcome}`);
          }
        } catch (error) {
          this._logger.error(`Reconciling checkout ${checkout.publicId} failed`, error);
        }
      }
      return stale.length;
    } finally {
      this._sweeping = false;
    }
  }

  /**
   * Moves one checkout on as far as Core's data allows. `retryFailed` also retries a capture that
   * failed, which only an operator asks for: a failure may be a card that cannot be charged.
   */
  async reconcile(checkout: CheckoutDto, retryFailed = false): Promise<ReconcileOutcome> {
    switch (checkout.status) {
      case CheckoutStatus.Created:
        return this._reconcileUnpaid(checkout);
      case CheckoutStatus.Authorized:
      case CheckoutStatus.StartRequested:
        return this._reconcileStarting(checkout);
      case CheckoutStatus.Charging:
        return this._settleIfEnded(checkout, [CheckoutStatus.Charging]);
      case CheckoutStatus.Capturing:
        return this._settleIfEnded(checkout, [CheckoutStatus.Capturing]);
      case CheckoutStatus.Failed:
        return retryFailed
          ? this._settleIfEnded(checkout, [CheckoutStatus.Failed])
          : ReconcileOutcome.Unchanged;
      default:
        return ReconcileOutcome.Unchanged;
    }
  }

  private async _reconcileUnpaid(checkout: CheckoutDto): Promise<ReconcileOutcome> {
    if (checkout.flow === CheckoutFlow.ScanAndCharge && checkout.transactionDatabaseId !== null) {
      const transaction = await this._coreData.readTransactionById(
        checkout.tenantId,
        checkout.transactionDatabaseId,
      );
      if (!transaction?.isActive) {
        await this._cancel(checkout, [CheckoutStatus.Created]);
        return ReconcileOutcome.Cancelled;
      }
    }
    const age = this._now().getTime() - (checkout.createdAt?.getTime() ?? this._now().getTime());
    if (age > CHECKOUT_SESSION_LIFETIME_MS) {
      await this._cancel(checkout, [CheckoutStatus.Created]);
      return ReconcileOutcome.Expired;
    }
    return ReconcileOutcome.Waiting;
  }

  /**
   * Paid, but no transaction was linked. Either the station started one that this app missed, and
   * the checkout is linked to it now, or it never did, and the hold is released.
   */
  private async _reconcileStarting(checkout: CheckoutDto): Promise<ReconcileOutcome> {
    const transaction = await this._startedTransaction(checkout);
    if (!transaction) {
      this._logger.warn(
        `Checkout ${checkout.publicId} was paid but its session never started; releasing the hold`,
      );
      await this._cancel(checkout, [CheckoutStatus.Authorized, CheckoutStatus.StartRequested], {
        remoteStartStatus: RemoteStartStatus.Rejected,
      });
      return ReconcileOutcome.Cancelled;
    }
    const charging = await this._checkouts.transition(
      checkout.tenantId,
      checkout.id,
      [CheckoutStatus.Authorized, CheckoutStatus.StartRequested],
      {
        status: CheckoutStatus.Charging,
        transactionDatabaseId: transaction.id,
        remoteStartStatus: RemoteStartStatus.Accepted,
      },
    );
    if (!charging) {
      return ReconcileOutcome.Unchanged;
    }
    return (await this._settleIfEnded(charging, [CheckoutStatus.Charging])) ===
      ReconcileOutcome.Settled
      ? ReconcileOutcome.Settled
      : ReconcileOutcome.Linked;
  }

  private async _startedTransaction(checkout: CheckoutDto): Promise<TransactionView | undefined> {
    const authorizationId = await this._coreData.readAuthorizationId(
      checkout.tenantId,
      this._idTokens.forCheckout(checkout.id),
    );
    if (authorizationId === undefined) {
      return undefined;
    }
    return this._coreData.readLatestTransactionForAuthorization(
      checkout.tenantId,
      authorizationId,
      checkout.createdAt ?? this._now(),
    );
  }

  private async _settleIfEnded(
    checkout: CheckoutDto,
    from: CheckoutStatus[],
  ): Promise<ReconcileOutcome> {
    const transaction =
      checkout.transactionDatabaseId === null
        ? undefined
        : await this._coreData.readTransactionById(
            checkout.tenantId,
            checkout.transactionDatabaseId,
          );
    if (!transaction) {
      this._logger.error(
        `Checkout ${checkout.publicId} is ${checkout.status} but Core has no transaction ` +
          `${checkout.transactionDatabaseId}; settle it in Stripe`,
      );
      return ReconcileOutcome.Unchanged;
    }
    if (!this._settlement.isSettled(transaction)) {
      if (!transaction.isActive) {
        this._logger.warn(
          `Transaction ${transaction.transactionId} of checkout ${checkout.publicId} ended ` +
            'without its final kWh and charging time; it cannot be priced yet',
        );
      }
      return ReconcileOutcome.Waiting;
    }
    await this._settlement.capture(checkout, transaction, from);
    return ReconcileOutcome.Settled;
  }

  private async _cancel(
    checkout: CheckoutDto,
    from: CheckoutStatus[],
    changes: Parameters<typeof cancelCheckout>[3] = {},
  ): Promise<void> {
    await cancelCheckout(
      { checkouts: this._checkouts, payments: this._payments, logger: this._logger },
      checkout,
      from,
      changes,
    );
  }
}
