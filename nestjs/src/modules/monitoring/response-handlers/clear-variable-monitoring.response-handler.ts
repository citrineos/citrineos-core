// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { VariableStatusRepository } from '@repositories/variable-status.repository';

interface ClearMonitoringResultType {
  status: 'Accepted' | 'Rejected' | 'NotFound';
  id: number;
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

interface ClearVariableMonitoringResponse {
  clearMonitoringResult: ClearMonitoringResultType[];
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `ClearVariableMonitoring`.
 *
 * Mirrors legacy `_handleClearVariableMonitoring` — persists per-result
 * status snapshots. Legacy also drops VariableMonitoring rows; we
 * defer that until VariableMonitoring entity drops are wired through
 * a service (matches the conservative path).
 */
@OcppResponseHandler(OCPP_CallAction.ClearVariableMonitoring, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class ClearVariableMonitoringResponseHandler extends CsmsResponseHandler<ClearVariableMonitoringResponse> {
  constructor(private readonly statuses: VariableStatusRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<ClearVariableMonitoringResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    for (const result of msg.payload.clearMonitoringResult ?? []) {
      await this.statuses.insertMonitoringStatus({
        tenantId,
        status: result.status,
        statusInfo: result.statusInfo ?? null,
      });
    }
    this.logger.debug(
      `ClearVariableMonitoring ${stationId}: persisted ${msg.payload.clearMonitoringResult?.length ?? 0} status row(s)`,
    );
  }
}
