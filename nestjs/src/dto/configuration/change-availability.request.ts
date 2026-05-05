// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { OperationalStatusEnumType } from '@enums/operational-status.enum';
import { EVSEType } from '@dto/shared/evse.dto';

/**
 * OCPP 2.0.1 / 2.1 ChangeAvailability request — toggles a charger or
 * specific EVSE between `Operative` (driver-usable) and `Inoperative`
 * (taken out of service for maintenance / fault containment).
 *
 * @example
 * { "operationalStatus": "Inoperative", "evse": { "id": 1 } }
 */
export class ChangeAvailabilityRequest {
  /**
   * Target operational state.
   * @example 'Inoperative'
   */
  @IsEnum(OperationalStatusEnumType)
  operationalStatus: OperationalStatusEnumType;

  /**
   * Optional EVSE scope. Omit to apply to the whole station.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => EVSEType)
  evse?: EVSEType;
}
