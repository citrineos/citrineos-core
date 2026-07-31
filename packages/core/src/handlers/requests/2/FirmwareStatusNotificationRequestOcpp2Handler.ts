// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/base';
import { type HandlerProperties, OCPP_2_VER_LIST, OCPP_CallAction } from '@citrineos/types';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.FirmwareStatusNotification)
export class FirmwareStatusNotificationRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;

  constructor({
    logger,
    ocppSender,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
  }

  async handle(
    message: IMessage<OCPP2_request_types.FirmwareStatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('FirmwareStatusNotificationRequest'),
      message,
      props,
    );

    // TODO: FirmwareStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // requestId is optional (see the request schema): it is absent when the message was
    // triggered by a TriggerMessageRequest and there is no firmware update ongoing. Acknowledge
    // the notification regardless of whether requestId is present.

    const response: OCPP2_response_types.FirmwareStatusNotificationResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('FirmwareStatusNotificationResponse'),
      messageConfirmation,
    );
  }
}
