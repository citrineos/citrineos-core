// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ChargingProfileRepository } from '@repositories/charging-profile.repository';

interface SetChargingProfileResponse {
  status: 'Accepted' | 'Rejected';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 / 1.6 `SetChargingProfile`.
 *
 * Mirrors legacy `_handleSetChargingProfile`. On `Accepted`, retire any
 * pre-existing CSO-source profiles for the station so the next
 * `ReportChargingProfiles` round-trip can re-seed the active profile
 * set. On `Rejected`, log and leave existing profiles intact.
 *
 * Note: legacy follows up with an immediate `GetChargingProfiles` CALL
 * to pull the latest server-visible state. We intentionally don't fire
 * that here — `ReportChargingProfiles` flows through naturally on the
 * next charger-initiated event, and the immediate follow-up adds wire
 * traffic the operator may not want.
 */
@OcppResponseHandler(OCPP_CallAction.SetChargingProfile, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
  OCPPVersion.OCPP1_6,
])
export class SetChargingProfileResponseHandler extends CsmsResponseHandler<SetChargingProfileResponse> {
  constructor(private readonly chargingProfiles: ChargingProfileRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<SetChargingProfileResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const { status } = msg.payload;
    if (status !== 'Accepted') {
      this.logger.warn(
        `SetChargingProfile ${stationId}: status=${status} — leaving profiles intact`,
      );
      return;
    }
    await this.chargingProfiles.deactivateByStation(tenantId, stationId);
    this.logger.debug(`SetChargingProfile ${stationId}: deactivated CSO profiles for re-seed`);
  }
}
