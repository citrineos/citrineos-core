// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractModule,
  AsHandler,
  AttributeEnum,
  type AttributeEnumType,
  type CallAction,
  ChargingStationSequenceTypeEnum,
  EventGroup,
  GenericDeviceModelStatusEnum,
  type GenericDeviceModelStatusEnumType,
  GenericStatusEnum,
  type GenericStatusEnumType,
  type HandlerProperties,
  type IMessage,
  type OcppModuleDependencies,
  MessageOrigin,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  SetVariableStatusEnum,
} from '@citrineos/base';
import {
  Component,
  type IDeviceModelRepository,
  type IOCPPMessageRepository,
  type IVariableMonitoringRepository,
  Variable,
  type VariableAttribute,
} from '@dal/index.js';
import { IdGenerator } from '@util/index.js';

import type { MonitoringService } from './MonitoringService.js';
import type { DeviceModelService } from './services.js';

type SetVariableDataMap = { [key: string]: OCPP2_common_types.SetVariableDataType };

export interface MonitoringModuleDependencies extends OcppModuleDependencies {
  deviceModelRepository: IDeviceModelRepository;
  variableMonitoringRepository: IVariableMonitoringRepository;
  ocppMessageRepository: IOCPPMessageRepository;
  idGenerator: IdGenerator;
  monitoringDeviceModelService: DeviceModelService;
  monitoringService: MonitoringService;
}

/**
 * Component that handles monitoring related messages.
 */
export class MonitoringModule extends AbstractModule {
  public _deviceModelService: DeviceModelService;
  protected _monitoringService: MonitoringService;

  _requests: CallAction[] = [];

  _responses: CallAction[] = [];

  protected _deviceModelRepository: IDeviceModelRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;
  protected _ocppMessageRepository: IOCPPMessageRepository;
  private _idGenerator: IdGenerator;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    deviceModelRepository,
    variableMonitoringRepository,
    ocppMessageRepository,
    idGenerator,
    monitoringDeviceModelService,
    monitoringService,
  }: MonitoringModuleDependencies) {
    super(config, cache, handler, sender, EventGroup.Monitoring, logger, ocppValidator);

    this._requests = config.modules.monitoring.requests;
    this._responses = config.modules.monitoring.responses;

    this._deviceModelRepository = deviceModelRepository;
    this._variableMonitoringRepository = variableMonitoringRepository;
    this._ocppMessageRepository = ocppMessageRepository;

    this._deviceModelService = monitoringDeviceModelService;
    this._monitoringService = monitoringService;

    this._idGenerator = idGenerator;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }
  get variableMonitoringRepository(): IVariableMonitoringRepository {
    return this._variableMonitoringRepository;
  }

  /**
   * Handle requests
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyEvent)
  protected async _handleNotifyEvent(
    message: IMessage<OCPP2_request_types.NotifyEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEvent received:', message, props);
    const ocppConnectionName = message.context.ocppConnectionName;

    const events = message.payload.eventData as OCPP2_common_types.EventDataType[];
    for (const event of events) {
      const [component, variable] =
        await this._deviceModelRepository.findOrCreateEvseAndComponentAndVariable(
          message.context.tenantId,
          event.component,
          event.variable,
        );
      await this._variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId(
        message.context.tenantId,
        event,
        component?.id,
        variable?.id,
        ocppConnectionName,
      );
      const reportDataType: OCPP2_common_types.ReportDataType = {
        component,
        variable,
        variableAttribute: [
          {
            value: event.actualValue,
          },
        ],
      };
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
        message.context.tenantId,
        reportDataType,
        ocppConnectionName,
        message.payload.generatedAt,
      );
    }

    // Create response
    const response: OCPP2_response_types.NotifyEventResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifyEvent response sent:', messageConfirmation);
  }

  /**
   * Handle responses
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetVariableMonitoring)
  protected async _handleSetVariableMonitoring(
    message: IMessage<OCPP2_response_types.SetVariableMonitoringResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetVariableMonitoring response received:', message, props);

    for (const setMonitoringResultType of message.payload.setMonitoringResult) {
      await this._variableMonitoringRepository.updateResultByStationId(
        message.context.tenantId,
        setMonitoringResultType,
        message.context.ocppConnectionName,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearVariableMonitoring)
  protected async _handleClearVariableMonitoring(
    message: IMessage<OCPP2_response_types.ClearVariableMonitoringResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearVariableMonitoring response received:', message, props);

    await this._monitoringService.processClearMonitoringResult(
      message.context.tenantId,
      message.context.ocppConnectionName,
      message.payload.clearMonitoringResult,
    );
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetMonitoringReport)
  protected _handleGetMonitoringReport(
    message: IMessage<OCPP2_response_types.GetMonitoringReportResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetMonitoringReport response received:', message, props);

    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_common_types.StatusInfoType | undefined | null =
      message.payload.statusInfo;

    if (
      status === GenericDeviceModelStatusEnum.Rejected ||
      status === GenericDeviceModelStatusEnum.NotSupported
    ) {
      this._logger.error(
        'Failed to get monitoring report.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetMonitoringLevel)
  protected _handleSetMonitoringLevel(
    message: IMessage<OCPP2_response_types.SetMonitoringLevelResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('SetMonitoringLevel response received:', message, props);

    const status: GenericStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_common_types.StatusInfoType | undefined | null =
      message.payload.statusInfo;
    if (status === GenericStatusEnum.Rejected) {
      this._logger.error(
        'Failed to set monitoring level.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetMonitoringBase)
  protected async _handleSetMonitoringBase(
    message: IMessage<OCPP2_response_types.SetMonitoringBaseResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetMonitoringBase response received:', message, props);

    const status: GenericDeviceModelStatusEnumType = message.payload.status;
    const statusInfo: OCPP2_common_types.StatusInfoType | undefined | null =
      message.payload.statusInfo;

    if (
      status === GenericDeviceModelStatusEnum.Rejected ||
      status === GenericDeviceModelStatusEnum.NotSupported
    ) {
      this._logger.error(
        'Failed to set monitoring base.',
        status,
        statusInfo?.reasonCode,
        statusInfo?.additionalInfo,
      );
    } else {
      // After setting monitoring base, variable monitorings on charger side are influenced
      // To get all the latest monitoring data, we intend to mask all variable monitorings on the charger as rejected.
      // Then request a GetMonitoringReport for all monitorings
      const ocppConnectionName: string = message.context.ocppConnectionName;
      await this._variableMonitoringRepository.rejectAllVariableMonitoringsByStationId(
        message.context.tenantId,
        OCPP_CallAction.SetVariableMonitoring,
        ocppConnectionName,
      );
      this._logger.debug('Rejected all variable monitorings on the charger', ocppConnectionName);

      await this.sendCall(
        ocppConnectionName,
        message.context.tenantId,
        message.protocol,
        OCPP_CallAction.GetMonitoringReport,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.tenantId,
            message.context.ocppConnectionName,
            ChargingStationSequenceTypeEnum.getMonitoringReport,
          ),
        } as OCPP2_request_types.GetMonitoringReportRequest,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetVariables)
  protected async _handleGetVariables(
    message: IMessage<OCPP2_response_types.GetVariablesResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetVariables response received:', message, props);
    await this._deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId(
      message.context.tenantId,
      message.payload.getVariableResult,
      message.context.ocppConnectionName,
      message.context.timestamp,
    );
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetVariables)
  protected async _handleSetVariables(
    message: IMessage<OCPP2_response_types.SetVariablesResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetVariables response received:', message, props);
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const correlationId = message.context.correlationId;
    const setVariablesDataMap: SetVariableDataMap =
      await this.getSetVariablesDataMapFromOriginalSetVariablesRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
      );
    for (const setVariableResultType of message.payload.setVariableResult) {
      await this.handleSetVariableResultType(
        tenantId,
        ocppConnectionName,
        setVariableResultType,
        setVariablesDataMap,
        message.context.timestamp,
      );
    }
  }

  protected async getSetVariablesDataMapFromOriginalSetVariablesRequest(
    tenantId: number,
    ocppConnectionName: string,
    correlationId: string,
  ) {
    // map where key is `${component}-${componentInstance}-${variable}-${variableInstance}` and value is the SetVariableData
    const setVariablesDataMap: SetVariableDataMap = {};
    const requestOcppMessage = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        tenantId,
        ocppConnectionName: ocppConnectionName,
        correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });

    if (requestOcppMessage) {
      const setVariablesRequest = requestOcppMessage
        .message[3] as OCPP2_request_types.SetVariablesRequest;
      const setVariableData = setVariablesRequest.setVariableData;
      setVariableData.forEach((setVariableData) => {
        const component = setVariableData.component.name;
        const variable = setVariableData.variable.name;
        const componentInstance = setVariableData.component.instance || 'null';
        const variableInstance = setVariableData.variable.instance || 'null';
        setVariablesDataMap[
          this.getSetVariableDataMapKey(component, componentInstance, variable, variableInstance)
        ] = setVariableData;
      });
    }

    return setVariablesDataMap;
  }

  protected async handleSetVariableResultType(
    tenantId: number,
    ocppConnectionName: string,
    setVariableResultType: OCPP2_common_types.SetVariableResultType,
    setVariablesDataMap: SetVariableDataMap,
    timestamp: string,
  ) {
    const componentName = setVariableResultType.component.name;
    const variableName = setVariableResultType.variable.name;
    const componentInstance = setVariableResultType.component.instance || null;
    const variableInstance = setVariableResultType.variable.instance || null;
    const applicableSetVariableData =
      setVariablesDataMap[
        this.getSetVariableDataMapKey(
          componentName,
          componentInstance,
          variableName,
          variableInstance,
        )
      ];
    if (applicableSetVariableData) {
      const variableValue = applicableSetVariableData.attributeValue;
      const attributeType = applicableSetVariableData.attributeType ?? AttributeEnum.Actual;
      const existingVariableAttribute = await this.getExistingOrCreateVariableAttribute(
        tenantId,
        ocppConnectionName,
        componentName,
        componentInstance,
        variableName,
        variableInstance,
        variableValue,
        attributeType,
      );
      if (setVariableResultType.attributeStatus === SetVariableStatusEnum.Accepted) {
        existingVariableAttribute?.setDataValue('value', variableValue);
      }
      await this._deviceModelRepository.updateResultByStationId(
        tenantId,
        setVariableResultType,
        ocppConnectionName,
        timestamp,
        existingVariableAttribute || undefined,
      );
    }
  }

  protected async getExistingOrCreateVariableAttribute(
    tenantId: number,
    ocppConnectionName: string,
    componentName: string,
    componentInstance: string | null,
    variableName: string,
    variableInstance: string | null,
    variableValue: string,
    attributeType: AttributeEnumType,
  ): Promise<VariableAttribute> {
    let existingVariableAttribute = (await this.deviceModelRepository.readOnlyOneByQuery(tenantId, {
      where: {
        ocppConnectionName,
        type: attributeType,
      },
      include: [
        {
          model: Component,
          where: {
            name: componentName,
            instance: componentInstance ? componentInstance : null,
          },
        },
        {
          model: Variable,
          where: {
            name: variableName,
            instance: variableInstance ? variableInstance : null,
          },
        },
      ],
    })) as VariableAttribute;
    if (!existingVariableAttribute) {
      const createdVariableAttributes =
        await this.deviceModelRepository.createOrUpdateBySetVariablesDataAndStationId(
          tenantId,
          [
            {
              attributeType: attributeType,
              attributeValue: variableValue,
              component: {
                name: componentName,
                instance: componentInstance ? componentInstance : null,
              },
              variable: {
                name: variableName,
                instance: variableInstance ? variableInstance : null,
              },
            } as OCPP2_common_types.SetVariableDataType,
          ],
          ocppConnectionName,
          new Date().toISOString(),
        );
      if (createdVariableAttributes && createdVariableAttributes.length === 1) {
        existingVariableAttribute = createdVariableAttributes[0];
      }
    }
    return existingVariableAttribute;
  }

  protected getSetVariableDataMapKey(
    componentName: string,
    componentInstance: string | null,
    variableName: string,
    variableInstance: string | null,
  ) {
    return `${componentName}-${componentInstance}-${variableName}-${variableInstance}`;
  }
}

export default MonitoringModule;
