// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import { IMonitoringModuleApi } from './interface';
import { MonitoringModule } from './module';
import {
  Component,
  CreateOrUpdateVariableAttributeQuerySchema,
  CreateOrUpdateVariableAttributeQuerystring,
  sequelize,
  Variable,
  VariableAttributeQuerySchema,
  VariableAttributeQuerystring,
} from '@citrineos/data';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  AsMessageEndpoint,
  CallAction,
  ClearVariableMonitoringRequest,
  ClearVariableMonitoringRequestSchema,
  DataEnumType,
  GetVariableDataType,
  GetVariablesRequest,
  GetVariablesRequestSchema,
  HttpMethod,
  IMessageConfirmation,
  MonitorEnumType,
  MutabilityEnumType,
  Namespace,
  ReportDataType,
  ReportDataTypeSchema,
  SetMonitoringBaseRequest,
  SetMonitoringBaseRequestSchema,
  SetMonitoringDataType,
  SetMonitoringLevelRequest,
  SetMonitoringLevelRequestSchema,
  SetVariableDataType,
  SetVariableMonitoringRequest,
  SetVariableMonitoringRequestSchema,
  SetVariablesRequest,
  SetVariablesRequestSchema,
  SetVariableStatusEnumType,
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { getBatches, getSizeOfRequest } from '@citrineos/util';

/**
 * Server API for the Monitoring module.
 */
export class MonitoringModuleApi
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
  constructor(
    monitoringModule: MonitoringModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(monitoringModule, server, logger);
  }

  /**
   * Message Endpoints
   */

  @AsMessageEndpoint(
    CallAction.SetVariableMonitoring,
    SetVariableMonitoringRequestSchema,
  )
  async setVariableMonitoring(
    identifier: string[],
    tenantId: string,
    request: SetVariableMonitoringRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const id of identifier) {
      try {
        const maxBytes =
          await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentMonitoringCtrlr,
            CallAction.SetVariableMonitoring,
            id,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${id}.`,
          );
        }

        const setMonitoringData =
          request.setMonitoringData as SetMonitoringDataType[];
        for (const data of setMonitoringData) {
          const [component, variable] =
            await this._module.deviceModelRepository.findComponentAndVariable(
              data.component,
              data.variable,
            );

          // When the CSMS sends a SetVariableMonitoringRequest with type Delta for a Variable that is NOT of a numeric
          // type, It is RECOMMENDED to use a monitorValue of 1.
          if (
            data.type === MonitorEnumType.Delta &&
            variable?.variableCharacteristics?.dataType !==
              DataEnumType.decimal &&
            variable?.variableCharacteristics?.dataType !== DataEnumType.integer
          ) {
            data.value = 1;
            this._logger.debug('Updated SetMonitoringData value to 1', data);
          }
          // component and variable are required for a variableMonitoring
          if (component && variable) {
            await this._module.variableMonitoringRepository.createOrUpdateBySetMonitoringDataTypeAndStationId(
              data,
              component.id,
              variable.id,
              id,
            );
          }
        }

        const itemsPerMessage =
          (await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentMonitoringCtrlr,
            CallAction.SetVariableMonitoring,
            id,
          )) ?? setMonitoringData.length;

        // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
        const result = await this.processBatches(
          id,
          tenantId,
          CallAction.SetVariableMonitoring,
          setMonitoringData as SetMonitoringDataType[],
          itemsPerMessage,
          callbackUrl,
        );
        confirmations.push(...result);
      } catch (error) {
        confirmations.push({ success: false, payload: error as string });
      }
    }

    // Caller should use callbackUrl to ensure request reached station, otherwise receipt is not guaranteed
    return confirmations;
  }

  @AsMessageEndpoint(
    CallAction.ClearVariableMonitoring,
    ClearVariableMonitoringRequestSchema,
  )
  async clearVariableMonitoring(
    identifier: string[],
    tenantId: string,
    request: ClearVariableMonitoringRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const id of identifier) {
      try {
        // if request size is bigger than bytesPerMessageClearVariableMonitoring,
        // return error
        const maxBytes =
          await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentMonitoringCtrlr,
            CallAction.ClearVariableMonitoring,
            id,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${id}.`,
          );
        }

        const ids = request.id as number[];
        const itemsPerMessage =
          (await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentMonitoringCtrlr,
            CallAction.ClearVariableMonitoring,
            id,
          )) ?? ids.length;

        // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
        const result = await this.processBatches(
          id,
          tenantId,
          CallAction.ClearVariableMonitoring,
          ids as number[],
          itemsPerMessage,
          callbackUrl,
        );
        confirmations.push(...result);
      } catch (error) {
        confirmations.push({ success: false, payload: error as string });
      }
    }

    return confirmations;
  }

  @AsMessageEndpoint(
    CallAction.SetMonitoringLevel,
    SetMonitoringLevelRequestSchema,
  )
  setMonitoringLevel(
    identifier: string[],
    tenantId: string,
    request: SetMonitoringLevelRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        CallAction.SetMonitoringLevel,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(
    CallAction.SetMonitoringBase,
    SetMonitoringBaseRequestSchema,
  )
  setMonitoringBase(
    identifier: string[],
    tenantId: string,
    request: SetMonitoringBaseRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const results: Promise<IMessageConfirmation>[] = identifier.map((id) =>
      this._module.sendCall(
        id,
        tenantId,
        CallAction.SetMonitoringBase,
        request,
        callbackUrl,
      ),
    );
    return Promise.all(results);
  }

  @AsMessageEndpoint(CallAction.SetVariables, SetVariablesRequestSchema)
  async setVariables(
    identifier: string[],
    tenantId: string,
    request: SetVariablesRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const id of identifier) {
      try {
        const setVariableData =
          request.setVariableData as SetVariableDataType[];

        // Awaiting save action so that SetVariablesResponse does not trigger a race condition since an error is thrown
        // from SetVariablesResponse handler if variable does not exist when it attempts to save the Response's status
        await this._module.deviceModelRepository.createOrUpdateBySetVariablesDataAndStationId(
          setVariableData,
          id,
          new Date().toISOString(), // Will be set again when SetVariablesResponse is received
        );

        const itemsPerMessage =
          (await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentDeviceDataCtrlr,
            CallAction.SetVariables,
            id,
          )) ?? setVariableData.length;

        // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
        const result = await this.processBatches(
          id,
          tenantId,
          CallAction.SetVariables,
          setVariableData as SetVariableDataType[],
          itemsPerMessage,
          callbackUrl,
        );
        confirmations.push(...result);
      } catch (error) {
        confirmations.push({ success: false, payload: error as string });
      }
    }

    return confirmations;
  }

  @AsMessageEndpoint(CallAction.GetVariables, GetVariablesRequestSchema)
  async getVariables(
    identifier: string[],
    tenantId: string,
    request: GetVariablesRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];

    for (const id of identifier) {
      try {
        // if request size is bigger than BytesPerMessageGetVariables,
        // return error
        const maxBytes =
          await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentDeviceDataCtrlr,
            CallAction.GetVariables,
            id,
          );
        const requestBytes = getSizeOfRequest(request);

        if (maxBytes && requestBytes > maxBytes) {
          throw new Error(
            `The request size exceeds the limit of ${maxBytes} bytes for identifier ${id}.`,
          );
        }

        const getVariableData =
          request.getVariableData as GetVariableDataType[];
        const itemsPerMessage =
          (await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
            this._componentDeviceDataCtrlr,
            CallAction.GetVariables,
            id,
          )) ?? getVariableData.length;

        // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
        const result = await this.processBatches(
          id,
          tenantId,
          CallAction.GetVariables,
          getVariableData as GetVariableDataType[],
          itemsPerMessage,
          callbackUrl,
        );
        confirmations.push(...result);
      } catch (error) {
        confirmations.push({ success: false, payload: error as string });
      }
    }

    return confirmations;
  }

  /**
   * Data Endpoints
   */

  @AsDataEndpoint(
    Namespace.VariableAttributeType,
    HttpMethod.Put,
    CreateOrUpdateVariableAttributeQuerySchema,
    ReportDataTypeSchema,
  )
  async putDeviceModelVariables(
    request: FastifyRequest<{
      Body: ReportDataType;
      Querystring: CreateOrUpdateVariableAttributeQuerystring;
    }>,
  ): Promise<sequelize.VariableAttribute[]> {
    // To keep consistency with VariableAttributeType in OCPP 2.0.1:
    // (1) persistent and constant: Default when omitted is false.
    // if they are not present, we set them to false by adding default value in ReportDataTypeSchema
    // (2) mutability: Default is ReadWrite when omitted.
    // if it is not present, we set it to ReadWrite
    for (const variableAttr of request.body.variableAttribute) {
      if (!variableAttr.mutability) {
        variableAttr.mutability = MutabilityEnumType.ReadWrite;
      }
    }
    const timestamp = new Date().toISOString();
    return this._module.deviceModelRepository
      .createOrUpdateDeviceModelByStationId(
        request.body,
        request.query.stationId,
        timestamp,
      )
      .then(async (variableAttributes) => {
        if (request.query.setOnCharger) {
          // value set offline, for example: manually via charger ui, or via api other than ocpp
          for (let variableAttribute of variableAttributes) {
            variableAttribute = await variableAttribute.reload({
              include: [Variable, Component],
            });
            this._module.deviceModelRepository.updateResultByStationId(
              {
                attributeType: variableAttribute.type,
                attributeStatus: SetVariableStatusEnumType.Accepted,
                attributeStatusInfo: { reasonCode: 'SetOnCharger' },
                component: variableAttribute.component,
                variable: variableAttribute.variable,
              },
              request.query.stationId,
              timestamp,
            );
          }
        }
        return variableAttributes;
      });
  }

  @AsDataEndpoint(
    Namespace.VariableAttributeType,
    HttpMethod.Get,
    VariableAttributeQuerySchema,
  )
  getDeviceModelVariables(
    request: FastifyRequest<{ Querystring: VariableAttributeQuerystring }>,
  ): Promise<sequelize.VariableAttribute[] | undefined> {
    return this._module.deviceModelRepository.readAllByQuerystring(
      request.query,
    );
  }

  @AsDataEndpoint(
    Namespace.VariableAttributeType,
    HttpMethod.Delete,
    VariableAttributeQuerySchema,
  )
  deleteDeviceModelVariables(
    request: FastifyRequest<{ Querystring: VariableAttributeQuerystring }>,
  ): Promise<string> {
    return this._module.deviceModelRepository
      .deleteAllByQuerystring(request.query)
      .then(
        (deletedCount) =>
          deletedCount.toString() +
          ' rows successfully deleted from ' +
          Namespace.VariableAttributeType,
      );
  }

  /**
   * Processes all data in batches and sends them to the specified endpoint action.
   *
   * This method takes a large dataset, splits it into smaller batches based on the specified `itemsPerMessage` limit,
   * and processes each batch sequentially. Each batch is sent to the designated endpoint using the given action.
   * Any errors encountered during the process are captured and included in the confirmation payload.
   *
   * @param {string} identifier - The identifier of the charging station (or system) where the request will be sent.
   * @param {string} tenantId - The tenant identifier associated with the request.
   * @param {CallAction} action - The action to perform on the endpoint (e.g., `SetVariables`, `GetVariables`).
   * @param {any[]} data - The array of data to be processed and sent in batches.
   * @param {number} itemsPerMessage - The maximum number of items to include in a single batch message.
   * @param {string} [callbackUrl] - An optional URL where the station should send a callback confirmation for the request.
   *
   * @returns {Promise<IMessageConfirmation[]>} - A promise resolving to an array of message confirmations for each batch.
   *
   * @throws {Error} - Throws an error if the underlying `sendCall` method fails unexpectedly.
   */
  private async processBatches(
    identifier: string,
    tenantId: string,
    action: CallAction,
    data: any[],
    itemsPerMessage: number,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation[]> {
    const confirmations: IMessageConfirmation[] = [];
    let batchIndex = 0;

    for (const batch of getBatches(data, itemsPerMessage)) {
      try {
        const batchResult = await this._module.sendCall(
          identifier,
          tenantId,
          action,
          { [action.toLowerCase()]: batch },
          callbackUrl,
        );
        confirmations.push({
          success: batchResult.success,
          payload: `Batch [${batchIndex}]: ${batchResult.payload}`,
        });
      } catch (error) {
        confirmations.push({
          success: false,
          payload: `Batch [${batchIndex}]: ${error as string}`,
        });
      }
      batchIndex++;
    }

    return confirmations;
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix =
      this._module.config.modules.monitoring.endpointPrefix;
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix =
      this._module.config.modules.monitoring.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
