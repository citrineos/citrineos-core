// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber } from 'class-validator';
import { AvailabilityType16 } from '@enums/availability-type-16.enum';

/**
 * OCPP 1.6 ChangeAvailability request. Top-level `connectorId` and `type`
 * — no nested EVSE envelope as in 2.0.1.
 */
export class ChangeAvailability16Request {
  @IsNumber()
  connectorId: number;

  @IsEnum(AvailabilityType16)
  type: AvailabilityType16;
}
