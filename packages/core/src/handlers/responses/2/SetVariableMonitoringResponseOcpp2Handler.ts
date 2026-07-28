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
import type { IVariableMonitoringRepository } from '@/dal/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetVariableMonitoring)
export class SetVariableMonitoringResponseOcpp2Handler extends AbstractHandler {
  protected _variableMonitoringRepository: IVariableMonitoringRepository;

  constructor({
    logger,
    variableMonitoringRepository,
  }: AbstractHandlerDependencies & {
    variableMonitoringRepository: IVariableMonitoringRepository;
  }) {
    super(logger);

    this._variableMonitoringRepository = variableMonitoringRepository;
  }

  async handle(
    message: IMessage<OCPP2_response_types.SetVariableMonitoringResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('SetVariableMonitoringResponse'),
      message,
      props,
    );

    for (const setMonitoringResultType of message.payload.setMonitoringResult) {
      await this._variableMonitoringRepository.updateResultByStationId(
        message.context.tenantId,
        setMonitoringResultType,
        message.context.ocppConnectionName,
      );
    }
  }
}
