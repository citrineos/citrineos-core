// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AbstractHandler, type AbstractHandlerDependencies, AsRequestHandler, type IMessage, type IOcppSender } from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.DataTransfer)
export class DataTransferRequestOcpp16Handler extends AbstractHandler {
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
    message: IMessage<OCPP1_6.DataTransferRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(this.createHandlerReceivedMessageLog('DataTransferRequest'), message, props);

    const response: OCPP1_6.DataTransferResponse = {
      status: OCPP1_6.DataTransferResponseStatus.Rejected,
    };

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('DataTransferResponse'),
      messageConfirmation,
    );
  }
}
