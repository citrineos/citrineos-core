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

/**
 * L03.FR.01: a Local Controller reports each step of publishing a firmware file the CSMS asked it to
 * publish (PublishFirmwareRequest) with a PublishFirmwareStatusNotificationRequest. The response has
 * no fields; what the CSMS owes the controller is the acknowledgement.
 */
@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.PublishFirmwareStatusNotification)
export class PublishFirmwareStatusNotificationRequestOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_request_types.PublishFirmwareStatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('PublishFirmwareStatusNotificationRequest'),
      message,
      props,
    );

    // L03.FR.04: with status Published the controller lists the URIs it is serving the file from,
    // one per protocol it supports. They are worth having in the log, since a station's
    // UpdateFirmwareRequest is what they are for.
    if (message.payload.location?.length) {
      this._logger.info(
        `Firmware published by ${message.context.ocppConnectionName} at ${message.payload.location.join(', ')}`,
      );
    }

    const response: OCPP2_response_types.PublishFirmwareStatusNotificationResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('PublishFirmwareStatusNotificationResponse'),
      messageConfirmation,
    );
  }
}
