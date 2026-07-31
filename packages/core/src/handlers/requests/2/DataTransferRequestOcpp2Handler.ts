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
import {
  DataTransferStatusEnum,
  ErrorCode,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/types';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.DataTransfer)
export class DataTransferRequestOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_request_types.DataTransferRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(this.createHandlerReceivedMessageLog('DataTransferRequest'), message, props);

    const response = {
      status: DataTransferStatusEnum.Rejected,
      statusInfo: { reasonCode: ErrorCode.NotImplemented },
    } as OCPP2_response_types.DataTransferResponse;

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('DataTransferResponse'),
      messageConfirmation,
    );
  }
}
