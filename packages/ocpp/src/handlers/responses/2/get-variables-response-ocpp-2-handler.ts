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
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IVariableAttributeRepository } from '@citrineos/dal';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetVariables)
export class GetVariablesResponseOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_response_types.GetVariablesResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('GetVariablesResponse'),
      message,
      props,
    );
    await this._variableAttributeRepository.createOrUpdateByGetVariablesResultAndStationId(
      message.context.tenantId,
      message.payload.getVariableResult,
      message.context.ocppConnectionName,
      message.context.timestamp,
    );
  }
}
