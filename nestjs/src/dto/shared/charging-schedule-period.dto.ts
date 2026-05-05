// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional } from 'class-validator';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class ChargingSchedulePeriodType {
  @IsNumber()
  startPeriod: number;

  @IsNumber()
  limit: number;

  @IsOptional()
  @IsNumber()
  numberPhases?: number;
}
