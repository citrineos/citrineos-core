// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  CallAction,
  IMessageConfirmation,
  OCPP2_common_types,
  OCPP2_request_types,
} from '@citrineos/base';
import {
  AbstractModuleApi,
  AsMessageEndpoint,
  DataEnum,
  DEFAULT_TENANT_ID,
  getOcpp2Schema,
  MonitorEnum,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { getBatches, getSizeOfRequest, packageGroupCall } from '@util/index.js';
import type { FastifyInstance } from 'fastify';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IMonitoringModuleApi } from '../interface.js';
import { MonitoringModule } from '../module.js';

const DEFAULT_VERSION = OCPPVersion.OCPP2_0_1;

/**
 * Server API for the Monitoring module.
 */
export class MonitoringOcpp2Api
  extends AbstractModuleApi<MonitoringModule>
  implements IMonitoringModuleApi
{
  private readonly _componentMonitoringCtrlr = 'MonitoringCtrlr';
  private readonly _componentDeviceDataCtrlr = 'DeviceDataCtrlr';

  /**
   * Constructor for the class.
   *
   * @param {MonitoringModule} monitoringModule - The monitoring module.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor({
    monitoringModule,
    server,
    logger,
  }: {
    monitoringModule: MonitoringModule;
    server: FastifyInstance;
    logger?: Logger<ILogObj>;
  }) {
    // The OCPP version is no longer instance state — it is supplied per route /
    // per request via supportedVersions() and the handler `version` parameter.
    super(monitoringModule, server, logger);
  }

  /**
   * This API serves both OCPP 2.0.1 and 2.1 from a single instance; each
   * message endpoint is registered once per version with the version threaded
   * into schema selection, the route path, and the handler.
   */
  protected get supportedVersions(): OCPPVersion[] {
    return [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];
  }

  @AsMessageEndpoint(
    OCPP_CallAction.SetVariableMonitoring,
    (_instance: MonitoringOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'SetVariableMonitoringRequestSchema',
      ),
  )
  async setVariableMonitoring(
    identifier: string[],
    request: OCPP2_request_types.SetVariableMonitoringRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    // For each station, check request size, process monitoring data, and handle batch sending
    const confirmations: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifier) {
      try {
        // Request size check
        const maxBytes =
          await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentMonitoringCtrlr,
            OCPP_CallAction.SetVariableMonitoring,
            tenantId,
            ocppConnectionName,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${ocppConnectionName}.`,
          );
        }

        const setMonitoringData: OCPP2_common_types.SetMonitoringDataType[] =
          request.setMonitoringData;

        // For each monitoring data record, do any needed adjustments or DB upserts
        for (const data of setMonitoringData) {
          const [component, variable] =
            await this._module.deviceModelRepository.findComponentAndVariable(
              tenantId,
              data.component,
              data.variable,
            );

          // If Monitor is 'Delta' and variable is not numeric, set monitorValue to 1
          if (
            data.type === MonitorEnum.Delta &&
            variable?.variableCharacteristics?.dataType !== DataEnum.decimal &&
            variable?.variableCharacteristics?.dataType !== DataEnum.integer
          ) {
            data.value = 1;
            this._logger.debug('Updated SetMonitoringData value to 1', data);
          }

          if (component && variable) {
            await this._module.variableMonitoringRepository.createOrUpdateBySetMonitoringDataTypeAndStationId(
              tenantId,
              data,
              component.id,
              variable.id,
              ocppConnectionName,
            );
          }
        }

        // Determine how many items to send per message
        const itemsPerMessage =
          (await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentMonitoringCtrlr,
            OCPP_CallAction.SetVariableMonitoring,
            tenantId,
            ocppConnectionName,
          )) ?? setMonitoringData.length;

        // Split up the setMonitoringData into batches and call sendCall for each
        const result = await this.processBatches(
          ocppConnectionName,
          tenantId,
          version,
          OCPP_CallAction.SetVariableMonitoring,
          { setMonitoringData },
          'setMonitoringData',
          itemsPerMessage,
          callbackUrl,
        );
        confirmations.push(...result);
      } catch (error) {
        confirmations.push({
          success: false,
          payload: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return confirmations;
  }

  @AsMessageEndpoint(
    OCPP_CallAction.ClearVariableMonitoring,
    (_instance: MonitoringOcpp2Api, version) =>
      getOcpp2Schema(
        (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
        'ClearVariableMonitoringRequestSchema',
      ),
  )
  async clearVariableMonitoring(
    identifier: string[],
    request: OCPP2_request_types.ClearVariableMonitoringRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifier) {
      try {
        this._logger.debug(
          'ClearVariableMonitoring request received for station',
          ocppConnectionName,
          request,
        );

        // Request size check
        const maxBytes =
          await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentMonitoringCtrlr,
            OCPP_CallAction.ClearVariableMonitoring,
            tenantId,
            ocppConnectionName,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${ocppConnectionName}.`,
          );
        }

        const ids = request.id as number[];
        // Determine how many items to send per message
        const itemsPerMessage =
          (await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentMonitoringCtrlr,
            OCPP_CallAction.ClearVariableMonitoring,
            tenantId,
            ocppConnectionName,
          )) ?? ids.length;

        // Batches
        const result = await this.processBatches(
          ocppConnectionName,
          tenantId,
          version,
          OCPP_CallAction.ClearVariableMonitoring,
          { id: ids },
          'id',
          itemsPerMessage,
          callbackUrl,
        );
        confirmations.push(...result);
      } catch (error) {
        confirmations.push({
          success: false,
          payload: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return confirmations;
  }

  @AsMessageEndpoint(OCPP_CallAction.SetMonitoringLevel, (_instance: MonitoringOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'SetMonitoringLevelRequestSchema',
    ),
  )
  setMonitoringLevel(
    identifier: string[],
    request: OCPP2_request_types.SetMonitoringLevelRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.SetMonitoringLevel,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.SetMonitoringBase, (_instance: MonitoringOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'SetMonitoringBaseRequestSchema',
    ),
  )
  setMonitoringBase(
    identifier: string[],
    request: OCPP2_request_types.SetMonitoringBaseRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    return packageGroupCall(
      this._module,
      identifier,
      tenantId,
      version,
      OCPP_CallAction.SetMonitoringBase,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(OCPP_CallAction.SetVariables, (_instance: MonitoringOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'SetVariablesRequestSchema',
    ),
  )
  async setVariables(
    identifier: string[],
    request: OCPP2_request_types.SetVariablesRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifier) {
      try {
        const setVariableData: OCPP2_common_types.SetVariableDataType[] = request.setVariableData;

        // Store variable data in local DB so that the response can find them
        await this._module.deviceModelRepository.createOrUpdateBySetVariablesDataAndStationId(
          tenantId,
          setVariableData,
          ocppConnectionName,
          new Date().toISOString(),
        );

        // Determine how many items to send per message
        const itemsPerMessage =
          (await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentDeviceDataCtrlr,
            OCPP_CallAction.SetVariables,
            tenantId,
            ocppConnectionName,
          )) ?? setVariableData.length;

        // Batches
        const result = await this.processBatches(
          ocppConnectionName,
          tenantId,
          version,
          OCPP_CallAction.SetVariables,
          { setVariableData },
          'setVariableData',
          itemsPerMessage,
          callbackUrl,
        );
        confirmations.push(...result);
      } catch (error) {
        confirmations.push({
          success: false,
          payload: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return confirmations;
  }

  @AsMessageEndpoint(OCPP_CallAction.GetVariables, (_instance: MonitoringOcpp2Api, version) =>
    getOcpp2Schema(
      (version ?? DEFAULT_VERSION) as Exclude<OCPPVersion, OCPPVersion.OCPP1_6>,
      'GetVariablesRequestSchema',
    ),
  )
  async getVariables(
    identifier: string[],
    request: OCPP2_request_types.GetVariablesRequest,
    callbackUrl?: string,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion = DEFAULT_VERSION,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifier) {
      try {
        // Request size check
        const maxBytes =
          await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentDeviceDataCtrlr,
            OCPP_CallAction.GetVariables,
            tenantId,
            ocppConnectionName,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${ocppConnectionName}.`,
          );
        }

        const getVariableData: OCPP2_common_types.GetVariableDataType[] = request.getVariableData;

        // Determine how many items to send per message
        const itemsPerMessage =
          (await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentDeviceDataCtrlr,
            OCPP_CallAction.GetVariables,
            tenantId,
            ocppConnectionName,
          )) ?? getVariableData.length;

        // Batches
        const result = await this.processBatches(
          ocppConnectionName,
          tenantId,
          version,
          OCPP_CallAction.GetVariables,
          { getVariableData },
          'getVariableData',
          itemsPerMessage,
          callbackUrl,
        );
        confirmations.push(...result);
      } catch (error) {
        confirmations.push({
          success: false,
          payload: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return confirmations;
  }

  /**
   * Processes data in batches and sends them to the specified OCPP action.
   *
   * @param ocppConnectionName - The connection name of the charging station
   * @param {string} tenantId - The tenant identifier.
   * @param {OCPPVersion} version - The OCPP version to use.
   * @param {OCPP_CallAction} action - The OCPP 2.0.1 action to call.
   * @param {Record<string, any>} requestData - The request object containing the data array to batch.
   * @param {string} dataKey - The key in `requestData` that contains the array to batch.
   * @param {number} itemsPerMessage - The maximum number of items to include in a single batch message.
   * @param {string} [callbackUrl] - An optional callback URL.
   * @returns {Promise<IMessageConfirmation[]>} - Array of message confirmations for each batch.
   */
  private async processBatches(
    ocppConnectionName: string,
    tenantId: number,
    version: OCPPVersion,
    action: OCPP_CallAction,
    requestData: Record<string, any>,
    dataKey: string,
    itemsPerMessage: number,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];
    const allData = requestData[dataKey] as any[];

    for (const [batchIndex, batch] of getBatches(allData, itemsPerMessage)) {
      const batchRequest = { ...requestData, [dataKey]: batch };
      try {
        const confirmation = await this._module.sendCall(
          ocppConnectionName,
          tenantId,
          version,
          action,
          batchRequest,
          callbackUrl,
        );
        confirmations.push({
          success: confirmation.success,
          payload: `Batch [${batchIndex}]: ${confirmation.payload}`,
        });
      } catch (error) {
        confirmations.push({
          success: false,
          payload: `Batch [${batchIndex}]: ${
            error instanceof Error ? error.message : JSON.stringify(error)
          }`,
        });
      }
    }

    return confirmations;
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction}
   * and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction, version?: OCPPVersion | null): string {
    const endpointPrefix = this._module.config.modules.monitoring.endpointPrefix;
    return super._toMessagePath(input, version, endpointPrefix);
  }
}
