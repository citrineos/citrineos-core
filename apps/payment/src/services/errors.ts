// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export const PaymentErrorCode = {
  /** The EVSE, connector or checkout does not exist, or is not this caller's to see. */
  NotFound: 'not_found',
  /** The request is malformed for this EVSE, e.g. a connector is needed and none was named. */
  Invalid: 'invalid',
  /** The station or connector cannot take a session right now. */
  Unavailable: 'unavailable',
  /** Nothing is set up to take payment here: no tariff, hold amount or Stripe account. */
  NotPayable: 'not_payable',
  /** The caller is not who it claims to be, or may not do this. */
  Forbidden: 'forbidden',
  /** The caller did not say who it is. */
  Unauthorized: 'unauthorized',
  /** The change would leave things inconsistent, e.g. an account still in use. */
  Conflict: 'conflict',
} as const;
export type PaymentErrorCode = (typeof PaymentErrorCode)[keyof typeof PaymentErrorCode];

export class PaymentError extends Error {
  constructor(
    readonly code: PaymentErrorCode,
    message: string,
  ) {
    super(message);
  }
}
