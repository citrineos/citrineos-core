// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import type { TariffData } from '@citrineos/dal';
import QRCode from 'qrcode';
import type { ILogObj, Logger } from 'tslog';
import type { ICoreApiClient } from '../core/core-api-client.js';
import type { ICoreData, TransactionView } from '../core/core-data.js';
import type { ICheckoutRepository, IPaymentAccountRepository } from '../repositories/index.js';
import type { IPaymentProvider } from '../stripe/payment-provider.js';
import type { CheckoutDto } from '../types/index.js';
import { CheckoutFlow, CheckoutStatus } from '../types/index.js';
import { cancelCheckout } from './cancel-checkout.js';
import { clearQrCode } from './display-messages.js';
import { PaymentError, PaymentErrorCode } from './errors.js';
import { holdAmountOf } from './hold-amount.js';
import type { IdTokens } from './id-tokens.js';
import type { PollOptions } from './poll.js';
import { DEFAULT_POLL, pollFor } from './poll.js';
import type { TransactionStarted } from './settlement-service.js';

/** An OCPP 2.x transaction the EV started before any driver was authorised. */
export interface TransactionPluggedIn {
  tenantId: number;
  ocppConnectionName: string;
  transactionId: string;
}

export interface ScanAndChargeServiceDependencies {
  coreData: ICoreData;
  coreApi: ICoreApiClient;
  payments: IPaymentProvider;
  checkoutRepository: ICheckoutRepository;
  paymentAccountRepository: IPaymentAccountRepository;
  idTokens: IdTokens;
  publicUrl: string;
  poll?: PollOptions;
  logger?: Logger<ILogObj>;
}

/**
 * Scan and charge: when an EV is plugged in without anyone authorising it, the station shows a QR
 * code; the driver scans it and pays the hold, and the session is started as a web-portal one is.
 */
export class ScanAndChargeService {
  private readonly _coreData: ICoreData;
  private readonly _coreApi: ICoreApiClient;
  private readonly _payments: IPaymentProvider;
  private readonly _checkouts: ICheckoutRepository;
  private readonly _accounts: IPaymentAccountRepository;
  private readonly _idTokens: IdTokens;
  private readonly _publicUrl: string;
  private readonly _poll: PollOptions;
  private readonly _logger: Logger<ILogObj>;

  constructor(dependencies: ScanAndChargeServiceDependencies) {
    this._coreData = dependencies.coreData;
    this._coreApi = dependencies.coreApi;
    this._payments = dependencies.payments;
    this._checkouts = dependencies.checkoutRepository;
    this._accounts = dependencies.paymentAccountRepository;
    this._idTokens = dependencies.idTokens;
    this._publicUrl = dependencies.publicUrl.replace(/\/$/, '');
    this._poll = dependencies.poll ?? DEFAULT_POLL;
    this._logger = childLogger(dependencies.logger, this.constructor.name);
  }

  /** Opens a checkout for the transaction and shows its QR code on the station. */
  async onTransactionPluggedIn(event: TransactionPluggedIn): Promise<void> {
    const account = await this._accounts.findByTenantId(event.tenantId);
    if (!account?.scanAndChargeEnabled) {
      return;
    }
    const transaction = await pollFor(this._poll, () =>
      this._coreData.readTransaction(event.tenantId, event.ocppConnectionName, event.transactionId),
    );
    if (!transaction?.isActive) {
      this._logger.warn(
        `Core recorded no active transaction ${event.transactionId} at ${event.ocppConnectionName}`,
      );
      return;
    }
    if (await this._checkouts.findByTransactionDatabaseId(event.tenantId, transaction.id)) {
      return;
    }

    const connectorId = await this._connectorOf(event.tenantId, transaction);
    const tariff =
      connectorId === undefined
        ? undefined
        : await this._coreData.readTariffForConnector(event.tenantId, connectorId);
    const target =
      connectorId === undefined
        ? undefined
        : await this._coreData.readConnectorTarget(event.tenantId, connectorId);
    if (connectorId === undefined || !tariff || !target || target.protocol == null) {
      this._logger.warn(
        `Transaction ${event.transactionId} at ${event.ocppConnectionName} has no priced ` +
          'connector; it cannot be paid for by scan and charge',
      );
      return;
    }
    if (!this._isPayable(tariff)) {
      return;
    }

    const checkout = await this._checkouts.create(event.tenantId, {
      stripeAccountId: account.stripeAccountId,
      flow: CheckoutFlow.ScanAndCharge,
      connectorId,
      tariffSnapshot: tariff,
      transactionDatabaseId: transaction.id,
    });
    // The checkout's id is unique, so no two QR codes on a station can replace one another.
    const messageId = checkout.id;
    try {
      const result = await this._coreApi.setDisplayMessage({
        tenantId: event.tenantId,
        ocppConnectionName: event.ocppConnectionName,
        protocol: target.protocol,
        id: messageId,
        transactionId: event.transactionId,
        uri: this._qrCodeUrl(checkout.publicId),
      });
      if (!result.sent) {
        this._logger.warn(
          `Core did not show the QR code of ${checkout.publicId} at ` +
            `${event.ocppConnectionName}: ${result.detail}`,
        );
        return;
      }
    } catch (error) {
      this._logger.error(`Showing the QR code of ${checkout.publicId} failed`, error);
      return;
    }
    await this._checkouts.update(event.tenantId, checkout.id, { qrDisplayMessageId: messageId });
  }

  /**
   * A token other than this app's authorised the transaction, e.g. the driver tapped a card
   * instead of scanning: the open checkout is withdrawn and its QR code taken down.
   */
  async onTransactionAuthorized(event: TransactionStarted): Promise<void> {
    const { transactionId } = event;
    if (transactionId === undefined || this._idTokens.checkoutIdOf(event.idToken)) {
      return;
    }
    const read = () =>
      this._coreData.readTransaction(event.tenantId, event.ocppConnectionName, transactionId);
    const transaction = await read();
    const checkout =
      transaction &&
      (await this._checkouts.findByTransactionDatabaseId(event.tenantId, transaction.id));
    if (
      !checkout ||
      checkout.flow !== CheckoutFlow.ScanAndCharge ||
      checkout.status !== CheckoutStatus.Created
    ) {
      return;
    }
    // Core links the transaction to the token's Authorization only if it knows the token; a token
    // it does not know leaves the EV waiting, and the QR code is still the way to pay.
    const authorized = await pollFor(this._poll, async () => {
      const latest = await read();
      return latest?.authorizationId == null ? undefined : latest;
    });
    if (!authorized) {
      this._logger.info(
        `${event.idToken} did not authorise transaction ${transactionId}; ` +
          `checkout ${checkout.publicId} stays open`,
      );
      return;
    }
    const cancelled = await cancelCheckout(
      { checkouts: this._checkouts, payments: this._payments, logger: this._logger },
      checkout,
      [CheckoutStatus.Created],
    );
    const target =
      cancelled?.connectorId == null
        ? undefined
        : await this._coreData.readConnectorTarget(event.tenantId, cancelled.connectorId);
    if (cancelled && target) {
      await clearQrCode({ coreApi: this._coreApi, logger: this._logger }, cancelled, target);
    }
  }

  /**
   * Where the QR code sends the driver: Stripe while the EV is plugged in and the hold is unpaid,
   * the session's page otherwise.
   */
  async paymentUrl(publicId: string): Promise<string> {
    const checkout = await this._findScanAndCharge(publicId);
    const sessionUrl = `${this._publicUrl}/charging/${checkout.publicId}`;
    if (checkout.status !== CheckoutStatus.Created) {
      return sessionUrl;
    }
    const transaction =
      checkout.transactionDatabaseId === null
        ? undefined
        : await this._coreData.readTransactionById(
            checkout.tenantId,
            checkout.transactionDatabaseId,
          );
    if (!transaction?.isActive) {
      return sessionUrl;
    }
    // Repeat scans get the same Checkout Session back: the request is idempotent per checkout.
    const session = await this._payments.createCheckoutSession({
      stripeAccountId: checkout.stripeAccountId,
      checkoutPublicId: checkout.publicId,
      tenantId: checkout.tenantId,
      currency: checkout.currency,
      authorizationAmount: holdAmountOf(checkout.tariffSnapshot),
      successUrl: sessionUrl,
      cancelUrl: sessionUrl,
    });
    return session.url;
  }

  async qrCode(publicId: string): Promise<Buffer> {
    const checkout = await this._findScanAndCharge(publicId);
    return QRCode.toBuffer(this._paymentPageUrl(checkout.publicId), {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
    });
  }

  private async _findScanAndCharge(publicId: string): Promise<CheckoutDto> {
    const checkout = await this._checkouts.findByPublicId(publicId);
    if (!checkout || checkout.flow !== CheckoutFlow.ScanAndCharge) {
      throw new PaymentError(PaymentErrorCode.NotFound, 'No such checkout');
    }
    return checkout;
  }

  /** Core records the connector when the station names it; else an EVSE with one connector will do. */
  private async _connectorOf(
    tenantId: number,
    transaction: TransactionView,
  ): Promise<number | undefined> {
    if (transaction.connectorId != null) {
      return transaction.connectorId;
    }
    if (transaction.evseId == null) {
      return undefined;
    }
    const evse = await this._coreData.readEvse(tenantId, transaction.evseId);
    return evse?.connectors.length === 1 ? evse.connectors[0].id : undefined;
  }

  private _isPayable(tariff: TariffData): boolean {
    try {
      holdAmountOf(tariff);
      return true;
    } catch (error) {
      this._logger.warn(`Scan and charge is off for tariff ${tariff.id}: ${String(error)}`);
      return false;
    }
  }

  /** The image the station fetches and shows. */
  private _qrCodeUrl(publicId: string): string {
    return `${this._publicUrl}/api/checkouts/${publicId}/qr.png`;
  }

  /** What the QR code encodes. */
  private _paymentPageUrl(publicId: string): string {
    return `${this._publicUrl}/api/checkouts/${publicId}/pay`;
  }
}
