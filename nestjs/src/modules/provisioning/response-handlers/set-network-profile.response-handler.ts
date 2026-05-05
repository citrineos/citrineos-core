// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { NetworkProfileRepository } from '@repositories/network-profile.repository';

interface SetNetworkProfileResponse {
  status: 'Accepted' | 'Rejected' | 'Failed';
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `SetNetworkProfile`.
 *
 * Mirrors legacy `_handleSetNetworkProfile`. On `Accepted`, look up the
 * `SetNetworkProfile` dispatch row by correlationId and promote it to
 * the live `(station, configurationSlot)` row in
 * `ChargingStationNetworkProfiles`.
 */
@OcppResponseHandler(OCPP_CallAction.SetNetworkProfile, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class SetNetworkProfileResponseHandler extends CsmsResponseHandler<SetNetworkProfileResponse> {
  constructor(private readonly repo: NetworkProfileRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<SetNetworkProfileResponse>): Promise<void> {
    const { stationId, tenantId, correlationId } = msg.context;
    const { status } = msg.payload;
    if (status !== 'Accepted') {
      this.logger.warn(
        `SetNetworkProfile ${stationId}/${correlationId}: status=${status} — not promoting to active config`,
      );
      return;
    }
    const dispatch = await this.repo.findDispatchByCorrelationId(tenantId, correlationId);
    if (!dispatch) {
      this.logger.error(
        `SetNetworkProfile ${stationId}/${correlationId}: dispatch row missing — cannot promote`,
      );
      return;
    }
    await this.repo.upsertActive({
      stationId,
      tenantId,
      configurationSlot: dispatch.configurationSlot,
      setNetworkProfileId: dispatch.id,
      websocketServerConfigId: dispatch.websocketServerConfigId ?? null,
    });
    this.logger.debug(
      `SetNetworkProfile ${stationId}: slot=${dispatch.configurationSlot} promoted to active`,
    );
  }
}
