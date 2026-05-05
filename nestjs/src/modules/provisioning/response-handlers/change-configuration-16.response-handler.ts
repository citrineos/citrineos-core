// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { ChangeConfigurationRepository } from '@repositories/change-configuration.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

interface ChangeConfigurationResponse {
  status: 'Accepted' | 'Rejected' | 'RebootRequired' | 'NotSupported';
}

interface ChangeConfigurationRequest extends Record<string, unknown> {
  key: string;
  value: string;
}

/**
 * Response handler for OCPP 1.6 `ChangeConfiguration`.
 *
 * Mirrors legacy `_handleOcpp16ChangeConfiguration`. On `Accepted` /
 * `RebootRequired` (the latter means accepted but charger needs reboot),
 * persist the new value into `ChangeConfigurations`. On `Rejected` /
 * `NotSupported`, log a warning and leave the prior value alone.
 */
@OcppResponseHandler(OCPP_CallAction.ChangeConfiguration, [OCPPVersion.OCPP1_6])
export class ChangeConfiguration16ResponseHandler extends CsmsResponseHandler<ChangeConfigurationResponse> {
  constructor(
    private readonly repo: ChangeConfigurationRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<ChangeConfigurationResponse>): Promise<void> {
    const { stationId, tenantId, correlationId } = msg.context;
    const { status } = msg.payload;

    if (status === 'Rejected' || status === 'NotSupported') {
      this.logger.warn(
        `ChangeConfiguration ${stationId}/${correlationId}: status=${status} — not persisting`,
      );
      return;
    }

    const original = await this.remoteCalls.getOriginatingRequest<ChangeConfigurationRequest>(
      correlationId,
      stationId,
    );
    if (!original) {
      this.logger.error(
        `ChangeConfiguration ${stationId}/${correlationId}: originating request missing from cache`,
      );
      return;
    }

    await this.repo.upsert({
      stationId,
      tenantId,
      key: original.payload.key,
      value: original.payload.value,
      readonly: false,
    });
    this.logger.debug(
      `ChangeConfiguration ${stationId}: ${original.payload.key}=${original.payload.value} (${status})`,
    );
  }
}
