// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber } from 'class-validator';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class ACChargingParametersType {
  @IsNumber()
  energyAmount: number;

  @IsNumber()
  evMinCurrent: number;

  @IsNumber()
  evMaxCurrent: number;

  @IsNumber()
  evMaxVoltage: number;
}
