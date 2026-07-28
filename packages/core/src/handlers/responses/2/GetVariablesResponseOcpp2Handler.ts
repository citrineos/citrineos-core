// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type HandlerProperties,
  type IMessage,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';
import type { IDeviceModelRepository } from '@/dal/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetVariables)
export class GetVariablesResponseOcpp2Handler extends AbstractHandler {
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor({
    logger,
    deviceModelRepository,
  }: AbstractHandlerDependencies & {
    deviceModelRepository: IDeviceModelRepository;
  }) {
    super(logger);

    this._deviceModelRepository = deviceModelRepository;
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
    await this._deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId(
      message.context.tenantId,
      message.payload.getVariableResult,
      message.context.ocppConnectionName,
      message.context.timestamp,
    );
  }
}
