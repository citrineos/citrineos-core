// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChargingLimitSourceEnumType } from '@enums/charging-limit-source.enum';

/**
 * `chargingProfile` filter on a GetChargingProfiles CALL. Per OCPP 2.0.1
 * Part 2 K09.FR.03 the CSMS MUST send EITHER `chargingProfileId` OR a
 * filter combination of (`chargingProfilePurpose`, `stackLevel`,
 * `chargingLimitSource`) — not both. We let the charger enforce that
 * mutual-exclusion rather than duplicating it client-side.
 */
class ChargingProfileCriterionType {
  @IsOptional()
  @IsInt({ each: true })
  chargingProfileId?: number[];

  @IsOptional()
  @IsString()
  chargingProfilePurpose?: string;

  @IsOptional()
  @IsInt()
  stackLevel?: number;

  @IsOptional()
  @IsEnum(ChargingLimitSourceEnumType, { each: true })
  chargingLimitSource?: ChargingLimitSourceEnumType[];
}

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class GetChargingProfilesRequest {
  @IsInt()
  requestId: number;

  @IsOptional()
  @IsInt()
  evseId?: number;

  @ValidateNested()
  @Type(() => ChargingProfileCriterionType)
  chargingProfile: ChargingProfileCriterionType;
}
