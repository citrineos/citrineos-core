// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import {
  HANDLER_HANDLED_RESPONSE,
  type HandlerHandledResponse,
  OcppMessage,
  OcppRequestHandler,
} from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { StartTransactionRequest } from '@dto/transactions/start-transaction.request';
import { TransactionService } from '@modules/transactions/services/transaction.service';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * OCPP 1.6 StartTransaction handler. Pure protocol layer — defers all
 * authorization + persistence work to TransactionService. Emits a
 * `transaction.started` semantic webhook to mirror the 2.0.1 flow.
 */
@OcppHandler(OCPP_CallAction.StartTransaction, [OCPPVersion.OCPP1_6], StartTransactionRequest)
export class StartTransactionHandler extends OcppRequestHandler<StartTransactionRequest> {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<StartTransactionRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { idTag, connectorId, timestamp, meterStart, reservationId } = msg.payload;

    this.logger.debug(
      `StartTransaction (1.6) from ${stationId}: idTag=${idTag}, connector=${connectorId}`,
    );

    const { transactionId, idTagInfo } = await this.transactionService.startTransaction16(
      tenantId,
      stationId,
      idTag,
      timestamp,
      meterStart,
      reservationId ?? null,
      connectorId,
    );

    const response = { transactionId, idTagInfo };
    await msg.respond(response);

    this.webhooks.emit(
      WebhookEvent.TransactionStarted,
      { request: msg.payload, response },
      { stationId, tenantId },
    );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }
}
