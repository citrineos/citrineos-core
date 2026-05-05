// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber, IsOptional } from 'class-validator';

/**
 * Shared OCPP DTO referenced by multiple request/response shapes. Field-
 * level class-validator decorations propagate validation guarantees into
 * the parent DTO.
 */
export class DCChargingParametersType {
  @IsNumber()
  evMaxCurrent: number;

  @IsNumber()
  evMaxVoltage: number;

  @IsOptional()
  @IsNumber()
  energyAmount?: number;

  @IsOptional()
  @IsNumber()
  evMaxPower?: number;

  @IsOptional()
  @IsNumber()
  stateOfCharge?: number;

  @IsOptional()
  @IsNumber()
  evEnergyCapacity?: number;

  @IsOptional()
  @IsNumber()
  fullSoC?: number;

  @IsOptional()
  @IsNumber()
  bulkSoC?: number;
}
