// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Shared with the driver frontend, which imports this file: keep it free of imports.

export const CheckoutFlow = {
  WebPortal: 'WebPortal',
  ScanAndCharge: 'ScanAndCharge',
} as const;
export type CheckoutFlow = (typeof CheckoutFlow)[keyof typeof CheckoutFlow];

export const CheckoutStatus = {
  Created: 'Created',
  Authorized: 'Authorized',
  StartRequested: 'StartRequested',
  Charging: 'Charging',
  Capturing: 'Capturing',
  Captured: 'Captured',
  Cancelled: 'Cancelled',
  Failed: 'Failed',
} as const;
export type CheckoutStatus = (typeof CheckoutStatus)[keyof typeof CheckoutStatus];

export const RemoteStartStatus = {
  Accepted: 'Accepted',
  Rejected: 'Rejected',
} as const;
export type RemoteStartStatus = (typeof RemoteStartStatus)[keyof typeof RemoteStartStatus];
