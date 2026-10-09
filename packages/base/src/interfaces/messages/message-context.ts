// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * IMessageContext
 *
 * The context of any OCPP message.
 */
export interface IMessageContext {
  correlationId: string;
  tenantId: number;
  ocppConnectionName: string;
  timestamp: string; // Iso Timestamp
  /**
   * Overrides the configured age, from `timestamp`, after which the CSMS drops this Call.
   * 0 never drops it.
   */
  staleAfterSeconds?: number;
}
