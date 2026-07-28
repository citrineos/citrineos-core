// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type HandlerProperties,
  type IMessage,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/base';
import type { IDeviceModelRepository, IVariableMonitoringRepository } from '@dal/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyEvent)
export class NotifyEventRequestOcpp2Handler extends AbstractHandler {
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;

  constructor({
    ocppSender,
    logger,
    deviceModelRepository,
    variableMonitoringRepository,
  }: AbstractHandlerDependencies & {
    deviceModelRepository: IDeviceModelRepository;
    variableMonitoringRepository: IVariableMonitoringRepository;
  }) {
    super(ocppSender, logger);

    this._deviceModelRepository = deviceModelRepository;
    this._variableMonitoringRepository = variableMonitoringRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.NotifyEventRequest>,
    props?: HandlerProperties,
  ) {
    this._logger.debug('Handler for NotifyEventRequest received message:', message, props);
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

    const response: OCPP2_response_types.NotifyEventResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug('Handler sent NotifyEventResponse:', messageConfirmation);
  }
}
