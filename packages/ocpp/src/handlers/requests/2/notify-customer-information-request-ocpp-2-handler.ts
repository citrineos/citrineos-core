// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
  OcppError,
} from '@citrineos/base';
import {
  ErrorCode,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IOCPPMessageRepository } from '@citrineos/dal';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyCustomerInformation)
export class NotifyCustomerInformationRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _ocppMessageRepository: IOCPPMessageRepository;

  constructor({
    logger,
    ocppSender,
    ocppMessageRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    ocppMessageRepository: IOCPPMessageRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._ocppMessageRepository = ocppMessageRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.NotifyCustomerInformationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('NotifyCustomerInformationRequest'),
      message,
      props,
    );

    // Validate requestId was provided in a previous CustomerInformationRequest
    const requestId = message.payload.requestId;
    const previousRequest = await this._ocppMessageRepository.readAllByQuery(
      message.context.tenantId,
      {
        where: {
          tenantId: message.context.tenantId,
          ocppConnectionName: message.context.ocppConnectionName,
          action: OCPP_CallAction.CustomerInformation,
          payload: {
            requestId: requestId,
          },
        },
        limit: 1,
      },
    );

    if (!previousRequest || previousRequest.length === 0) {
      await this._ocppSender.sendCallErrorWithMessage(
        message,
        new OcppError(
          message.context.correlationId,
          ErrorCode.PropertyConstraintViolation,
          'RequestId was not provided in a CustomerInformationRequest.',
        ),
      );
      return;
    }

    const response: OCPP2_response_types.NotifyCustomerInformationResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('NotifyCustomerInformationResponse'),
      messageConfirmation,
    );
  }
}
