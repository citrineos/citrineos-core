// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsRequestHandler, type IMessage, type IOcppSender, OCPP2_request_types, OCPP2_response_types } from '@citrineos/base';
import { type HandlerProperties, OCPP_2_VER_LIST, OCPP_CallAction } from '@citrineos/types';
import type { StatusNotificationService } from '@modules/Transactions/src/module/StatusNotificationService.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.StatusNotification)
export class StatusNotificationRequestOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_request_types.StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog(`StatusNotificationRequest ${message.protocol}`),
      message,
      props,
    );

    await this._statusNotificationService
      .processStatusNotification(
        message.context.tenantId,
        message.context.ocppConnectionName,
        message.payload,
      )
      .catch((error) => {
        this._logger.error('Failed to process status notification', error);
      });

    const response: OCPP2_response_types.StatusNotificationResponse = {};
    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog(`StatusNotification ${message.protocol} Response`),
      messageConfirmation,
    );
  }
}
