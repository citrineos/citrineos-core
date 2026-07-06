// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DEFAULT_TENANT_ID,
  getOcpp2Schema,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP_CallAction,
  OCPPVersion,
  type CallAction,
  type IMessageConfirmation,
  type MonitoringCriterionEnumType,
} from '@citrineos/base';
import { getBatches, getSizeOfRequest, packageGroupCall } from '@util/index.js';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IReportingModuleApi } from '../interface.js';
import { ReportingModule } from '../module.js';

const DEFAULT_VERSION = OCPPVersion.OCPP2_0_1;

/**
 * Server API for the Reporting module.
 */
export class ReportingOcpp2Api
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
  constructor({
    reportingModule,
    server,
    logger,
  }: {
    reportingModule: ReportingModule;
    server: FastifyInstance;
    logger?: Logger<ILogObj>;
  }) {
    super(reportingModule, server, logger);
  }

  protected get supportedVersions(): OCPPVersion[] {
    return [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];
  }

  @AsMessageEndpoint(OCPP_CallAction.GetBaseReport, (_instance: ReportingOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetBaseReportRequestSchema',
    ),
  )
  getBaseReport(
    identifier: string[],
    request: OCPP2_request_types.GetBaseReportRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.GetBaseReport,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.GetReport, (_instance: ReportingOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetReportRequestSchema',
    ),
  )
  async getCustomReport(
    identifier: string,
    request: OCPP2_request_types.GetReportRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation> {
    // if request size is bigger than BytesPerMessageGetReport, return error
    const bytesPerMessageGetReport =
      await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP_CallAction.GetReport,
        tenantId,
        identifier,
      );
    const requestBytes = getSizeOfRequest(request);
    if (bytesPerMessageGetReport && requestBytes > bytesPerMessageGetReport) {
      const errorMsg = `The request is too big. The max size is ${bytesPerMessageGetReport} bytes.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    const componentVariables =
      request.componentVariable as OCPP2_common_types.ComponentVariableType[];

    if (componentVariables.length === 0) {
      // Send everything in one call
      return await this._module.sendCall(
        identifier,
        tenantId,
        version,
        OCPP_CallAction.GetReport,
        request,
        callbackUrl,
      );
    }

    // Batching logic
    let itemsPerMessageGetReport =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP_CallAction.GetReport,
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
          version,
          OCPP_CallAction.GetReport,
          { ...request, componentVariable: batch } as OCPP2_request_types.GetReportRequest,
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

  @AsMessageEndpoint(OCPP_CallAction.GetMonitoringReport, (_instance: ReportingOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetMonitoringReportRequestSchema',
    ),
  )
  async getMonitoringReport(
    identifier: string,
    request: OCPP2_request_types.GetMonitoringReportRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation> {
    // If monitoringCriteria & componentVariable are both empty, just call once
    const componentVariable =
      request.componentVariable as OCPP2_common_types.ComponentVariableType[];
    const monitoringCriteria = request.monitoringCriteria as MonitoringCriterionEnumType[];

    if (componentVariable.length === 0 && monitoringCriteria.length === 0) {
      return await this._module.sendCall(
        identifier,
        tenantId,
        version,
        OCPP_CallAction.GetMonitoringReport,
        request,
        callbackUrl,
      );
    }

    // Otherwise, do batching if needed
    let itemsPerMessageGetReport =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP_CallAction.GetReport,
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
          version,
          OCPP_CallAction.GetMonitoringReport,
          {
            ...request,
            componentVariable: batch,
          } as OCPP2_request_types.GetMonitoringReportRequest,
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

  @AsMessageEndpoint(OCPP_CallAction.GetLog, (_instance: ReportingOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetLogRequestSchema',
    ),
  )
  getLog(
    identifier: string[],
    request: OCPP2_request_types.GetLogRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.GetLog,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.CustomerInformation, (_instance: ReportingOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'CustomerInformationRequestSchema',
    ),
  )
  customerInformation(
    identifier: string[],
    request: OCPP2_request_types.CustomerInformationRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.CustomerInformation,
      request,
      callbackUrl,
    );
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction, version?: OCPPVersion | null): string {
    const endpointPrefix = this._module.config.modules.reporting.endpointPrefix;
    return super._toMessagePath(input, version, endpointPrefix);
  }
}
