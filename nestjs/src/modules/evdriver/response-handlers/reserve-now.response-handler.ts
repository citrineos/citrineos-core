// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ReservationRepository } from '@repositories/reservation.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

interface ReserveNowResponse {
  status: 'Accepted' | 'Faulted' | 'Occupied' | 'Rejected' | 'Unavailable';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

interface ReserveNowRequest {
  id: number;
  expiryDateTime: string;
  evseId?: number;
  connectorType?: string;
  idToken: { idToken: string; type: string };
  groupIdToken?: { idToken: string; type: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `ReserveNow`.
 *
 * When a charger ACCEPTs a CSMS-initiated ReserveNow, persist the resulting
 * Reservation row. On non-Accepted responses, log and skip — the CSMS
 * REST request that initiated this round-trip has already received the
 * status via `RemoteCallsService.sendAndAwait`.
 *
 * The originating request payload (which carries `id`, `expiryDateTime`,
 * `evseId`, `idToken`, etc.) is fetched from the cache via
 * `RemoteCallsService.getOriginatingRequest` since the CALL_RESULT itself
 * only carries `{status, statusInfo}`.
 */
@OcppResponseHandler(OCPP_CallAction.ReserveNow, [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1])
export class ReserveNowResponseHandler extends CsmsResponseHandler<ReserveNowResponse> {
  constructor(
    private readonly reservations: ReservationRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<ReserveNowResponse>): Promise<void> {
    const { stationId, tenantId, correlationId } = msg.context;
    const { status } = msg.payload;

    if (status !== 'Accepted') {
      this.logger.debug(
        `ReserveNow ${stationId}/${correlationId}: status=${status} — skipping persistence`,
      );
      return;
    }

    const original = await this.remoteCalls.getOriginatingRequest<
      ReserveNowRequest & Record<string, unknown>
    >(correlationId, stationId);
    if (!original) {
      this.logger.warn(
        `ReserveNow ${stationId}/${correlationId}: originating request missing from cache`,
      );
      return;
    }

    const req = original.payload;
    await this.reservations.upsert({
      stationId,
      tenantId,
      id: req.id,
      expiryDateTime: req.expiryDateTime ? new Date(req.expiryDateTime) : null,
      connectorType: req.connectorType ?? null,
      evseId: req.evseId ?? null,
      // Legacy stores the full IdToken object as jsonb (denormalized
      // rather than FK to Authorizations).
      idToken: req.idToken ?? null,
      groupIdToken: req.groupIdToken ?? null,
      isActive: true,
    });
    this.logger.debug(`ReserveNow accepted for ${stationId}: reservationId=${req.id}`);
  }
}
