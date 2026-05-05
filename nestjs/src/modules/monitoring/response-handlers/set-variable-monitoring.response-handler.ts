// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { VariableStatusRepository } from '@repositories/variable-status.repository';

interface SetMonitoringResultType {
  status:
    | 'Accepted'
    | 'Rejected'
    | 'UnknownComponent'
    | 'UnknownVariable'
    | 'UnsupportedMonitorType'
    | 'OutOfRange'
    | 'Duplicate';
  type: string;
  severity: number;
  component: { name: string; instance?: string };
  variable: { name: string; instance?: string };
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

interface SetVariableMonitoringResponse {
  setMonitoringResult: SetMonitoringResultType[];
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `SetVariableMonitoring`.
 *
 * Mirrors legacy `_handleSetVariableMonitoring` — for each result,
 * persists a `VariableMonitoringStatuses` row capturing the
 * charger-reported result of the monitor-set attempt.
 */
@OcppResponseHandler(OCPP_CallAction.SetVariableMonitoring, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class SetVariableMonitoringResponseHandler extends CsmsResponseHandler<SetVariableMonitoringResponse> {
  constructor(private readonly statuses: VariableStatusRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<SetVariableMonitoringResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    for (const result of msg.payload.setMonitoringResult ?? []) {
      await this.statuses.insertMonitoringStatus({
        tenantId,
        status: result.status,
        statusInfo: result.statusInfo ?? null,
      });
    }
    this.logger.debug(
      `SetVariableMonitoring ${stationId}: persisted ${msg.payload.setMonitoringResult?.length ?? 0} status row(s)`,
    );
  }
}
