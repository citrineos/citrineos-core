// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * IMessageContext
 *
 * The context of any OCPP message.
 */
export interface IMessageContext {
  correlationId: string;
  tenantId: number;
  stationId: string;
  timestamp: string; // Iso Timestamp
}
