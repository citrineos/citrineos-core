// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  IMessageConfirmation,
  OCPP2_0_1_Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  OCPP1_6_Namespace,
  Namespace,
} from '@citrineos/base';
import { FastifyInstance } from 'fastify';
import { IReportingModuleApi } from './interface';
import { ReportingModule } from './module';
import { getBatches, getSizeOfRequest } from '@citrineos/util';

/**
 * Server API for the Reporting module.
 */
export class ReportingModuleApi
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
  constructor(
    reportingModule: ReportingModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(reportingModule, server, logger);
  }

  /**
   * Message Endpoint Methods
   */

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetBaseReport,
    OCPP2_0_1.GetBaseReportRequestSchema,
  )
  getBaseReport(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.GetBaseReportRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    // TODO: Consider using requestId to send NotifyReportRequests to callbackUrl
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.GetBaseReport,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetReport,
    OCPP2_0_1.GetReportRequestSchema,
  )
  async getCustomReport(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.GetReportRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    // if request size is bigger than BytesPerMessageGetReport,
    // return error
    const bytesPerMessageGetReport =
      await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.GetReport,
        identifier,
      );
    const requestBytes = getSizeOfRequest(request);
    if (bytesPerMessageGetReport && requestBytes > bytesPerMessageGetReport) {
      const errorMsg = `The request is too big. The max size is ${bytesPerMessageGetReport} bytes.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    const componentVariables =
      request.componentVariable as OCPP2_0_1.ComponentVariableType[];
    if (componentVariables.length === 0) {
      return await this._module.sendCall(
        identifier,
        tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetReport,
        request,
        callbackUrl,
      );
    }

    let itemsPerMessageGetReport =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.GetReport,
        identifier,
      );
    // If ItemsPerMessageGetReport not set, send all variables at once
    itemsPerMessageGetReport =
      itemsPerMessageGetReport === null
        ? componentVariables.length
        : itemsPerMessageGetReport;

    const confirmations = [];
    // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
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

    // TODO: Consider using requestId to send NotifyMonitoringReportRequests to callbackUrl
    return { success: true, payload: confirmations };
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetMonitoringReport,
    OCPP2_0_1.GetMonitoringReportRequestSchema,
  )
  async getMonitoringReport(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.GetMonitoringReportRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const componentVariable =
      request.componentVariable as OCPP2_0_1.ComponentVariableType[];
    const monitoringCriteria =
      request.monitoringCriteria as OCPP2_0_1.MonitoringCriterionEnumType[];

    // monitoringCriteria is empty AND componentVariables is empty.
    // The set of all existing monitors is reported in one or more notifyMonitoringReportRequest messages.
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

    let itemsPerMessageGetReport =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.GetReport,
        identifier,
      );
    // If ItemsPerMessageGetReport not set, send all variables at once
    itemsPerMessageGetReport =
      itemsPerMessageGetReport === null
        ? componentVariable.length
        : itemsPerMessageGetReport;

    const confirmations = [];
    // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
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
            monitoringCriteria: monitoringCriteria,
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

    // TODO: Consider using requestId to send NotifyMonitoringReportRequests to callbackUrl
    return { success: true, payload: confirmations };
  }

  @AsMessageEndpoint(OCPP2_0_1_CallAction.GetLog, OCPP2_0_1.GetLogRequestSchema)
  getLog(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.GetLogRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.GetLog,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.CustomerInformation,
    OCPP2_0_1.CustomerInformationRequestSchema,
  )
  customerInformation(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.CustomerInformationRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.CustomerInformation,
      request,
      callbackUrl,
    );
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = this._module.config.modules.reporting.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input ({@link OCPP2_0_1_Namespace},
   * {@link OCPP1_6_Namespace} or {@link Namespace}) and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link OCPP2_0_1_Namespace}, {@link OCPP1_6_Namespace} or {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(
    input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace,
  ): string {
    const endpointPrefix = this._module.config.modules.reporting.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
