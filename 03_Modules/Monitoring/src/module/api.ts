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
  HttpMethod,
  IMessageConfirmation,
  OCPP2_0_1_Namespace,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  ReportDataTypeSchema,
  OCPP1_6_Namespace,
  Namespace,
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
    OCPP2_0_1_CallAction.SetVariableMonitoring,
    OCPP2_0_1.SetVariableMonitoringRequestSchema,
  )
  async setVariableMonitoring(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.SetVariableMonitoringRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    // if request size is bigger than BytesPerMessageSetVariableMonitoring,
    // return error
    const bytesPerMessageSetVariableMonitoring =
      await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentMonitoringCtrlr,
        OCPP2_0_1_CallAction.SetVariableMonitoring,
        identifier,
      );
    const requestBytes = getSizeOfRequest(request);
    if (
      bytesPerMessageSetVariableMonitoring &&
      requestBytes > bytesPerMessageSetVariableMonitoring
    ) {
      const errorMsg = `The request is too big. The max size is ${bytesPerMessageSetVariableMonitoring} bytes.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    const setMonitoringData =
      request.setMonitoringData as OCPP2_0_1.SetMonitoringDataType[];
    for (let i = 0; i < setMonitoringData.length; i++) {
      const setMonitoringDataType: OCPP2_0_1.SetMonitoringDataType =
        setMonitoringData[i];
      this._logger.debug('Current SetMonitoringData', setMonitoringDataType);
      const [component, variable] =
        await this._module.deviceModelRepository.findComponentAndVariable(
          setMonitoringDataType.component,
          setMonitoringDataType.variable,
        );
      this._logger.debug('Found component and variable:', component, variable);
      // When the CSMS sends a SetVariableMonitoringRequest with type Delta for a Variable that is NOT of a numeric
      // type, It is RECOMMENDED to use a monitorValue of 1.
      if (
        setMonitoringDataType.type === OCPP2_0_1.MonitorEnumType.Delta &&
        variable &&
        variable.variableCharacteristics &&
        variable.variableCharacteristics.dataType !==
          OCPP2_0_1.DataEnumType.decimal &&
        variable.variableCharacteristics.dataType !==
          OCPP2_0_1.DataEnumType.integer
      ) {
        setMonitoringDataType.value = 1;
        this._logger.debug(
          'Updated SetMonitoringData value to 1',
          setMonitoringData[i],
        );
      }
      // component and variable are required for a variableMonitoring
      if (component && variable) {
        await this._module.variableMonitoringRepository.createOrUpdateBySetMonitoringDataTypeAndStationId(
          setMonitoringDataType,
          component.id,
          variable.id,
          identifier,
        );
      }
    }

    let itemsPerMessageSetVariableMonitoring =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentMonitoringCtrlr,
        OCPP2_0_1_CallAction.SetVariableMonitoring,
        identifier,
      );
    // If ItemsPerMessageSetVariableMonitoring not set, send all variables at once
    itemsPerMessageSetVariableMonitoring =
      itemsPerMessageSetVariableMonitoring === null
        ? setMonitoringData.length
        : itemsPerMessageSetVariableMonitoring;

    const confirmations = [];
    // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
    for (const [index, batch] of getBatches(
      setMonitoringData,
      itemsPerMessageSetVariableMonitoring,
    ).entries()) {
      try {
        const batchResult = await this._module.sendCall(
          identifier,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.SetVariableMonitoring,
          {
            setMonitoringData: batch,
          } as OCPP2_0_1.SetVariableMonitoringRequest,
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

    // Caller should use callbackUrl to ensure request reached station, otherwise receipt is not guaranteed
    return { success: true, payload: confirmations };
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.ClearVariableMonitoring,
    OCPP2_0_1.ClearVariableMonitoringRequestSchema,
  )
  async clearVariableMonitoring(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.ClearVariableMonitoringRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    this._logger.debug(
      'ClearVariableMonitoring request received',
      identifier,
      request,
    );
    // if request size is bigger than bytesPerMessageClearVariableMonitoring,
    // return error
    const bytesPerMessageClearVariableMonitoring =
      await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentMonitoringCtrlr,
        OCPP2_0_1_CallAction.ClearVariableMonitoring,
        identifier,
      );
    const requestBytes = getSizeOfRequest(request);
    if (
      bytesPerMessageClearVariableMonitoring &&
      requestBytes > bytesPerMessageClearVariableMonitoring
    ) {
      const errorMsg = `The request is too big. The max size is ${bytesPerMessageClearVariableMonitoring} bytes.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    const ids = request.id as number[];
    let itemsPerMessageClearVariableMonitoring =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentMonitoringCtrlr,
        OCPP2_0_1_CallAction.ClearVariableMonitoring,
        identifier,
      );
    // If itemsPerMessageClearVariableMonitoring not set, send all variables at once
    itemsPerMessageClearVariableMonitoring =
      itemsPerMessageClearVariableMonitoring === null
        ? ids.length
        : itemsPerMessageClearVariableMonitoring;

    const confirmations = [];
    // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
    for (const [index, batch] of getBatches(
      ids,
      itemsPerMessageClearVariableMonitoring,
    ).entries()) {
      try {
        const batchResult = await this._module.sendCall(
          identifier,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.ClearVariableMonitoring,
          { id: batch } as OCPP2_0_1.ClearVariableMonitoringRequest,
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

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.SetMonitoringLevel,
    OCPP2_0_1.SetMonitoringLevelRequestSchema,
  )
  setMonitoringLevel(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.SetMonitoringLevelRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.SetMonitoringLevel,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.SetMonitoringBase,
    OCPP2_0_1.SetMonitoringBaseRequestSchema,
  )
  setMonitoringBase(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.SetMonitoringBaseRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    return this._module.sendCall(
      identifier,
      tenantId,
      OCPPVersion.OCPP2_0_1,
      OCPP2_0_1_CallAction.SetMonitoringBase,
      request,
      callbackUrl,
    );
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.SetVariables,
    OCPP2_0_1.SetVariablesRequestSchema,
  )
  async setVariables(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.SetVariablesRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    let setVariableData =
      request.setVariableData as OCPP2_0_1.SetVariableDataType[];

    // Awaiting save action so that SetVariablesResponse does not trigger a race condition since an error is thrown
    // from SetVariablesResponse handler if variable does not exist when it attempts to save the Response's status
    await this._module.deviceModelRepository.createOrUpdateBySetVariablesDataAndStationId(
      setVariableData,
      identifier,
      new Date().toISOString(), // Will be set again when SetVariablesResponse is received
    );

    let itemsPerMessageSetVariables =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.SetVariables,
        identifier,
      );

    // If ItemsPerMessageSetVariables not set, send all variables at once
    itemsPerMessageSetVariables =
      itemsPerMessageSetVariables === null
        ? setVariableData.length
        : itemsPerMessageSetVariables;

    const confirmations = [];
    let lastVariableIndex = 0;
    // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
    while (setVariableData.length > 0) {
      const batch = setVariableData.slice(0, itemsPerMessageSetVariables);
      try {
        const batchResult = await this._module.sendCall(
          identifier,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.SetVariables,
          { setVariableData: batch } as OCPP2_0_1.SetVariablesRequest,
          callbackUrl,
        );
        confirmations.push({
          success: batchResult.success,
          batch: `[${lastVariableIndex}:${lastVariableIndex + batch.length}]`,
          message: `${batchResult.payload}`,
        });
      } catch (error) {
        confirmations.push({
          success: false,
          variableName: `[${lastVariableIndex}:${lastVariableIndex + batch.length}]`,
          message: `${error}`,
        });
      }
      lastVariableIndex += batch.length;
      setVariableData = setVariableData.slice(itemsPerMessageSetVariables);
    }
    // Caller should use callbackUrl to ensure request reached station, otherwise receipt is not guaranteed
    return { success: true, payload: confirmations };
  }

  @AsMessageEndpoint(
    OCPP2_0_1_CallAction.GetVariables,
    OCPP2_0_1.GetVariablesRequestSchema,
  )
  async getVariables(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.GetVariablesRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation> {
    // if request size is bigger than BytesPerMessageGetVariables,
    // return error
    const bytesPerMessageGetVariables =
      await this._module._deviceModelService.getBytesPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.GetVariables,
        identifier,
      );
    const requestBytes = getSizeOfRequest(request);
    if (
      bytesPerMessageGetVariables &&
      requestBytes > bytesPerMessageGetVariables
    ) {
      const errorMsg = `The request is too big. The max size is ${bytesPerMessageGetVariables} bytes.`;
      this._logger.error(errorMsg);
      return { success: false, payload: errorMsg };
    }

    let getVariableData =
      request.getVariableData as OCPP2_0_1.GetVariableDataType[];
    let itemsPerMessageGetVariables =
      await this._module._deviceModelService.getItemsPerMessageByComponentAndVariableInstanceAndStationId(
        this._componentDeviceDataCtrlr,
        OCPP2_0_1_CallAction.GetVariables,
        identifier,
      );

    // If ItemsPerMessageGetVariables not set, send all variables at once
    itemsPerMessageGetVariables =
      itemsPerMessageGetVariables === null
        ? getVariableData.length
        : itemsPerMessageGetVariables;

    const confirmations = [];
    let lastVariableIndex = 0;
    // TODO: Below feature doesn't work as intended due to central system behavior (cs has race condition and either sends illegal back-to-back calls or misses calls)
    while (getVariableData.length > 0) {
      const batch = getVariableData.slice(0, itemsPerMessageGetVariables);
      try {
        const batchResult = await this._module.sendCall(
          identifier,
          tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.GetVariables,
          { getVariableData: batch } as OCPP2_0_1.GetVariablesRequest,
          callbackUrl,
        );
        confirmations.push({
          success: batchResult.success,
          batch: `[${lastVariableIndex}:${lastVariableIndex + batch.length}]`,
          message: `${batchResult.payload}`,
        });
      } catch (error) {
        confirmations.push({
          success: false,
          variableName: `[${lastVariableIndex}:${lastVariableIndex + batch.length}]`,
          message: `${error}`,
        });
      }
      lastVariableIndex += batch.length;
      getVariableData = getVariableData.slice(itemsPerMessageGetVariables);
    }
    // Caller should use callbackUrl to ensure request reached station, otherwise receipt is not guaranteed
    return { success: true, payload: confirmations };
  }

  /**
   * Data Endpoints
   */

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.VariableAttributeType,
    HttpMethod.Put,
    CreateOrUpdateVariableAttributeQuerySchema,
    ReportDataTypeSchema,
  )
  async putDeviceModelVariables(
    request: FastifyRequest<{
      Body: OCPP2_0_1.ReportDataType;
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
        variableAttr.mutability = OCPP2_0_1.MutabilityEnumType.ReadWrite;
      }
    }
    const timestamp = new Date().toISOString();
    const variableAttributes =
      await this._module.deviceModelRepository.createOrUpdateDeviceModelByStationId(
        request.body,
        request.query.stationId,
        timestamp,
      );
    if (request.query.setOnCharger) {
      // value set offline, for example: manually via charger ui, or via api other than ocpp
      for (let variableAttribute of variableAttributes) {
        variableAttribute = await variableAttribute.reload({
          include: [Variable, Component],
        });
        await this._module.deviceModelRepository.updateResultByStationId(
          {
            attributeType: variableAttribute.type,
            attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
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
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.VariableAttributeType,
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
    OCPP2_0_1_Namespace.VariableAttributeType,
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
          OCPP2_0_1_Namespace.VariableAttributeType,
      );
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
   * Overrides superclass method to generate the URL path based on the input ({@link OCPP2_0_1_Namespace},
   * {@link OCPP1_6_Namespace} or {@link Namespace}) and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link OCPP2_0_1_Namespace}, {@link OCPP1_6_Namespace} or {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(
    input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace,
  ): string {
    const endpointPrefix =
      this._module.config.modules.monitoring.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
