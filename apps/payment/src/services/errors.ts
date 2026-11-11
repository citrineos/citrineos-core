// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export type PaymentErrorCode =
  /** The EVSE, connector or checkout does not exist, or is not this caller's to see. */
  | 'not_found'
  /** The request is malformed for this EVSE, e.g. a connector is needed and none was named. */
  | 'invalid'
  /** The station or connector cannot take a session right now. */
  | 'unavailable'
  /** Nothing is set up to take payment here: no tariff, hold amount or Stripe account. */
  | 'not_payable'
  /** The caller is not who it claims to be, or may not do this. */
  | 'forbidden'
  /** The caller did not say who it is. */
  | 'unauthorized'
  /** The change would leave things inconsistent, e.g. an account still in use. */
  | 'conflict';

export class PaymentError extends Error {
  constructor(
    readonly code: PaymentErrorCode,
    message: string,
  ) {
    super(message);
  }
}
