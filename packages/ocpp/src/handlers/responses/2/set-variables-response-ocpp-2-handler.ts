// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import {
  AttributeEnum,
  type AttributeEnumType,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  SetVariableStatusEnum,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
  type VariableAttributeDto,
} from '@citrineos/types';
import { type IVariableAttributeRepository } from '@citrineos/dal';

type SetVariableDataMap = { [key: string]: OCPP2_common_types.SetVariableDataType };

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetVariables)
export class SetVariablesResponseOcpp2Handler extends AbstractHandler {
  protected _variableAttributeRepository: IVariableAttributeRepository;

  constructor({
    logger,
    variableAttributeRepository,
  }: AbstractHandlerDependencies & {
    variableAttributeRepository: IVariableAttributeRepository;
  }) {
    super(logger);

    this._variableAttributeRepository = variableAttributeRepository;
  }

  async handle(
    message: IMessage<
      OCPP2_response_types.SetVariablesResponse,
      OCPP2_request_types.SetVariablesRequest
    >,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('SetVariablesResponse'),
      message,
      props,
    );
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const setVariablesDataMap: SetVariableDataMap =
      this.getSetVariablesDataMapFromOriginalSetVariablesRequest(message.request);
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

  protected getSetVariablesDataMapFromOriginalSetVariablesRequest(
    setVariablesRequest: OCPP2_request_types.SetVariablesRequest | undefined,
  ) {
    // map where key is `${component}-${componentInstance}-${variable}-${variableInstance}` and value is the SetVariableData
    const setVariablesDataMap: SetVariableDataMap = {};

    if (setVariablesRequest) {
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
      // Ensure the attribute row exists (create it if the charger reported an unknown one)
      // before the repository records the result and applies the accepted value.
      await this.getExistingOrCreateVariableAttribute(
        tenantId,
        ocppConnectionName,
        componentName,
        componentInstance,
        variableName,
        variableInstance,
        variableValue,
        attributeType,
      );
      await this._variableAttributeRepository.updateResultByStationId(
        tenantId,
        setVariableResultType,
        ocppConnectionName,
        timestamp,
        setVariableResultType.attributeStatus === SetVariableStatusEnum.Accepted
          ? variableValue
          : undefined,
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
  ): Promise<VariableAttributeDto | undefined> {
    let existingVariableAttribute =
      await this._variableAttributeRepository.findVariableAttributeByComponentAndVariable(
        tenantId,
        ocppConnectionName,
        attributeType,
        { name: componentName, instance: componentInstance ?? null },
        { name: variableName, instance: variableInstance ?? null },
      );
    if (!existingVariableAttribute) {
      const createdVariableAttributes =
        await this._variableAttributeRepository.createOrUpdateBySetVariablesDataAndStationId(
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
