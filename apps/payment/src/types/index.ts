// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TariffData } from '@citrineos/dal';
import type { CheckoutFlow, RemoteStartStatus } from './checkout-enums.js';
import { CheckoutStatus } from './checkout-enums.js';

export { CheckoutFlow, CheckoutStatus, RemoteStartStatus } from './checkout-enums.js';

export interface PaymentAccountDto {
  id: number;
  tenantId: number;
  stripeAccountId: string;
  scanAndChargeEnabled: boolean;
  /** The operator's terms a driver accepts before paying; none to ask for no acceptance. */
  termsUrl: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaymentAccountCreate {
  stripeAccountId: string;
  scanAndChargeEnabled?: boolean;
  termsUrl?: string | null;
}

export type PaymentAccountUpdate = Partial<
  Pick<PaymentAccountDto, 'stripeAccountId' | 'scanAndChargeEnabled' | 'termsUrl'>
>;

/** Statuses a checkout leaves on its own; one in any of them still needs its Stripe account. */
export const OPEN_CHECKOUT_STATUSES: CheckoutStatus[] = [
  CheckoutStatus.Created,
  CheckoutStatus.Authorized,
  CheckoutStatus.StartRequested,
  CheckoutStatus.Charging,
  CheckoutStatus.Capturing,
];

export interface CheckoutDto {
  id: number;
  publicId: string;
  tenantId: number;
  stripeAccountId: string;
  flow: CheckoutFlow;
  status: CheckoutStatus;
  connectorId: number | null;
  tariffId: number | null;
  tariffSnapshot: TariffData;
  transactionDatabaseId: number | null;
  currency: string;
  authorizedAmount: number | null;
  capturedAmount: number | null;
  paymentIntentId: string | null;
  remoteStartStatus: RemoteStartStatus | null;
  qrDisplayMessageId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CheckoutCreate {
  stripeAccountId: string;
  flow: CheckoutFlow;
  connectorId: number | null;
  tariffSnapshot: TariffData;
  transactionDatabaseId?: number | null;
}

export type CheckoutUpdate = Partial<
  Pick<
    CheckoutDto,
    | 'status'
    | 'transactionDatabaseId'
    | 'authorizedAmount'
    | 'capturedAmount'
    | 'paymentIntentId'
    | 'remoteStartStatus'
    | 'qrDisplayMessageId'
  >
>;
