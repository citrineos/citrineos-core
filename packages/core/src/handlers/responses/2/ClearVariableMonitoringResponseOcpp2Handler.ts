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
import type { MonitoringService } from '@modules/Monitoring/src/module/MonitoringService.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearVariableMonitoring)
export class ClearVariableMonitoringResponseOcpp2Handler extends AbstractHandler {
  protected _monitoringService: MonitoringService;

  constructor({
    ocppSender,
    logger,
    monitoringService,
  }: AbstractHandlerDependencies & {
    monitoringService: MonitoringService;
  }) {
    super(ocppSender, logger);

    this._monitoringService = monitoringService;
  }

  async handle(
    message: IMessage<OCPP2_response_types.ClearVariableMonitoringResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('ClearVariableMonitoringResponse'),
      message,
      props,
    );

    await this._monitoringService.processClearMonitoringResult(
      message.context.tenantId,
      message.context.ocppConnectionName,
      message.payload.clearMonitoringResult,
    );
  }
}
