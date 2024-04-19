// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  CallAction,
  ComponentVariableType,
  CustomerInformationRequest,
  CustomerInformationRequestSchema,
  GetBaseReportRequest,
  GetBaseReportRequestSchema,
  GetLogRequest,
  GetLogRequestSchema,
  GetMonitoringReportRequest,
  GetMonitoringReportRequestSchema,
  GetReportRequest,
  GetReportRequestSchema,
  IMessageConfirmation,
  MonitoringCriterionEnumType,
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
  implements IReportingModuleApi {
  private readonly _componentDeviceDataCtrlr = 'DeviceDataCtrlr';

  /**
   * Constructs a new instance of the class.
   *
   * @param {ReportingModule} ReportingModule - The Reporting module.
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

  @AsMessageEndpoint(CallAction.GetBaseReport, GetBaseReportRequestSchema)
  getBaseReport(
    identifier: string,
    tenantId: string,
    request: GetBaseReportRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    // TODO: Consider using requestId to send NotifyReportRequests to callbackUrl
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.GetBaseReport,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(CallAction.GetReport, GetReportRequestSchema)
  async getCustomReport(
    identifier: string,
    tenantId: string,
    request: GetReportRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    // if request size is bigger than BytesPerMessageGetReport,
    // return error
    const bytesPerMessageGetReport =
      await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        CallAction.GetReport,
        identifier,
      );
    const requestBytes = getSizeOfRequest(request);
    if (bytesPerMessageGetReport && requestBytes > bytesPerMessageGetReport) {
      const errorMsg = `The request is too big. The max size is ${bytesPerMessageGetReport} bytes.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    const componentVariables =
      request.componentVariable as ComponentVariableType[];
    if (componentVariables.length === 0) {
      return await this._module.sendCall(
        identifier,
        tenantId,
        CallAction.GetReport,
        request,
        callbackUrl,
      );
    }

    let itemsPerMessageGetReport =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        CallAction.GetReport,
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
          CallAction.GetReport,
          {
            componentVariable: batch,
            componentCriteria: request.componentCriteria,
            requestId: request.requestId,
          } as GetReportRequest,
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
    CallAction.GetMonitoringReport,
    GetMonitoringReportRequestSchema,
  )
  async getMonitoringReport(
    identifier: string,
    tenantId: string,
    request: GetMonitoringReportRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    const componentVariable =
      request.componentVariable as ComponentVariableType[];
    const monitoringCriteria =
      request.monitoringCriteria as MonitoringCriterionEnumType[];

    // monitoringCriteria is empty AND componentVariables is empty.
    // The set of all existing monitors is reported in one or more notifyMonitoringReportRequest messages.
    if (componentVariable.length === 0 && monitoringCriteria.length === 0) {
      return await this._module.sendCall(
        identifier,
        tenantId,
        CallAction.GetMonitoringReport,
        request,
        callbackUrl,
      );
    }

    let itemsPerMessageGetReport =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        CallAction.GetReport,
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
          CallAction.GetMonitoringReport,
          {
            componentVariable: batch,
            monitoringCriteria: monitoringCriteria,
            requestId: request.requestId,
          } as GetMonitoringReportRequest,
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

  @AsMessageEndpoint(CallAction.GetLog, GetLogRequestSchema)
  getLog(
    identifier: string,
    tenantId: string,
    request: GetLogRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.GetLog,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    CallAction.CustomerInformation,
    CustomerInformationRequestSchema,
  )
  customerInformation(
    identifier: string,
    tenantId: string,
    request: CustomerInformationRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      CallAction.CustomerInformation,
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
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix = this._module.config.modules.reporting.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
