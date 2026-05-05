// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ChargingProfileRepository } from '@repositories/charging-profile.repository';

interface ClearChargingProfileResponse {
  status: 'Accepted' | 'Unknown';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 / 1.6 `ClearChargingProfile`.
 *
 * Mirrors legacy `_handleClearChargingProfile`. On `Accepted`, clear
 * ALL active charging profiles for the station (`Unknown` means the
 * charger had nothing matching the filter — leave the row state alone).
 */
@OcppResponseHandler(OCPP_CallAction.ClearChargingProfile, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
  OCPPVersion.OCPP1_6,
])
export class ClearChargingProfileResponseHandler extends CsmsResponseHandler<ClearChargingProfileResponse> {
  constructor(private readonly chargingProfiles: ChargingProfileRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<ClearChargingProfileResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const { status } = msg.payload;
    if (status !== 'Accepted') {
      this.logger.debug(`ClearChargingProfile ${stationId}: status=${status} — no-op`);
      return;
    }
    await this.chargingProfiles.deactivateByStation(tenantId, stationId);
    this.logger.debug(`ClearChargingProfile ${stationId}: all profiles deactivated`);
  }
}
