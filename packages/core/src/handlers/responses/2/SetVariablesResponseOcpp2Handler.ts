// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/base';
import {
  AttributeEnum,
  type AttributeEnumType,
  type HandlerProperties,
  MessageOrigin,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  SetVariableStatusEnum,
} from '@citrineos/types';
import {
  Component,
  type IDeviceModelRepository,
  type IOCPPMessageRepository,
  Variable,
  VariableAttribute,
} from '@dal/index.js';

type SetVariableDataMap = { [key: string]: OCPP2_common_types.SetVariableDataType };

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetVariables)
export class SetVariablesResponseOcpp2Handler extends AbstractHandler {
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _ocppMessageRepository: IOCPPMessageRepository;

  constructor({
    logger,
    deviceModelRepository,
    ocppMessageRepository,
  }: AbstractHandlerDependencies & {
    deviceModelRepository: IDeviceModelRepository;
    ocppMessageRepository: IOCPPMessageRepository;
  }) {
    super(logger);

    this._deviceModelRepository = deviceModelRepository;
    this._ocppMessageRepository = ocppMessageRepository;
  }

  async handle(
    message: IMessage<OCPP2_response_types.SetVariablesResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('SetVariablesResponse'),
      message,
      props,
    );
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
      const setVariablesRequest =
        requestOcppMessage.payload as OCPP2_request_types.SetVariablesRequest;
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
    let existingVariableAttribute = (await this._deviceModelRepository.readOnlyOneByQuery(
      tenantId,
      {
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
      },
    )) as VariableAttribute;
    if (!existingVariableAttribute) {
      const createdVariableAttributes =
        await this._deviceModelRepository.createOrUpdateBySetVariablesDataAndStationId(
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
