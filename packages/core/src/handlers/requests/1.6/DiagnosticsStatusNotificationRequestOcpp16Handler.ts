// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.DiagnosticsStatusNotification)
export class DiagnosticsStatusNotificationRequestOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.DiagnosticsStatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('DiagnosticsStatusNotificationRequest'),
      message,
      props,
    );

    const response: OCPP1_6.DiagnosticsStatusNotificationResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug('Handler sent DiagnosticsStatusNotificationResponse: ', messageConfirmation);
  }
}
