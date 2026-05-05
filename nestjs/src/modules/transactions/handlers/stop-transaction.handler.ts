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
import { StopTransactionRequest } from '@dto/transactions/stop-transaction.request';
import { IdTagInfoStatusEnum16 } from '@enums/id-tag-status-16.enum';
import { AuthorizationStatusEnumType } from '@enums/authorization-status.enum';
import { AuthorizationRepository } from '@repositories/authorization.repository';
import { Ocpp16HistoryRepository } from '@repositories/ocpp16-history.repository';
import { TransactionService } from '@modules/transactions/services/transaction.service';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * OCPP 1.6 StopTransaction handler.
 *
 * Mirrors legacy `_handleOcpp16StopTransaction`:
 *   1. Look up the Authorization for `idTag` (optional in 1.6). Map
 *      the 2.0.1 status enum to 1.6's narrower set; unknown idTag → Invalid.
 *   2. Resolve `parentIdTag` if the auth row points at a group token.
 *   3. Build idTagInfo with `status` + optional `expiryDate` + `parentIdTag`.
 *   4. Respond.
 *   5. Persist a `StopTransactions` history row.
 *   6. If a matching `StartTransactions` row exists, compute totalKwh =
 *      (meterStop − meterStart) / 1000 + flat-rate totalCost.
 *   7. Persist trailing `transactionData` meter values via the shared 1.6
 *      path (recomputes totalKwh from the full sample set).
 *   8. End the Transaction row.
 */
@OcppHandler(OCPP_CallAction.StopTransaction, [OCPPVersion.OCPP1_6], StopTransactionRequest)
export class StopTransactionHandler extends OcppRequestHandler<StopTransactionRequest> {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly authRepo: AuthorizationRepository,
    private readonly history: Ocpp16HistoryRepository,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<StopTransactionRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { transactionId, meterStop, timestamp, reason, idTag, transactionData } = msg.payload;

    this.logger.debug(
      `StopTransaction (1.6) from ${stationId}: transactionId=${transactionId}, reason=${reason ?? 'Local'}`,
    );

    let response: Record<string, unknown> = {};
    if (idTag) {
      const auth = await this.authRepo.findByIdTokenAnyType(tenantId, idTag);
      const status = mapTo16Status(
        (auth?.status as AuthorizationStatusEnumType) ?? AuthorizationStatusEnumType.Invalid,
      );
      const groupAuth = auth?.groupAuthorizationId
        ? await this.authRepo.findById(tenantId, auth.groupAuthorizationId)
        : null;
      response = {
        idTagInfo: {
          status,
          ...(auth?.cacheExpiryDateTime
            ? { expiryDate: auth.cacheExpiryDateTime.toISOString() }
            : {}),
          ...(groupAuth ? { parentIdTag: groupAuth.idToken } : {}),
        },
      };
    }

    await msg.respond(response);

    this.webhooks.emit(
      WebhookEvent.TransactionEnded,
      { request: msg.payload, response },
      { stationId, tenantId },
    );

    void this.persistStopTransaction(
      tenantId,
      stationId,
      transactionId,
      meterStop,
      timestamp,
      reason ?? null,
      idTag,
      transactionData,
    ).catch((err) =>
      this.logger.error(
        `Failed to persist 1.6 StopTransaction for ${stationId}/${transactionId}: ${(err as Error).message}`,
      ),
    );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }

  private async persistStopTransaction(
    tenantId: number,
    stationId: string,
    transactionId: number,
    meterStop: number,
    timestamp: string,
    reason: string | null,
    idTag: string | undefined,
    transactionData: StopTransactionRequest['transactionData'],
  ): Promise<void> {
    const tx = await this.transactionService.findActiveTransaction16(
      tenantId,
      stationId,
      transactionId,
    );

    // 1) Insert StopTransactions row.
    await this.history.insertStop({
      tenantId,
      stationId,
      transactionDatabaseId: tx?.id ?? null,
      meterStop,
      timestamp,
      reason,
      idTokenValue: idTag ?? null,
      idTokenType: null,
    });

    // 2) Direct meterStop−meterStart calc when no per-sample data was sent.
    if (tx) {
      const start = await this.history.findStartByTransaction(tenantId, tx.id);
      if (start) {
        await this.transactionService.applyStopTransactionTotals16(
          tenantId,
          stationId,
          transactionId,
          meterStop,
          start.meterStart,
        );
      }
    }

    // 3) Trailing meter values — recordMeterValues16 recomputes totalKwh
    // from the per-sample max-min, overwriting the simpler calc when
    // richer data is present.
    if (transactionData && transactionData.length > 0) {
      await this.transactionService.recordMeterValues16(
        tenantId,
        stationId,
        transactionId,
        transactionData as unknown as Parameters<TransactionService['recordMeterValues16']>[3],
      );
    }

    // 4) End the Transaction row.
    await this.transactionService.stopTransaction16(tenantId, stationId, transactionId, reason);
  }
}

/** Map 2.0.1 AuthorizationStatus → 1.6 IdTagInfo.status; unknowns → Invalid. */
function mapTo16Status(status: AuthorizationStatusEnumType): IdTagInfoStatusEnum16 {
  switch (status) {
    case AuthorizationStatusEnumType.Accepted:
      return IdTagInfoStatusEnum16.Accepted;
    case AuthorizationStatusEnumType.Blocked:
      return IdTagInfoStatusEnum16.Blocked;
    case AuthorizationStatusEnumType.Expired:
      return IdTagInfoStatusEnum16.Expired;
    case AuthorizationStatusEnumType.ConcurrentTx:
      return IdTagInfoStatusEnum16.ConcurrentTx;
    default:
      return IdTagInfoStatusEnum16.Invalid;
  }
}
