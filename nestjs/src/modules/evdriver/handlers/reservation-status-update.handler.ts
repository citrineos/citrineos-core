// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ReservationStatusUpdateRequest } from '@dto/evdriver/reservation-status-update.request';
import { ReservationUpdateStatusEnumType } from '@enums/reservation-update-status.enum';
import { ReservationRepository } from '@repositories/reservation.repository';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * ReservationStatusUpdate (OCPP 2.0.1 / 2.1).
 *
 * Charger reports a state change on an existing reservation: Removed,
 * Expired, Used. We update the local row (mapper marks `isActive=false`
 * for terminal statuses) and emit `reservation.status` so the operator
 * UI can refresh without polling.
 */
@OcppHandler(
  OCPP_CallAction.ReservationStatusUpdate,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  ReservationStatusUpdateRequest,
)
export class ReservationStatusUpdateHandler extends OcppRequestHandler<ReservationStatusUpdateRequest> {
  constructor(
    private readonly reservationRepo: ReservationRepository,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<ReservationStatusUpdateRequest>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { reservationId, reservationUpdateStatus } = msg.payload;

    this.logger.debug(
      `ReservationStatusUpdate from ${stationId}: reservationId=${reservationId}, status=${reservationUpdateStatus}`,
    );

    const isTerminal =
      reservationUpdateStatus === ReservationUpdateStatusEnumType.Removed ||
      reservationUpdateStatus === ReservationUpdateStatusEnumType.Expired;
    if (isTerminal) {
      // Legacy parity: only update if the reservation exists. An unknown
      // reservationId is logged but does not create a phantom inactive
      // row (legacy throws + logs; we degrade to a warning since the wire
      // response shape is `{}` either way).
      const existing = await this.reservationRepo.findByReservationId(
        tenantId,
        stationId,
        reservationId,
      );
      if (existing) {
        await this.reservationRepo.deactivateById(tenantId, stationId, reservationId);
      } else {
        this.logger.warn(
          `ReservationStatusUpdate from ${stationId}: reservationId=${reservationId} not found`,
        );
      }
    }

    this.webhooks.emit(WebhookEvent.ReservationStatus, { ...msg.payload }, { stationId, tenantId });

    return {};
  }
}
