// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ChargingLimitSourceEnumType } from '@enums/charging-limit-source.enum';

/**
 * OCPP 2.0.1 / 2.1 ClearedChargingLimit request — inverse of
 * NotifyChargingLimit. Charger reports a previously-applied charging
 * limit was cleared and normal operation has resumed.
 */
export class ClearedChargingLimitRequest {
  @IsEnum(ChargingLimitSourceEnumType)
  chargingLimitSource: ChargingLimitSourceEnumType;

  @IsOptional()
  @IsNumber()
  evseId?: number;
}
