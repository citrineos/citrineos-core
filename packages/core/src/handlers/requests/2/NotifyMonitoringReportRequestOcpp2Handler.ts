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
import type { IDeviceModelRepository, IVariableMonitoringRepository } from '@/dal/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyMonitoringReport)
export class NotifyMonitoringReportRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;

  constructor({
    logger,
    ocppSender,
    deviceModelRepository,
    variableMonitoringRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    deviceModelRepository: IDeviceModelRepository;
    variableMonitoringRepository: IVariableMonitoringRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._deviceModelRepository = deviceModelRepository;
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
        await this._deviceModelRepository.findOrCreateEvseAndComponentAndVariable(
          message.context.tenantId,
          monitorType.component,
          monitorType.variable,
        );
      await this._variableMonitoringRepository.createOrUpdateByMonitoringDataTypeAndStationId(
        message.context.tenantId,
        monitorType,
        component ? component.id : null,
        variable ? variable.id : null,
        ocppConnectionName,
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
