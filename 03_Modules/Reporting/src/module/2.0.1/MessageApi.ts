// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  DEFAULT_TENANT_ID,
  IMessageConfirmation,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { IReportingModuleApi } from '../interface';
import { ReportingModule } from '../module';
import { getBatches, getSizeOfRequest } from '@citrineos/util';

/**
 * Server API for the Reporting module.
 */
export class ReportingOcpp201Api
  extends AbstractModuleApi<ReportingModule>
  implements IReportingModuleApi
{
  private readonly _componentDeviceDataCtrlr = 'DeviceDataCtrlr';

  /**
   * Constructs a new instance of the class.
   *
   * @param {ReportingModule} reportingModule - The Reporting module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(reportingModule: ReportingModule, server: FastifyInstance, logger?: Logger<ILogObj>) {
    super(reportingModule, server, OCPPVersion.OCPP2_0_1, logger);
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.GetBaseReport, OCPP2_0_1.GetBaseReportRequestSchema)
  getBaseReport(
    identifier: string[],
    request: OCPP2_0_1.GetBaseReportRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    // For each station, send the GetBaseReport call
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetBaseReport,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.GetReport, OCPP2_0_1.GetReportRequestSchema)
  async getCustomReport(
    identifier: string,
    request: OCPP2_0_1.GetReportRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation> {
    // if request size is bigger than BytesPerMessageGetReport, return error
    const bytesPerMessageGetReport =
      await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.GetReport,
        tenantId,
        identifier,
      );
    const requestBytes = getSizeOfRequest(request);
    if (bytesPerMessageGetReport && requestBytes > bytesPerMessageGetReport) {
      const errorMsg = `The request is too big. The max size is ${bytesPerMessageGetReport} bytes.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    const componentVariables = request.componentVariable as OCPP2_0_1.ComponentVariableType[];
    if (componentVariables.length === 0) {
      // Send everything in one call
      return await this._module.sendCall(
        identifier,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetReport,
        request,
        callbackUrl,
      );
    }

    // Batching logic
    let itemsPerMessageGetReport =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.GetReport,
        tenantId,
        identifier,
      );
    itemsPerMessageGetReport =
      itemsPerMessageGetReport === null ? componentVariables.length : itemsPerMessageGetReport;

    const confirmations = [];
    // Using multiple calls if needed
    for (const [index, batch] of getBatches(
      componentVariables,
      itemsPerMessageGetReport,
    ).entries()) {
      try {
        const batchResult = await this._module.sendCall(
          identifier,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.GetReport,
          {
            componentVariable: batch,
            componentCriteria: request.componentCriteria,
            requestId: request.requestId,
          } as OCPP2_0_1.GetReportRequest,
          callbackUrl,
        );
        confirmations.push({
          success: batchResult.success,
          batch: `[${index}:${index + batch.length}]`,
          message: `${batchResult.payload}`,
        });
      } catch (error) {
        confirmations.push({
          success: false,
          batch: `[${index}:${index + batch.length}]`,
          message: `${error}`,
        });
      }
    }

    // Returns a single IMessageConfirmation containing details of each batched call
    return { success: true, payload: confirmations };
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetMonitoringReport,
    OCPP2_0_1.GetMonitoringReportRequestSchema,
  )
  async getMonitoringReport(
    identifier: string,
    request: OCPP2_0_1.GetMonitoringReportRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation> {
    // If monitoringCriteria & componentVariable are both empty, just call once
    const componentVariable = request.componentVariable as OCPP2_0_1.ComponentVariableType[];
    const monitoringCriteria =
      request.monitoringCriteria as OCPP2_0_1.MonitoringCriterionEnumType[];

    if (componentVariable.length === 0 && monitoringCriteria.length === 0) {
      return await this._module.sendCall(
        identifier,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetMonitoringReport,
        request,
        callbackUrl,
      );
    }

    // Otherwise, do batching if needed
    let itemsPerMessageGetReport =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.GetReport,
        tenantId,
        identifier,
      );
    itemsPerMessageGetReport =
      itemsPerMessageGetReport === null ? componentVariable.length : itemsPerMessageGetReport;

    const confirmations = [];
    for (const [index, batch] of getBatches(
      componentVariable,
      itemsPerMessageGetReport,
    ).entries()) {
      try {
        const batchResult = await this._module.sendCall(
          identifier,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.GetMonitoringReport,
          {
            componentVariable: batch,
            monitoringCriteria,
            requestId: request.requestId,
          } as OCPP2_0_1.GetMonitoringReportRequest,
          callbackUrl,
        );
        confirmations.push({
          success: batchResult.success,
          batch: `[${index}:${index + batch.length}]`,
          message: `${batchResult.payload}`,
        });
      } catch (error) {
        confirmations.push({
          success: false,
          batch: `[${index}:${index + batch.length}]`,
          message: `${error}`,
        });
      }
    }

    return { success: true, payload: confirmations };
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.GetLog, OCPP2_0_1.GetLogRequestSchema)
  getLog(
    identifier: string[],
    request: OCPP2_0_1.GetLogRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetLog,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.CustomerInformation,
    OCPP2_0_1.CustomerInformationRequestSchema,
  )
  customerInformation(
    identifier: string[],
    request: OCPP2_0_1.CustomerInformationRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.CustomerInformation,
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
