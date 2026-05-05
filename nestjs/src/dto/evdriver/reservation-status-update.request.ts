// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsNumber } from 'class-validator';
import { ReservationUpdateStatusEnumType } from '@enums/reservation-update-status.enum';

/**
 * OCPP wire request DTO. class-validator decorations on each field drive
 * the global ValidationPipe so payloads are rejected with a
 * PropertyConstraintViolation before any handler runs.
 */
export class ReservationStatusUpdateRequest {
  @IsNumber()
  reservationId: number;

  @IsEnum(ReservationUpdateStatusEnumType)
  reservationUpdateStatus: ReservationUpdateStatusEnumType;
}
