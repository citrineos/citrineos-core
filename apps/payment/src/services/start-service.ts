// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import { OCPPVersion, RequestStartStopStatusEnum } from '@citrineos/types';
import type { ILogObj, Logger } from 'tslog';
import type { ICoreApiClient } from '../core/core-api-client.js';
import type { ICoreData } from '../core/core-data.js';
import { fromMinorUnits } from '../pricing/index.js';
import type { ICheckoutRepository, IPaymentAccountRepository } from '../repositories/index.js';
import type { IPaymentProvider, PaymentEvent } from '../stripe/payment-provider.js';
import { PaymentEventType } from '../stripe/payment-provider.js';
import type { CheckoutDto } from '../types/index.js';
import { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from '../types/index.js';
import type { CallbackSigner } from './callback-signer.js';
import { cancelCheckout, releaseHold } from './cancel-checkout.js';
import { clearQrCode } from './display-messages.js';
import { PaymentError, PaymentErrorCode } from './errors.js';
import type { IdTokens } from './id-tokens.js';

export interface StartServiceDependencies {
  coreData: ICoreData;
  coreApi: ICoreApiClient;
  payments: IPaymentProvider;
  checkoutRepository: ICheckoutRepository;
  paymentAccountRepository: IPaymentAccountRepository;
  callbackSigner: CallbackSigner;
  idTokens: IdTokens;
  internalUrl: string;
  logger?: Logger<ILogObj>;
}

/** From a paid hold to a started session: acts on Stripe's webhook and the station's answer. */
export class StartService {
  private readonly _coreData: ICoreData;
  private readonly _coreApi: ICoreApiClient;
  private readonly _payments: IPaymentProvider;
  private readonly _checkouts: ICheckoutRepository;
  private readonly _accounts: IPaymentAccountRepository;
  private readonly _signer: CallbackSigner;
  private readonly _idTokens: IdTokens;
  private readonly _internalUrl: string;
  private readonly _logger: Logger<ILogObj>;

  constructor(dependencies: StartServiceDependencies) {
    this._coreData = dependencies.coreData;
    this._coreApi = dependencies.coreApi;
    this._payments = dependencies.payments;
    this._checkouts = dependencies.checkoutRepository;
    this._accounts = dependencies.paymentAccountRepository;
    this._signer = dependencies.callbackSigner;
    this._idTokens = dependencies.idTokens;
    this._internalUrl = dependencies.internalUrl.replace(/\/$/, '');
    this._logger = childLogger(dependencies.logger, this.constructor.name);
  }

  async handlePaymentEvent(event: PaymentEvent): Promise<void> {
    if (event.type === PaymentEventType.Unhandled) {
      if (event.reason) {
        this._logger.info(`Ignoring Stripe event ${event.stripeType}: ${event.reason}`);
      } else {
        this._logger.debug(`Ignoring Stripe event ${event.stripeType}`);
      }
      return;
    }

    const account = await this._accounts.findByStripeAccountId(event.stripeAccountId);
    const checkout = await this._checkouts.findByPublicId(event.checkoutPublicId);
    if (
      !account ||
      !checkout ||
      checkout.tenantId !== account.tenantId ||
      checkout.stripeAccountId !== event.stripeAccountId
    ) {
      this._logger.warn(
        `Ignoring payment for checkout ${event.checkoutPublicId} on account ` +
          `${event.stripeAccountId}: no checkout of that account's tenant was charged there`,
      );
      return;
    }

    const authorized = await this._checkouts.transition(
      checkout.tenantId,
      checkout.id,
      [CheckoutStatus.Created],
      {
        status: CheckoutStatus.Authorized,
        paymentIntentId: event.paymentIntentId,
        authorizedAmount: event.amountAuthorized,
      },
    );
    if (!authorized) {
      if (checkout.paymentIntentId === event.paymentIntentId) {
        this._logger.info(`Checkout ${checkout.publicId} was already paid; ignoring the repeat`);
        return;
      }
      // E.g. a scan-and-charge driver who paid after unplugging: nothing will be charged against it.
      this._logger.warn(
        `Checkout ${checkout.publicId} is ${checkout.status} and takes no payment; ` +
          `releasing ${event.paymentIntentId}`,
      );
      await releaseHold(
        { payments: this._payments, logger: this._logger },
        checkout,
        event.paymentIntentId,
        `cancel:${event.paymentIntentId}`,
      );
      return;
    }
    await this._requestStart(authorized);
  }

  async handleRemoteStartAnswer(
    publicId: string,
    signature: string,
    answer: unknown,
  ): Promise<void> {
    if (!this._signer.verify(publicId, signature)) {
      throw new PaymentError(PaymentErrorCode.Forbidden, 'Bad callback signature');
    }
    const checkout = await this._checkouts.findByPublicId(publicId);
    if (!checkout) {
      throw new PaymentError(PaymentErrorCode.NotFound, 'No such checkout');
    }

    if (this._accepted(answer)) {
      await this._checkouts.update(checkout.tenantId, checkout.id, {
        remoteStartStatus: RemoteStartStatus.Accepted,
      });
      return;
    }

    this._logger.warn(
      `Station rejected the remote start of ${publicId}: ${JSON.stringify(answer)}`,
    );
    // The answer can overtake the Authorized -> StartRequested step that follows sending the request.
    await this._abandon(checkout, [CheckoutStatus.Authorized, CheckoutStatus.StartRequested]);
  }

  private async _requestStart(checkout: CheckoutDto): Promise<void> {
    const target =
      checkout.connectorId === null
        ? undefined
        : await this._coreData.readConnectorTarget(checkout.tenantId, checkout.connectorId);
    if (!target || target.protocol == null) {
      this._logger.error(`Checkout ${checkout.publicId} has no connector to start on`);
      await this._abandon(checkout, [CheckoutStatus.Authorized]);
      return;
    }
    if (!(await this._isStillPluggedIn(checkout))) {
      this._logger.warn(`Checkout ${checkout.publicId} was paid after its transaction ended`);
      await this._abandon(checkout, [CheckoutStatus.Authorized]);
      return;
    }

    let sent: boolean;
    try {
      const idToken = this._idTokens.forCheckout(checkout.id);
      await this._coreData.ensureAuthorization(checkout.tenantId, idToken);
      const isOcpp2 = target.protocol !== OCPPVersion.OCPP1_6;
      const result = await this._coreApi.remoteStart({
        tenantId: checkout.tenantId,
        ocppConnectionName: target.ocppConnectionName,
        protocol: target.protocol,
        idToken,
        evseTypeId: isOcpp2 ? (target.evseTypeId ?? null) : null,
        ocpp16ConnectorId: isOcpp2 ? null : (target.connectorId ?? null),
        remoteStartId: isOcpp2
          ? await this._coreData.nextRemoteStartId(checkout.tenantId, target.ocppConnectionName)
          : null,
        maxCost:
          checkout.authorizedAmount === null
            ? null
            : fromMinorUnits(checkout.authorizedAmount, checkout.currency),
        callbackUrl: this._callbackUrl(checkout.publicId),
      });
      sent = result.sent;
      if (!sent) {
        this._logger.warn(
          `Core did not send the remote start of ${checkout.publicId}: ${result.detail}`,
        );
      }
    } catch (error) {
      this._logger.error(`Remote start of ${checkout.publicId} failed`, error);
      sent = false;
    }

    if (!sent) {
      await this._abandon(checkout, [CheckoutStatus.Authorized]);
      return;
    }
    await this._checkouts.transition(checkout.tenantId, checkout.id, [CheckoutStatus.Authorized], {
      status: CheckoutStatus.StartRequested,
    });
    // Once paid, the station stops asking for payment.
    await clearQrCode({ coreApi: this._coreApi, logger: this._logger }, checkout, target);
  }

  /** A scan-and-charge payment only starts a session the EV is still plugged in for. */
  private async _isStillPluggedIn(checkout: CheckoutDto): Promise<boolean> {
    if (checkout.flow !== CheckoutFlow.ScanAndCharge || checkout.transactionDatabaseId === null) {
      return true;
    }
    const transaction = await this._coreData.readTransactionById(
      checkout.tenantId,
      checkout.transactionDatabaseId,
    );
    return transaction?.isActive === true;
  }

  /** The session will not start: release the hold so the driver is not charged. */
  private async _abandon(checkout: CheckoutDto, from: CheckoutStatus[]): Promise<void> {
    await cancelCheckout(
      { checkouts: this._checkouts, payments: this._payments, logger: this._logger },
      checkout,
      from,
      { remoteStartStatus: RemoteStartStatus.Rejected },
    );
  }

  private _callbackUrl(publicId: string): string {
    const url = new URL(`${this._internalUrl}/api/callbacks/remote-start/${publicId}`);
    url.searchParams.set('signature', this._signer.sign(publicId));
    return url.toString();
  }

  private _accepted(answer: unknown): boolean {
    return (
      typeof answer === 'object' &&
      answer !== null &&
      'status' in answer &&
      answer.status === RequestStartStopStatusEnum.Accepted
    );
  }
}
