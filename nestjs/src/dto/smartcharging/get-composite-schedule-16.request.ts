// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ChargingRateUnitEnumType } from '@enums/charging-rate-unit.enum';

/**
 * OCPP 1.6 GetCompositeSchedule request. Connector-keyed (1.6 has no EVSE
 * concept), otherwise mirrors 2.0.1.
 */
export class GetCompositeSchedule16Request {
  @IsNumber()
  connectorId: number;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsEnum(ChargingRateUnitEnumType)
  chargingRateUnit?: ChargingRateUnitEnumType;
}
