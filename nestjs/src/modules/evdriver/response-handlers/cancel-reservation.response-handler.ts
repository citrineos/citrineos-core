// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ReservationRepository } from '@repositories/reservation.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

interface CancelReservationResponse {
  status: 'Accepted' | 'Rejected';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

type CancelReservationRequest = {
  reservationId: number;
} & Record<string, unknown>;

/**
 * Response handler for OCPP 2.0.1 / 2.1 `CancelReservation`.
 *
 * Mirrors legacy `_handleCancelReservation`. Looks up the originating
 * request from the cache (it carried `reservationId`) and updates the
 * matching Reservation row:
 *   - status=Accepted → row.isActive = false (cancellation took effect)
 *   - status=Rejected → row.isActive = true (charger refused; keep active)
 */
@OcppResponseHandler(OCPP_CallAction.CancelReservation, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class CancelReservationResponseHandler extends CsmsResponseHandler<CancelReservationResponse> {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<CancelReservationResponse>): Promise<void> {
    const { stationId, tenantId, correlationId } = msg.context;
    const { status } = msg.payload;

    const original = await this.remoteCalls.getOriginatingRequest<CancelReservationRequest>(
      correlationId,
      stationId,
    );
    if (!original) {
      this.logger.error(
        `CancelReservation ${stationId}/${correlationId}: originating request missing from cache; cannot resolve reservationId`,
      );
      return;
    }

    await this.reservations.upsert({
      stationId,
      tenantId,
      id: original.payload.reservationId,
      // Per legacy: isActive = (status === Rejected). Accepted means the
      // charger cleared the reservation, so we mark it inactive.
      isActive: status === 'Rejected',
    });
    this.logger.debug(
      `CancelReservation ${stationId}: reservationId=${original.payload.reservationId} → status=${status}`,
    );
  }
}
