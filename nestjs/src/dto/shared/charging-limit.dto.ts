// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { ChargingLimitSourceEnumType } from '@enums/charging-limit-source.enum';

/**
 * OCPP 2.0.1 / 2.1 ChargingLimitType — describes the source of an
 * externally-applied charging limit. Used by NotifyChargingLimit /
 * ClearedChargingLimit.
 */
export class ChargingLimitType {
  @IsEnum(ChargingLimitSourceEnumType)
  chargingLimitSource: ChargingLimitSourceEnumType;

  @IsOptional()
  @IsBoolean()
  isGridCritical?: boolean;
}
