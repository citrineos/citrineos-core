// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';
import { VariableMonitoringRepository } from '@repositories/variable-monitoring.repository';
import { VariableStatusRepository } from '@repositories/variable-status.repository';

interface SetMonitoringBaseResponse {
  status: string; // GenericDeviceModelStatusEnum: Accepted / Rejected / NotSupported / EmptyResultSet
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `SetMonitoringBase`.
 *
 * Mirrors legacy `_handleSetMonitoringBase`:
 *   - Rejected / NotSupported → log only (auto-log already debug-logs the
 *     frame; we surface the rejection at error level for ops dashboards).
 *   - Otherwise (Accepted / EmptyResultSet) → mark every existing
 *     `VariableMonitoring` on the station as superseded by writing a
 *     `Rejected` `VariableMonitoringStatuses` row tagged with
 *     `action=SetVariableMonitoring` (legacy convention; the original
 *     monitor configurations are no longer current after the base
 *     changed). Then dispatch a fresh `GetMonitoringReport` so the
 *     charger re-reports its monitor set under the new base.
 *
 * Schema dependency: `VariableMonitoringStatuses.action` column landed in
 * F2 Phase C Wave 1 — without it we'd be unable to record *which* request
 * caused the rejection.
 */
@OcppResponseHandler(OCPP_CallAction.SetMonitoringBase, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class SetMonitoringBaseResponseHandler extends CsmsResponseHandler<SetMonitoringBaseResponse> {
  constructor(
    private readonly monitorings: VariableMonitoringRepository,
    private readonly statuses: VariableStatusRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<SetMonitoringBaseResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    const status = msg.payload.status;
    const statusInfo = msg.payload.statusInfo;

    if (status === 'Rejected' || status === 'NotSupported') {
      this.logger.error(
        `SetMonitoringBase ${stationId} ${status}: ${statusInfo?.reasonCode ?? ''} ${statusInfo?.additionalInfo ?? ''}`,
      );
      return;
    }

    this.logger.debug(
      `SetMonitoringBase ${stationId}: ${status} — mass-rejecting existing monitorings + refreshing`,
    );

    const existing = await this.monitorings.findByStation(tenantId, stationId);
    await Promise.all(
      existing.map((row) =>
        this.statuses.insertMonitoringStatus({
          tenantId,
          status: 'Rejected',
          // Legacy convention: store the originating CSMS action in
          // `statusInfo.reasonCode` rather than a dedicated column.
          statusInfo: { reasonCode: OCPP_CallAction.SetVariableMonitoring },
          variableMonitoringId: row.databaseId,
        }),
      ),
    );

    // Mint a fresh requestId for the GetMonitoringReport. Legacy uses a
    // per-station sequence; UUID-derived integer is sufficient for our
    // current parity (the response handler validates by correlationId,
    // not requestId).
    const requestId = Math.floor(Math.random() * 0x7fffffff);
    await this.remoteCalls.sendNoWait(OCPP_CallAction.GetMonitoringReport, stationId, tenantId, {
      requestId,
    });
  }
}
