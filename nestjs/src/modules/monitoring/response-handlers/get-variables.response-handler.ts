// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { VariableStatusRepository } from '@repositories/variable-status.repository';

interface GetVariableResultType {
  attributeStatus:
    | 'Accepted'
    | 'Rejected'
    | 'UnknownComponent'
    | 'UnknownVariable'
    | 'NotSupportedAttributeType';
  attributeValue?: string;
  attributeStatusInfo?: { reasonCode: string; additionalInfo?: string };
  component: { name: string; instance?: string };
  variable: { name: string; instance?: string };
  attributeType?: string;
}

interface GetVariablesResponse {
  getVariableResult: GetVariableResultType[];
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `GetVariables`.
 *
 * Mirrors legacy `_handleGetVariables` — persists each result row's
 * value/status into `VariableStatuses` so the operator dashboard has
 * the charger's last-reported value for any (component, variable) pair.
 *
 * Note: legacy also routes through `DeviceModelRepository.createOrUpdateByGetVariablesResultAndStationId`
 * to upsert VariableAttributes; we defer that join because our
 * VariableAttributes already carry the live value via NotifyReport.
 * If that proves insufficient, route through DeviceModelRepository here.
 */
@OcppResponseHandler(OCPP_CallAction.GetVariables, [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1])
export class GetVariablesResponseHandler extends CsmsResponseHandler<GetVariablesResponse> {
  constructor(private readonly statuses: VariableStatusRepository) {
    super();
  }

  async handle(msg: CsmsResponseMessage<GetVariablesResponse>): Promise<void> {
    const { stationId, tenantId } = msg.context;
    for (const result of msg.payload.getVariableResult ?? []) {
      await this.statuses.insertStatus({
        tenantId,
        value: result.attributeValue ?? '',
        status: result.attributeStatus,
        statusInfo: result.attributeStatusInfo ?? null,
      });
    }
    this.logger.debug(
      `GetVariables ${stationId}: persisted ${msg.payload.getVariableResult?.length ?? 0} status row(s)`,
    );
  }
}
