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
import { type ITransactionEventRepository, Transaction } from '@dal/index.js';
import type { TransactionService } from '@modules/Transactions/src/module/TransactionService.js';
import type { CostNotifier } from '@modules/Transactions/src/module/CostNotifier.js';
import type { SignedMeterValuesUtil } from '@util/index.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.MeterValues)
export class MeterValuesRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _costNotifier: CostNotifier;
  protected _signedMeterValuesUtil: SignedMeterValuesUtil;
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _transactionService: TransactionService;

  private readonly _sendCostUpdatedOnMeterValue: boolean | undefined;

  constructor({
    logger,
    ocppSender,
    costNotifier,
    signedMeterValuesUtil,
    transactionEventRepository,
    transactionService,
  }: AbstractHandlerDependencies & {
    costNotifier: CostNotifier;
    ocppSender: IOcppSender;
    signedMeterValuesUtil: SignedMeterValuesUtil;
    transactionEventRepository: ITransactionEventRepository;
    transactionService: TransactionService;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._costNotifier = costNotifier;
    this._signedMeterValuesUtil = signedMeterValuesUtil;
    this._transactionEventRepository = transactionEventRepository;
    this._transactionService = transactionService;
  }

  async handle(
    message: IMessage<OCPP2_request_types.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    // TODO: Need a meter event handler for OCPP 2.1 as we need to tweak or extend the transaction
    // service for ocpp 2.1 (meter helper method is dependent on service)

    this._logger.debug(this.createHandlerReceivedMessageLog('MeterValuesRequest'), message, props);

    // TODO: Meter values can be triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    const meterValues = message.payload.meterValue;
    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const evseId = message.payload.evseId;

    // When evseId is 0, the MeterValuesRequest message SHALL be associated with the entire Charging Station.
    if (this._sendCostUpdatedOnMeterValue && evseId !== 0) {
      const activeTransaction: Transaction | undefined =
        await this._transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
          tenantId,
          ocppConnectionName,
          evseId,
        );
      if (!activeTransaction) {
        this._logger.error(
          'Active Transaction not found on charging station {} evse {}',
          ocppConnectionName,
          evseId,
        );
      }

      const meterValuesCreated = await this._transactionService.createMeterValues(
        tenantId,
        meterValues,
        activeTransaction?.id,
        activeTransaction?.transactionId,
        activeTransaction?.tariffId,
      );

      if (activeTransaction) {
        await this._transactionService.recalculateTotalKwh(activeTransaction, meterValuesCreated);
        await this._costNotifier.calculateCostAndNotify(
          activeTransaction,
          message.context.tenantId,
          message.protocol,
        );
      }
    } else {
      await this._transactionService.createMeterValues(tenantId, meterValues);
    }

    const meterValuesValid = await this._signedMeterValuesUtil.validateMeterValues(
      tenantId,
      ocppConnectionName,
      meterValues,
    );

    if (!meterValuesValid) {
      throw new OcppError(
        message.context.correlationId,
        ErrorCode.SecurityError,
        'One or more MeterValues have an invalid signature.',
      );
    }

    const response: OCPP2_response_types.MeterValuesResponse = {
      // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
    };

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('MeterValuesResponse'),
      messageConfirmation,
    );
  }
}
