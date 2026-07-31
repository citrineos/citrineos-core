// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  AttributeEnum,
  type BootstrapConfig,
  ErrorCode,
  EventGroup,
  type HandlerProperties,
  type IMessage,
  type IOcppSender,
  OCPP2_1,
  OCPP_CallAction,
  OcppError,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/base';
import {
  type IDeviceModelRepository,
  type ITransactionEventRepository,
  Transaction,
  VariableAttribute,
} from '@/dal/index.js';

/**
 * C19 - Cancellation prior to transaction
 * C21 - Settlement at end of transaction
 * C22 - Settlement is rejected or fails
 * Handles NotifySettlementRequest from Charging Station to inform CSMS
 * that a payment has been canceled, settled, rejected, or failed.
 *
 * C21.FR.02: CS sends NotifySettlementRequest with status, amount, time, transId, and pspRef.
 * C21.FR.03: If PaymentCtrlr.ReceiptByCSMS = true, CSMS responds with receiptUrl (only for Settled).
 * C21.FR.04: If ReceiptByCSMS = false, CS includes receiptUrl/receiptId in the request (no action needed from CSMS).
 * C22.FR.01: If status is Rejected, store settlement data without receipt information.
 * C22.FR.02: If status is Failed, store settlement data without receipt information.
 */
@AsRequestHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.NotifySettlement)
export class NotifySettlementRequestOcpp21Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _config: BootstrapConfig & SystemConfig;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _transactionEventRepository: ITransactionEventRepository;

  constructor({
    logger,
    ocppSender,
    config,
    deviceModelRepository,
    transactionEventRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    config: BootstrapConfig & SystemConfig;
    deviceModelRepository: IDeviceModelRepository;
    transactionEventRepository: ITransactionEventRepository;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._config = config;
    this._deviceModelRepository = deviceModelRepository;
    this._transactionEventRepository = transactionEventRepository;
  }

  async handle(
    message: IMessage<OCPP2_1.NotifySettlementRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('NotifySettlementRequest (2.1)'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const request = message.payload;

    this._logger.info(
      `NotifySettlement received: pspRef=${request.pspRef}, status=${request.status}, ` +
        `amount=${request.settlementAmount}, transactionId=${request.transactionId ?? 'none'}`,
    );

    const isSettled = request.status === OCPP2_1.PaymentStatusEnumType.Settled;
    const isRejected = request.status === OCPP2_1.PaymentStatusEnumType.Rejected;
    const isFailed = request.status === OCPP2_1.PaymentStatusEnumType.Failed;
    const isCancelled = request.status === OCPP2_1.PaymentStatusEnumType.Canceled;

    const isValidSettlementStatus = isSettled || isRejected || isFailed || isCancelled;
    if (!isValidSettlementStatus) {
      throw new OcppError(
        message.context.correlationId,
        ErrorCode.PropertyConstraintViolation,
        `Invalid settlement status: ${request.status}. Must be one of 'Settled', 'Rejected', 'Canceled' or 'Failed'.`,
      );
    }

    if (isRejected || isFailed) {
      this._logger.warn(
        `Settlement ${request.status} for station ${ocppConnectionName}, ` +
          `transaction ${request.transactionId ?? 'none'}, pspRef=${request.pspRef}, ` +
          `amount=${request.settlementAmount}. ` +
          `statusInfo=${request.statusInfo ?? 'none'}. ` +
          `CPO may need to manually capture the amount via PSP using the pspRef.`,
      );
    }

    // Store settlement data on the transaction if a transactionId is provided
    if (request.transactionId) {
      try {
        const settlementData: Record<string, unknown> = {
          pspRef: request.pspRef,
          status: request.status,
          settlementAmount: request.settlementAmount,
          settlementTime: request.settlementTime,
          statusInfo: request.statusInfo,
        };
        //Do NOT include receipt information for Rejected/Failed statuses
        if (isSettled) {
          settlementData.receiptId = request.receiptId;
          settlementData.receiptUrl = request.receiptUrl;
          settlementData.vatNumber = request.vatNumber;
        }

        // Fetch existing transaction to merge customData rather than overwrite it.
        // This preserves any existing customData fields (e.g., transactionLimit set by C23).
        const existingTransaction =
          await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
            tenantId,
            ocppConnectionName,
            request.transactionId,
          );
        const existingCustomData = existingTransaction?.customData ?? {};

        await this._transactionEventRepository.updateTransactionByStationIdAndTransactionId(
          tenantId,
          {
            customData: {
              ...existingCustomData,
              settlement: settlementData,
            },
          } as Partial<Transaction>,
          request.transactionId,
          ocppConnectionName,
        );
      } catch (error) {
        this._logger.error(
          `Failed to store settlement data for transaction ${request.transactionId}`,
          error,
        );
      }
    }

    const response: OCPP2_1.NotifySettlementResponse = {};

    // Only generate receiptUrl for successful (Settled) settlements.
    // Do NOT include receiptUrl or receiptId for Rejected/Failed statuses.
    if (isSettled) {
      try {
        const receiptByCSMSAttributes: VariableAttribute[] =
          await this._deviceModelRepository.readAllByQuerystring(tenantId, {
            tenantId,
            ocppConnectionName,
            component_name: 'PaymentCtrlr',
            variable_name: 'ReceiptByCSMS',
            type: AttributeEnum.Actual,
          });

        const receiptByCSMS =
          receiptByCSMSAttributes.length > 0 &&
          receiptByCSMSAttributes[0].value?.toLowerCase() === 'true';

        if (receiptByCSMS) {
          const receiptBaseUrl = this._config.modules.transactions.receiptBaseUrl;
          if (receiptBaseUrl) {
            const receiptId = request.transactionId
              ? `${ocppConnectionName}-${request.transactionId}-${request.pspRef}`
              : `${ocppConnectionName}-${request.pspRef}`;
            response.receiptUrl = `${receiptBaseUrl}/${encodeURIComponent(receiptId)}`;
            response.receiptId = receiptId;
            this._logger.info(`ReceiptByCSMS is true, generated receiptUrl=${response.receiptUrl}`);
          } else {
            this._logger.warn(
              'ReceiptByCSMS is true but no receiptBaseUrl configured in transactions module config. ' +
                'Cannot generate receiptUrl.',
            );
          }
        }
      } catch (error) {
        this._logger.error('Failed to read PaymentCtrlr.ReceiptByCSMS from device model', error);
      }
    }

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('NotifySettlementResponse'),
      messageConfirmation,
    );

    // After settlement, CSMS MAY send SetDisplayMessageRequest with receipt URL
    // to display on the charging station (e.g., as a QR code).
    const finalReceiptUrl = response.receiptUrl ?? request.receiptUrl;
    if (isSettled && finalReceiptUrl) {
      try {
        const displayMessageId = Date.now() % 2147483647; // Unique positive integer ID
        await this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: OCPPVersion.OCPP2_1,
          action: OCPP_CallAction.SetDisplayMessage,
          eventGroup: EventGroup.Transactions,
          payload: {
            message: {
              id: displayMessageId,
              priority: OCPP2_1.MessagePriorityEnumType.AlwaysFront,
              transactionId: request.transactionId,
              message: {
                format: OCPP2_1.MessageFormatEnumType.URI,
                content: finalReceiptUrl,
              },
            },
          } as OCPP2_1.SetDisplayMessageRequest,
        });
        this._logger.info(
          `Sent SetDisplayMessageRequest with receiptUrl=${finalReceiptUrl} to station ${ocppConnectionName}`,
        );
      } catch (error) {
        this._logger.error(
          `Failed to send SetDisplayMessageRequest to station ${ocppConnectionName}`,
          error,
        );
      }
    }
  }
}
