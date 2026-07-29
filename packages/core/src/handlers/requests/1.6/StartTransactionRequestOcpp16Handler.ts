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
  recordAuthorizeResult,
} from '@citrineos/base';
import type { TransactionService } from '@modules/Transactions/src/module/TransactionService.js';
import type { ILocationRepository, ITransactionEventRepository } from '@/dal/index.js';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StartTransaction)
export class StartTransactionRequestOcpp16Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _locationRepository: ILocationRepository;
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _transactionService: TransactionService;

  constructor({
    logger,
    ocppSender,
    locationRepository,
    transactionEventRepository,
    transactionService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    locationRepository: ILocationRepository;
    transactionEventRepository: ITransactionEventRepository;
    transactionService: TransactionService;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._locationRepository = locationRepository;
    this._transactionEventRepository = transactionEventRepository;
    this._transactionService = transactionService;
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
    const response = await this._transactionService.authorizeOcpp16IdToken(
      message.context,
      request.idTag,
      request.connectorId,
    );
    recordAuthorizeResult({
      status: response.idTagInfo.status,
      ocppVersion: String(message.protocol),
      action: 'StartTransaction',
    });

    // Send response to charger
    if (response.idTagInfo.status !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
      await this._ocppSender.sendCallResultWithMessage(message, response);
    } else {
      try {
        // Create transaction
        const newTransaction =
          await this._transactionEventRepository.createTransactionByStartTransaction(
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
        response.idTagInfo = {
          status: OCPP1_6.StartTransactionResponseStatus.Invalid,
        };
      }
      await this._ocppSender.sendCallResultWithMessage(message, response);
    }

    await this.deactivateOtherActiveTransactionsAtEvse16(
      tenantId,
      response.transactionId.toString(),
      ocppConnectionName,
      request,
    );

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
    const connector = await this._locationRepository.readConnectorByStationIdAndOcpp16ConnectorId(
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
