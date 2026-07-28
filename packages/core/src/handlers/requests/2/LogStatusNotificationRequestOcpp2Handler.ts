// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  ErrorCode,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OcppError,
} from '@citrineos/base';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.LogStatusNotification)
export class LogStatusNotificationRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;

  constructor({ logger, ocppSender }: AbstractHandlerDependencies & { ocppSender: IOcppSender }) {
    super(logger);

    this._ocppSender = ocppSender;
  }

  async handle(
    message: IMessage<OCPP2_request_types.LogStatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('LogStatusNotificationRequest'),
      message,
      props,
    );

    // TODO: LogStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // Validate requestId requirement
    // requestId is mandatory unless message was triggered by TriggerMessageRequest AND no log upload ongoing
    if (!message.payload.requestId) {
      await this._ocppSender.sendCallErrorWithMessage(
        message,
        new OcppError(
          message.context.correlationId,
          ErrorCode.OccurrenceConstraintViolation,
          'RequestId is required.',
        ),
      );
      return;
    }
    // Create response
    const response: OCPP2_response_types.LogStatusNotificationResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug('Handler sent LogStatusNotificationResponse: ', messageConfirmation);
  }
}
