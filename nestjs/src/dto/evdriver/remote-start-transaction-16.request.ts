// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * OCPP 1.6 RemoteStartTransaction request. Different shape from 2.0.1's
 * `RequestStartTransactionRequest` — `idTag` is a flat string (no nested
 * `IdTokenType`) and `connectorId` is at the top level instead of inside
 * an `evse` envelope.
 */
export class RemoteStartTransaction16Request {
  @IsString()
  idTag: string;

  @IsOptional()
  @IsNumber()
  connectorId?: number;

  /**
   * Vendor-specific charging profile — accepted opaquely. The smart-charging
   * module owns full validation when the charger forwards it via
   * `SetChargingProfile`.
   */
  @IsOptional()
  chargingProfile?: Record<string, unknown>;
}
