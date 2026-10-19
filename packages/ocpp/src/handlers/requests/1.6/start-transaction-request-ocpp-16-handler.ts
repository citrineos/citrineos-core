// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
  recordAuthorizeResult,
} from '@citrineos/base';
import {
  AuthorizationAttemptReasonEnum,
  type HandlerProperties,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
  type TransactionDto,
} from '@citrineos/types';
import type { TransactionService } from '@modules/transactions/transaction-service.js';
import {
  type AuthorizationAttemptService,
  newAuthorizationDecision,
} from '@services/authorization-attempts/index.js';
import type { IConnectorRepository, ITransactionEventRepository } from '@citrineos/dal';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StartTransaction)
export class StartTransactionRequestOcpp16Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _connectorRepository: IConnectorRepository;
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _transactionService: TransactionService;
  protected _authorizationAttemptService: Pick<AuthorizationAttemptService, 'record'>;

  constructor({
    logger,
    ocppSender,
    connectorRepository,
    transactionEventRepository,
    transactionService,
    authorizationAttemptService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    connectorRepository: IConnectorRepository;
    transactionEventRepository: ITransactionEventRepository;
    transactionService: TransactionService;
    authorizationAttemptService: Pick<AuthorizationAttemptService, 'record'>;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._connectorRepository = connectorRepository;
    this._transactionEventRepository = transactionEventRepository;
    this._transactionService = transactionService;
    this._authorizationAttemptService = authorizationAttemptService;
  }

  async handle(
    message: IMessage<OCPP1_6.StartTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog(`StartTransactionRequest ${message.protocol}`),
      message,
      props,
    );
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const request = message.payload;

    // Authorize
    const decision = newAuthorizationDecision();
    const response = await this._transactionService.authorizeOcpp16IdToken(
      message.context,
      request.idTag,
      request.connectorId,
      decision,
    );
    recordAuthorizeResult({
      status: response.idTagInfo.status,
      ocppVersion: String(message.protocol),
      action: 'StartTransaction',
    });

    // Send response to charger
    let newTransaction: TransactionDto | undefined;
    if (response.idTagInfo.status !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
      await this._ocppSender.sendCallResultWithMessage(message, response);
    } else {
      try {
        // Create transaction
        newTransaction = await this._transactionEventRepository.createTransactionByStartTransaction(
          tenantId,
          request,
          ocppConnectionName,
        );
        response.transactionId = parseInt(newTransaction.transactionId);
      } catch (error) {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('Charging station') && errorMessage.includes('does not exist')) {
          this._logger.error(
            `Charging station ${ocppConnectionName} does not exist for idTag ${request.idTag}`,
          );
        } else {
          this._logger.error(`Failed to create transaction for idTag ${request.idTag}`, error);
        }
        decision.reason = AuthorizationAttemptReasonEnum.Error;
        response.idTagInfo = {
          status: OCPP1_6.StartTransactionResponseStatus.Invalid,
        };
      }
      await this._ocppSender.sendCallResultWithMessage(message, response);
    }

    await this._authorizationAttemptService.record(message.context, {
      ocppVersion: message.protocol,
      action: message.action,
      idToken: request.idTag,
      decision,
      responseStatus: response.idTagInfo.status,
      connectorId: request.connectorId,
      transaction: newTransaction,
    });

    if (response.idTagInfo.status === OCPP1_6.StartTransactionResponseStatus.Accepted) {
      await this.deactivateOtherActiveTransactionsAtEvse16(
        tenantId,
        response.transactionId.toString(),
        ocppConnectionName,
        request,
      );
    }

    // Deactivate reservation only if the transaction was accepted.
    // A rejected StartTransaction (auth failure or DB error) should not
    // consume the reservation — the charger may retry or another idTag
    // may use it.
    if (
      request.reservationId &&
      response.idTagInfo.status === OCPP1_6.StartTransactionResponseStatus.Accepted
    ) {
      await this._transactionService.deactivateReservation(
        tenantId,
        response.transactionId.toString(),
        request.reservationId,
        ocppConnectionName,
      );
    }
  }

  protected async deactivateOtherActiveTransactionsAtEvse16(
    tenantId: number,
    transactionId: string,
    ocppConnectionName: string,
    request: OCPP1_6.StartTransactionRequest,
  ) {
    const connector = await this._connectorRepository.readConnectorByStationIdAndOcpp16ConnectorId(
      tenantId,
      ocppConnectionName,
      request.connectorId,
    );
    if (!connector) {
      this._logger.error(`Unable to find connector ${request.connectorId}.`);
      throw new Error(`Unable to find connector ${request.connectorId}.`);
    }
    await this._transactionService.deactivateOtherActiveTransactionsAtEvse(
      tenantId,
      transactionId,
      ocppConnectionName,
      request.connectorId,
    );
  }
}
