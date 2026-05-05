// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { HeartbeatRequest } from '@dto/provisioning/heartbeat.request';
import { ChargingStationRepository } from '@repositories/charging-station.repository';

/**
 * Heartbeat (OCPP 1.6 / 2.0.1 / 2.1).
 *
 * Returns the CSMS clock per the spec, and bumps
 * `ChargingStation.latestOcppMessageTimestamp` + `isOnline` so REST
 * consumers see liveness without scanning the audit trail. Mirrors the
 * legacy `_handleHeartbeat` write block.
 */
@OcppHandler(
  OCPP_CallAction.Heartbeat,
  [OCPPVersion.OCPP1_6, OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  HeartbeatRequest,
)
export class HeartbeatHandler extends OcppRequestHandler<HeartbeatRequest> {
  constructor(private readonly stationRepo: ChargingStationRepository) {
    super();
  }

  async handle(msg: OcppMessage<HeartbeatRequest>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    this.logger.debug(`Heartbeat from ${stationId}`);

    const now = new Date();
    void this.stationRepo
      .touch(tenantId, stationId, now)
      .catch((err) =>
        this.logger.warn(`Failed to bump lastSeen for ${stationId}: ${(err as Error).message}`),
      );

    return { currentTime: now.toISOString() };
  }
}
