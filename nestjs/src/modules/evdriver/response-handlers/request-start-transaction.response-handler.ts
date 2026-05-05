// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ChargingProfileRepository } from '@repositories/charging-profile.repository';

interface RequestStartTransactionResponse {
  status: 'Accepted' | 'Rejected';
  transactionId?: string;
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `RequestStartTransaction`.
 *
 * Mirrors legacy `_handleRequestStartTransaction`. On `Accepted`, the
 * charger commits to starting a transaction; we deactivate any
 * pre-existing TxProfile-purpose / CSO-source charging profiles for
 * the station so the upcoming TransactionEvent.Started + the next
 * GetChargingProfiles round-trip can re-seed the active profile set
 * cleanly. The `enableGetChargingProfilesOnStartTransaction` config
 * flag controls whether to fire that follow-up — handled by the
 * subsequent TransactionEvent flow rather than re-dispatched here.
 */
@OcppResponseHandler(OCPP_CallAction.RequestStartTransaction, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class RequestStartTransactionResponseHandler extends CsmsResponseHandler<RequestStartTransactionResponse> {
  constructor(private readonly chargingProfiles: ChargingProfileRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<RequestStartTransactionResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const { status, transactionId } = msg.payload;

    if (status !== 'Accepted') {
      this.logger.debug(
        `RequestStartTransaction ${stationId}: status=${status} — no profile cleanup`,
      );
      return;
    }

    // Deactivate stale CSO-source TxProfile rows; the next
    // ReportChargingProfiles will reseed them with the live values.
    await this.chargingProfiles.deactivateByStation(tenantId, stationId);
    this.logger.debug(
      `RequestStartTransaction accepted ${stationId}: cleared CSO TxProfile rows; transactionId=${transactionId ?? '(none)'}`,
    );
  }
}
