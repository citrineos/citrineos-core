// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { VariableStatusRepository } from '@repositories/variable-status.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

interface SetVariableResultType extends Record<string, unknown> {
  attributeStatus: 'Accepted' | 'Rejected' | 'NotSupportedAttributeType' | 'RebootRequired';
  attributeStatusInfo?: { reasonCode: string; additionalInfo?: string };
  component: { name: string; instance?: string };
  variable: { name: string; instance?: string };
  attributeType?: string;
}

interface SetVariablesResponse {
  setVariableResult: SetVariableResultType[];
}

interface SetVariableData extends Record<string, unknown> {
  attributeValue: string;
  component: { name: string; instance?: string };
  variable: { name: string; instance?: string };
  attributeType?: string;
}

interface SetVariablesRequest extends Record<string, unknown> {
  setVariableData: SetVariableData[];
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `SetVariables`.
 *
 * Mirrors legacy `_handleSetVariables`. For each result item, persist
 * a `VariableStatuses` row carrying the value the CSMS attempted to
 * write + the charger-reported `attributeStatus`. The `value` is
 * pulled from the originating request payload (matched by
 * component/variable name).
 */
@OcppResponseHandler(OCPP_CallAction.SetVariables, [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1])
export class SetVariablesResponseHandler extends CsmsResponseHandler<SetVariablesResponse> {
  constructor(
    private readonly statuses: VariableStatusRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<SetVariablesResponse>): Promise<void> {
    const { stationId, tenantId, correlationId } = msg.context;
    const original = await this.remoteCalls.getOriginatingRequest<SetVariablesRequest>(
      correlationId,
      stationId,
    );
    const requestMap = new Map<string, SetVariableData>();
    for (const item of original?.payload.setVariableData ?? []) {
      requestMap.set(this.key(item.component, item.variable), item);
    }

    for (const result of msg.payload.setVariableResult ?? []) {
      const original = requestMap.get(this.key(result.component, result.variable));
      await this.statuses.insertStatus({
        tenantId,
        value: original?.attributeValue ?? '',
        status: result.attributeStatus,
        statusInfo: result.attributeStatusInfo ?? null,
      });
    }
    this.logger.debug(
      `SetVariables ${stationId}: persisted ${msg.payload.setVariableResult?.length ?? 0} status row(s)`,
    );
  }

  private key(
    component: { name: string; instance?: string },
    variable: { name: string; instance?: string },
  ): string {
    return `${component.name}::${component.instance ?? ''}::${variable.name}::${variable.instance ?? ''}`;
  }
}
