// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { CallAction, IMessageConfirmation } from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import type { FastifyInstance } from 'fastify';
import type { IReportingModuleApi } from '../interface.js';
import { ReportingModule } from '../module.js';

/**
 * Server API for the Reporting module (OCPP 1.6).
 */
export class ReportingOcpp16Api
  extends AbstractModuleApi<ReportingModule>
  implements IReportingModuleApi
{
  /**
   * Constructs a new instance of the class.
   *
   * @param {ReportingModule} reportingModule - The Reporting module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(reportingModule: ReportingModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
    super(reportingModule, server, OCPPVersion.OCPP1_6, logger);
  }

  @AsMessageEndpoint(OCPP_CallAction.GetDiagnostics, OCPP1_6.GetDiagnosticsRequestSchema)
  getDiagnostics(
    identifier: string[],
    request: OCPP1_6.GetDiagnosticsRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.GetDiagnostics,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.reporting.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }
}
