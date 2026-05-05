// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Reservation } from '@entities/reservation.entity';

/**
 * Read-side projection for REST endpoints. The terminal-status detection
 * for `ReservationStatusUpdate` lives in the handler now (calls
 * `ReservationRepository.deactivateById` directly so an unknown
 * reservationId no longer creates a phantom inactive row).
 */
export interface ReserveNowResponseDto {
  reservationId: number;
  stationId: string;
  evseId?: number | null;
  idToken?: string | null;
  expiryDateTime?: string | null;
}

/**
 * Static mapper translating between OCPP wire DTOs and the corresponding
 * database row shape. Handlers and services compose mappers rather than
 * building entity rows inline so the wire ↔ entity contract stays in one place.
 */
export class ReservationMapper {
  static toReserveNowResponse(reservation: Reservation): ReserveNowResponseDto {
    // `idToken` is stored as a jsonb `IdTokenType` object on the row;
    // pull out the string for the REST projection.
    const tok = reservation.idToken as { idToken?: string } | null | undefined;
    return {
      reservationId: reservation.id ?? 0,
      stationId: reservation.stationId ?? '',
      evseId: reservation.evseId ?? null,
      idToken: tok?.idToken ?? null,
      expiryDateTime: reservation.expiryDateTime?.toISOString() ?? null,
    };
  }
}
