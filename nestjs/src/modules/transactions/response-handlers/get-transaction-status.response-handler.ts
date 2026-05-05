// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppResponseHandler } from '@ocpp/ocpp-handler.decorator';
import { CsmsResponseHandler, CsmsResponseMessage } from '@ocpp/csms-response-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { TransactionRepository } from '@repositories/transaction.repository';
import { RemoteCallsService } from '@remote-calls/remote-calls.service';

interface GetTransactionStatusResponse {
  ongoingIndicator?: boolean;
  messagesInQueue: boolean;
}

interface GetTransactionStatusRequest extends Record<string, unknown> {
  transactionId?: string;
}

/**
 * Response handler for OCPP 2.0.1 / 2.1 `GetTransactionStatus`.
 *
 * Mirrors legacy `_handleGetTransactionStatus`: when the charger
 * reports `ongoingIndicator=false`, we sync our `Transactions.isActive`
 * column to the charger's truth. The transactionId comes from the
 * originating request payload (cached by RemoteCallsService).
 */
@OcppResponseHandler(OCPP_CallAction.GetTransactionStatus, [
  OCPPVersion.OCPP2_0_1,
  OCPPVersion.OCPP2_1,
])
export class GetTransactionStatusResponseHandler extends CsmsResponseHandler<GetTransactionStatusResponse> {
  constructor(
    private readonly txRepo: TransactionRepository,
    private readonly remoteCalls: RemoteCallsService,
  ) {
    super();
  }

  async handle(msg: CsmsResponseMessage<GetTransactionStatusResponse>): Promise<void> {
    const { stationId, tenantId, correlationId } = msg.context;
    const { ongoingIndicator } = msg.payload;
    if (ongoingIndicator === undefined || ongoingIndicator === null) {
      this.logger.debug(`GetTransactionStatus ${stationId}: no ongoingIndicator — skipping sync`);
      return;
    }

    const original = await this.remoteCalls.getOriginatingRequest<GetTransactionStatusRequest>(
      correlationId,
      stationId,
    );
    const transactionId = original?.payload.transactionId;
    if (!transactionId) {
      this.logger.warn(
        `GetTransactionStatus ${stationId}: no transactionId in originating request — cannot sync`,
      );
      return;
    }

    if (!ongoingIndicator) {
      await this.txRepo.end(
        tenantId,
        stationId,
        transactionId,
        'GetTransactionStatusReportedEnded',
      );
      this.logger.debug(`GetTransactionStatus ${stationId}: ${transactionId} marked inactive`);
    }
  }
}
