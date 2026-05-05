// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional } from 'class-validator';

/**
 * OCPP 2.0.1 / 2.1 ClearChargingProfile request.
 *
 * `chargingProfileCriteria` is opaque here — it carries vendor-specific
 * filters that the charger knows how to interpret. Validating its shape
 * server-side has no benefit since we forward it through verbatim.
 */
export class ClearChargingProfileRequest {
  @IsOptional()
  @IsNumber()
  chargingProfileId?: number;

  @IsOptional()
  chargingProfileCriteria?: Record<string, unknown>;
}
