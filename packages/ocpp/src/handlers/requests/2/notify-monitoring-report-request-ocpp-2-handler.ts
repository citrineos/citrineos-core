// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
} from '@citrineos/base';
import {
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IComponentRepository, IVariableMonitoringRepository } from '@citrineos/dal';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyMonitoringReport)
export class NotifyMonitoringReportRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _componentRepository: IComponentRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;

  constructor({
    logger,
    ocppSender,
    componentRepository,
    variableMonitoringRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    componentRepository: IComponentRepository;
    variableMonitoringRepository: IVariableMonitoringRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._componentRepository = componentRepository;
    this._variableMonitoringRepository = variableMonitoringRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.NotifyMonitoringReportRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog(`NotifyMonitoringReportRequest ${message.protocol}`),
      message,
      props,
    );

    for (const monitorType of message.payload.monitor ? message.payload.monitor : []) {
      const ocppConnectionName: string = message.context.ocppConnectionName;
      const [component, variable] =
        await this._componentRepository.findOrCreateEvseAndComponentAndVariable(
          message.context.tenantId,
          monitorType.component,
          monitorType.variable,
        );
      await this._variableMonitoringRepository.createOrUpdateByMonitoringDataTypeAndStationId(
        message.context.tenantId,
        monitorType,
        ocppConnectionName,
        component.id,
        variable.id,
      );
    }

    const response: OCPP2_response_types.NotifyMonitoringReportResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('NotifyMonitoringReportResponse'),
      messageConfirmation,
    );
  }
}
