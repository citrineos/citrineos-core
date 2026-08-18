// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import {
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_response_types,
} from '@citrineos/types';
import type { TransactionService } from '@modules/Transactions/src/module/TransactionService.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetTransactionStatus)
export class GetTransactionStatusResponseOcpp2Handler extends AbstractHandler {
  protected _transactionService: TransactionService;

  constructor({
    logger,
    transactionService,
  }: AbstractHandlerDependencies & {
    transactionService: TransactionService;
  }) {
    super(logger);

    this._transactionService = transactionService;
  }

  async handle(
    message: IMessage<OCPP2_response_types.GetTransactionStatusResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('GetTransactionStatusResponse'),
      message,
      props,
    );

    const response = message.payload;
    if (response.ongoingIndicator !== null && response.ongoingIndicator !== undefined) {
      await this._transactionService.updateTransactionStatus(
        message.context.tenantId,
        message.context.ocppConnectionName,
        message.context.correlationId,
        response.ongoingIndicator,
      );
    }
  }
}
