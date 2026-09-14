// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * MessageConfirmation
 *
 * The interface for all message confirmations.
 *
 */
export interface IMessageConfirmation {
  success: boolean;
  payload?: string | object;
}
