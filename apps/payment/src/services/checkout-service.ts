// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import type { TariffData } from '@citrineos/dal';
import type { ILogObj, Logger } from 'tslog';
import type { TariffDto } from '@citrineos/types';
import { ConnectorStatusEnum } from '@citrineos/types';
import type { ConnectorView, EvseView, ICoreData, TransactionView } from '../core/core-data.js';
import type { Pricing } from '../pricing/index.js';
import { calculatePricing, toMinorUnits } from '../pricing/index.js';
import type { ICheckoutRepository, IPaymentAccountRepository } from '../repositories/index.js';
import type { IPaymentProvider } from '../stripe/payment-provider.js';
import type { CheckoutStatus, RemoteStartStatus } from '../types/index.js';
import { CheckoutFlow, CheckoutStatus as Status } from '../types/index.js';
import { PaymentError, PaymentErrorCode } from './errors.js';
import { holdAmountOf } from './hold-amount.js';

const OUT_OF_SERVICE: readonly string[] = [
  ConnectorStatusEnum.Unavailable,
  ConnectorStatusEnum.Faulted,
];

/** A tariff as the driver is shown it. */
export type TariffSummary = Pick<
  TariffDto,
  'currency' | 'pricePerKwh' | 'pricePerMin' | 'pricePerSession' | 'taxRate'
> & {
  /** Minor units, unlike Core's. */
  authorizationAmount: number | null;
};

/** Where a checkout's session runs, for the driver's charging page and receipt. */
export type CheckoutEvse = Pick<EvseView, 'id' | 'evseId' | 'location' | 'operatorName'>;

export interface EvseOffer extends CheckoutEvse {
  stationOnline: boolean;
  /** The tenant takes payment here at all. */
  payable: boolean;
  /** Terms the driver accepts before paying, if the operator has any. */
  termsUrl: string | null;
  connectors: (ConnectorView & { tariff: TariffSummary | null })[];
}

export interface EvseFound {
  evseId: number;
}

export interface CheckoutStarted {
  publicId: string;
  url: string;
}

export interface CheckoutState {
  publicId: string;
  flow: CheckoutFlow;
  status: CheckoutStatus;
  remoteStartStatus: RemoteStartStatus | null;
  currency: string;
  authorizedAmount: number | null;
  capturedAmount: number | null;
  /** The tariff the checkout was priced with, as it was then. */
  tariff: TariffSummary;
  evse: CheckoutEvse | null;
  /** `transactionId` is the station's OCPP id for the session, shown on the receipt. */
  transaction: Pick<TransactionView, 'transactionId' | 'startTime' | 'endTime' | 'isActive'> | null;
  pricing: Pricing | null;
}

export interface CheckoutServiceDependencies {
  coreData: ICoreData;
  payments: IPaymentProvider;
  checkoutRepository: ICheckoutRepository;
  paymentAccountRepository: IPaymentAccountRepository;
  publicUrl: string;
  logger?: Logger<ILogObj>;
}

/** What a driver does before charging: look at an EVSE, then pay the hold to start a session. */
export class CheckoutService {
  private readonly _coreData: ICoreData;
  private readonly _payments: IPaymentProvider;
  private readonly _checkouts: ICheckoutRepository;
  private readonly _accounts: IPaymentAccountRepository;
  private readonly _publicUrl: string;
  private readonly _logger: Logger<ILogObj>;

  constructor(dependencies: CheckoutServiceDependencies) {
    this._coreData = dependencies.coreData;
    this._payments = dependencies.payments;
    this._checkouts = dependencies.checkoutRepository;
    this._accounts = dependencies.paymentAccountRepository;
    this._publicUrl = dependencies.publicUrl.replace(/\/$/, '');
    this._logger = childLogger(dependencies.logger, this.constructor.name);
  }

  /** Finds an EVSE by what a driver types: its database id, or the eMI3 id printed on it. */
  async findEvse(query: string): Promise<EvseFound> {
    const trimmed = query.trim();
    if (/^\d{1,9}$/.test(trimmed)) {
      return { evseId: (await this._findEvse(Number(trimmed))).id };
    }
    const evseIds = await this._coreData.findEvsesByEmi3Id(trimmed);
    if (evseIds.length > 1) {
      this._logger.error(`eMI3 id ${trimmed} names ${evseIds.length} EVSEs: ${evseIds.join(', ')}`);
    }
    if (evseIds.length !== 1) {
      throw new PaymentError(PaymentErrorCode.NotFound, `No EVSE ${trimmed}`);
    }
    return { evseId: evseIds[0] };
  }

  async describeEvse(evseDatabaseId: number): Promise<EvseOffer> {
    const evse = await this._findEvse(evseDatabaseId);
    const account = await this._accounts.findByTenantId(evse.tenantId);
    const connectors = await Promise.all(
      evse.connectors.map(async (connector) => {
        const tariff = await this._coreData.readTariffForConnector(evse.tenantId, connector.id);
        return { ...connector, tariff: tariff ? this._summarize(tariff) : null };
      }),
    );
    return {
      ...this._checkoutEvse(evse),
      stationOnline: evse.station.isOnline,
      payable: account !== undefined,
      termsUrl: this._webPage(account?.termsUrl),
      connectors,
    };
  }

  async createCheckout(evseDatabaseId: number, connectorId?: number): Promise<CheckoutStarted> {
    const evse = await this._findEvse(evseDatabaseId);
    const tenantId = evse.tenantId;
    if (evse.station.protocol == null) {
      throw new PaymentError(
        PaymentErrorCode.Unavailable,
        'The charging station has not connected yet',
      );
    }

    const connector = this._pickConnector(evse, connectorId);
    if (OUT_OF_SERVICE.includes(connector.status ?? ConnectorStatusEnum.Unknown)) {
      throw new PaymentError(
        PaymentErrorCode.Unavailable,
        `Connector ${connector.id} is ${connector.status}`,
      );
    }

    const tariff = await this._coreData.readTariffForConnector(tenantId, connector.id);
    if (!tariff) {
      throw new PaymentError(
        PaymentErrorCode.NotPayable,
        `Connector ${connector.id} has no tariff`,
      );
    }
    const authorizationAmount = holdAmountOf(tariff);

    const account = await this._accounts.findByTenantId(tenantId);
    if (!account) {
      throw new PaymentError(
        PaymentErrorCode.NotPayable,
        `Tenant ${tenantId} has no payment account`,
      );
    }

    const checkout = await this._checkouts.create(tenantId, {
      stripeAccountId: account.stripeAccountId,
      flow: CheckoutFlow.WebPortal,
      connectorId: connector.id,
      tariffSnapshot: tariff,
    });

    try {
      const session = await this._payments.createCheckoutSession({
        stripeAccountId: account.stripeAccountId,
        checkoutPublicId: checkout.publicId,
        tenantId,
        currency: tariff.currency,
        authorizationAmount,
        successUrl: `${this._publicUrl}/charging/${checkout.publicId}`,
        cancelUrl: `${this._publicUrl}/checkout/${evse.id}`,
      });
      return { publicId: checkout.publicId, url: session.url };
    } catch (error) {
      this._logger.error(`Stripe refused a Checkout Session for ${checkout.publicId}`, error);
      await this._checkouts.transition(tenantId, checkout.id, [Status.Created], {
        status: Status.Failed,
      });
      throw error;
    }
  }

  async getState(publicId: string): Promise<CheckoutState> {
    const checkout = await this._checkouts.findByPublicId(publicId);
    if (!checkout) {
      throw new PaymentError(PaymentErrorCode.NotFound, 'No such checkout');
    }
    const transaction =
      checkout.transactionDatabaseId === null
        ? undefined
        : await this._coreData.readTransactionById(
            checkout.tenantId,
            checkout.transactionDatabaseId,
          );
    return {
      publicId: checkout.publicId,
      flow: checkout.flow,
      status: checkout.status,
      remoteStartStatus: checkout.remoteStartStatus,
      currency: checkout.currency,
      authorizedAmount: checkout.authorizedAmount,
      capturedAmount: checkout.capturedAmount,
      tariff: this._summarize(checkout.tariffSnapshot),
      evse: await this._evseOf(checkout.tenantId, checkout.connectorId),
      transaction: transaction
        ? {
            transactionId: transaction.transactionId,
            startTime: transaction.startTime,
            endTime: transaction.endTime,
            isActive: transaction.isActive,
          }
        : null,
      pricing: transaction
        ? calculatePricing(checkout.tariffSnapshot, {
            energyKwh: transaction.totalKwh ?? null,
            chargingSeconds: transaction.timeSpentCharging ?? null,
          })
        : null,
    };
  }

  /** Only an http(s) address is handed to a browser as a link. */
  private _webPage(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }
    try {
      return ['http:', 'https:'].includes(new URL(url).protocol) ? url : null;
    } catch {
      return null;
    }
  }

  private async _evseOf(
    tenantId: number,
    connectorId: number | null,
  ): Promise<CheckoutEvse | null> {
    const target =
      connectorId === null
        ? undefined
        : await this._coreData.readConnectorTarget(tenantId, connectorId);
    const evse = target ? await this._coreData.readEvse(tenantId, target.evseId) : undefined;
    return evse ? this._checkoutEvse(evse) : null;
  }

  private _checkoutEvse(evse: EvseView): CheckoutEvse {
    return {
      id: evse.id,
      evseId: evse.evseId,
      location: evse.location,
      operatorName: evse.operatorName,
    };
  }

  private async _findEvse(evseDatabaseId: number): Promise<EvseView> {
    const tenantId = await this._coreData.resolveEvseTenant(evseDatabaseId);
    const evse =
      tenantId === undefined ? undefined : await this._coreData.readEvse(tenantId, evseDatabaseId);
    if (!evse || evse.removed) {
      throw new PaymentError(PaymentErrorCode.NotFound, `No EVSE ${evseDatabaseId}`);
    }
    return evse;
  }

  private _pickConnector(evse: EvseView, connectorId: number | undefined): ConnectorView {
    if (connectorId !== undefined) {
      const connector = evse.connectors.find((candidate) => candidate.id === connectorId);
      if (!connector) {
        throw new PaymentError(
          PaymentErrorCode.NotFound,
          `EVSE ${evse.id} has no connector ${connectorId}`,
        );
      }
      return connector;
    }
    if (evse.connectors.length !== 1) {
      throw new PaymentError(
        PaymentErrorCode.Invalid,
        `EVSE ${evse.id} has ${evse.connectors.length} connectors; name the one to charge on`,
      );
    }
    return evse.connectors[0];
  }

  private _summarize(tariff: TariffData): TariffSummary {
    let authorizationAmount: number | null = null;
    if (tariff.authorizationAmount) {
      try {
        authorizationAmount = toMinorUnits(tariff.authorizationAmount, tariff.currency);
      } catch {
        authorizationAmount = null;
      }
    }
    return {
      currency: tariff.currency,
      pricePerKwh: tariff.pricePerKwh,
      pricePerMin: tariff.pricePerMin ?? null,
      pricePerSession: tariff.pricePerSession ?? null,
      taxRate: tariff.taxRate ?? null,
      authorizationAmount,
    };
  }
}
