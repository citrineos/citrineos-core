// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsRequestHandler, type IMessage, type IOcppSender } from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { StatusNotificationService } from '@modules/Transactions/src/module/StatusNotificationService.js';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StatusNotification)
export class StatusNotificationRequestOcpp16Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _statusNotificationService: StatusNotificationService;

  constructor({
    logger,
    ocppSender,
    statusNotificationService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    statusNotificationService: StatusNotificationService;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._statusNotificationService = statusNotificationService;
  }

  async handle(
    message: IMessage<OCPP1_6.StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog(`StatusNotificationRequest ${message.protocol}`),
      message,
      props,
    );

    await this._statusNotificationService.processOcpp16StatusNotification(
      message.context.tenantId,
      message.context.ocppConnectionName,
      message.payload,
    );

    const response: OCPP1_6.StatusNotificationResponse = {};
    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog(`StatusNotification ${message.protocol} Response`),
      messageConfirmation,
    );
  }
}
