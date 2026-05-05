// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNumber } from 'class-validator';

/** OCPP 2.0.1 / 2.1 CancelReservation request. */

export class CancelReservationRequest {
  @IsNumber()
  reservationId: number;
}
