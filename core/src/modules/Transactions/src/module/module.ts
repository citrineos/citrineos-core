// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BootstrapConfig,
  CallAction,
  HandlerProperties,
  IAuthorizer,
  ICache,
  IFileStorage,
  IMessage,
  IMessageHandler,
  IMessageSender,
  MeterValueDto,
  OCPP2_request_types,
  OCPP2_response_types,
  SystemConfig,
} from '@citrineos/base';
import {
  AbstractModule,
  AsHandler,
  AttributeEnum,
  AuthorizationStatusEnum,
  CrudRepository,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  OCPP1_6,
  OCPP2_1,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OcppError,
  OCPPValidator,
  OCPPVersion,
  TariffSetStatusEnum,
  TransactionEventEnum,
} from '@citrineos/base';
import { sequelize } from '@dal/index.js';
import type {
  IAuthorizationRepository,
  IDeviceModelRepository,
  ILocationRepository,
  IOCPPMessageRepository,
  IReservationRepository,
  ITariffRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import { SequelizeOCPPMessageRepository } from '@dal/layers/sequelize/index.js';
import * as OCPP1_6_Mapper from '@dal/layers/sequelize/mapper/1.6/index.js';
import { Authorization } from '@dal/layers/sequelize/model/Authorization/index.js';
import { Component, VariableAttribute } from '@dal/layers/sequelize/model/DeviceModel/index.js';
import { Tariff } from '@dal/layers/sequelize/model/Tariff/Tariffs.js';
import {
  StartTransaction,
  Transaction,
} from '@dal/layers/sequelize/model/TransactionEvent/index.js';
import { SequelizeRepository } from '@dal/layers/sequelize/repository/Base.js';
import { RealTimeAuthorizer } from '@util/authorizer/RealTimeAuthorizer.js';
import { SignedMeterValuesUtil } from '@util/security/SignedMeterValuesUtil.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { CostCalculator } from './CostCalculator.js';
import { CostNotifier } from './CostNotifier.js';
import { StatusNotificationService } from './StatusNotificationService.js';
import { TransactionService } from './TransactionService.js';

/**
 * Component that handles transaction related messages.
 */
export class TransactionsModule extends AbstractModule {
  _requests: CallAction[] = [];

  _responses: CallAction[] = [];
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _authorizeRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _componentRepository: CrudRepository<Component>;
  protected _locationRepository: ILocationRepository;
  protected _tariffRepository: ITariffRepository;
  protected _reservationRepository: IReservationRepository;
  protected _ocppMessageRepository: IOCPPMessageRepository;

  protected _transactionService: TransactionService;
  protected _statusNotificationService: StatusNotificationService;

  protected _fileStorage: IFileStorage;

  private readonly _authorizers: IAuthorizer[];
  private readonly _realTimeAuthorizer: IAuthorizer;

  private readonly _signedMeterValuesUtil: SignedMeterValuesUtil;
  private _costNotifier: CostNotifier;
  private _costCalculator: CostCalculator;

  private readonly _sendCostUpdatedOnMeterValue: boolean | undefined;
  private readonly _costUpdatedInterval: number | undefined;

  /**
   * This is the constructor function that initializes the {@link TransactionsModule}.
   *
   * @param {BootstrapConfig & SystemConfig} config - The `config` contains configuration settings for the module.
   *
   * @param {ICache} [cache] - The cache instance which is shared among the modules & Central System to pass information such as blacklisted actions or boot status.
   *
   * @param {IFileStorage} [fileStorage] - The `fileStorage` allows access to the configured file storage.
   *
   * @param {IMessageSender} [sender] - The `sender` parameter is an optional parameter that represents an instance of the {@link IMessageSender} interface.
   * It is used to send messages from the central system to external systems or devices. If no `sender` is provided, a default {@link RabbitMqSender} instance is created and used.
   *
   * @param {IMessageHandler} [handler] - The `handler` parameter is an optional parameter that represents an instance of the {@link IMessageHandler} interface.
   * It is used to handle incoming messages and dispatch them to the appropriate methods or functions. If no `handler` is provided, a default {@link RabbitMqReceiver} instance is created and used.
   *
   * @param {Logger<ILogObj>} [logger] - The `logger` parameter is an optional parameter that represents an instance of {@link Logger<ILogObj>}.
   * It is used to propagate system-wide logger settings and will serve as the parent logger for any sub-component logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
   *
   * @param {ITransactionEventRepository} [transactionEventRepository] - An optional parameter of type {@link ITransactionEventRepository} which represents a repository for accessing and manipulating transaction event data.
   * If no `transactionEventRepository` is provided, a default {@link sequelize:transactionEventRepository} instance
   * is created and used.
   *
   * @param {IAuthorizationRepository} [authorizeRepository] - An optional parameter of type {@link IAuthorizationRepository} which represents a repository for accessing and manipulating authorization data.
   * If no `authorizeRepository` is provided, a default {@link sequelize:authorizeRepository} instance is
   * created and used.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable attribute data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is
   * created and used.
   *
   * @param {CrudRepository<Component>} [componentRepository] - An optional parameter of type {@link CrudRepository<Component>} which represents a repository for accessing and manipulating component data.
   * If no `componentRepository` is provided, a default {@link sequelize:componentRepository} instance is
   * created and used.
   *
   * @param {ILocationRepository} [locationRepository] - An optional parameter of type {@link ILocationRepository} which represents a repository for accessing and manipulating location and charging station data.
   * If no `locationRepository` is provided, a default {@link sequelize:locationRepository} instance is
   * created and used.
   *
   * @param {CrudRepository<Component>} [componentRepository] - An optional parameter of type {@link CrudRepository<Component>} which represents a repository for accessing and manipulating component data.
   * If no `componentRepository` is provided, a default {@link sequelize:componentRepository} instance is
   * created and used.
   *
   * @param {ILocationRepository} [locationRepository] - An optional parameter of type {@link ILocationRepository} which represents a repository for accessing and manipulating location and charging station data.
   * If no `locationRepository` is provided, a default {@link sequelize:locationRepository} instance is
   * created and used.
   *
   * @param {ITariffRepository} [tariffRepository] - An optional parameter of type {@link ITariffRepository} which
   * represents a repository for accessing and manipulating tariff data.
   * If no `tariffRepository` is provided, a default {@link sequelize:tariffRepository} instance is
   * created and used.
   *
   * @param {IReservationRepository} [reservationRepository] - An optional parameter of type {@link IReservationRepository}
   * which represents a repository for accessing and manipulating reservation data.
   * If no `reservationRepository` is provided, a default {@link sequelize:reservationRepository} instance is created and used.
   *
   * @param {IOCPPMessageRepository} [ocppMessageRepository] - An optional parameter of type {@link IOCPPMessageRepository}
   * which represents a repository for accessing and manipulating OCPP Message data.
   * If no `ocppMessageRepository` is provided, a default {@link sequelize:ocppMessageRepository} instance is created and used.
   *
   * @param {IAuthorizer[]} [authorizers] - An optional parameter of type {@link IAuthorizer[]} which represents
   * a list of authorizers that can be used to authorize requests.
   *
   * @param {IAuthorizer} [realTimeAuthorizer] - An optional parameter of type {@link IAuthorizer} which represents
   * a real-time authorizer that can be used to authorize real-time requests.
   */
  constructor(
    config: BootstrapConfig & SystemConfig,
    cache: ICache,
    fileStorage: IFileStorage,
    sender: IMessageSender,
    handler: IMessageHandler,
    logger?: Logger<ILogObj>,
    ocppValidator?: OCPPValidator,
    transactionEventRepository?: ITransactionEventRepository,
    authorizeRepository?: IAuthorizationRepository,
    deviceModelRepository?: IDeviceModelRepository,
    componentRepository?: CrudRepository<Component>,
    locationRepository?: ILocationRepository,
    tariffRepository?: ITariffRepository,
    reservationRepository?: IReservationRepository,
    ocppMessageRepository?: IOCPPMessageRepository,
    realTimeAuthorizer?: IAuthorizer,
    authorizers?: IAuthorizer[],
  ) {
    super(config, cache, handler, sender, EventGroup.Transactions, logger, ocppValidator);

    this._requests = config.modules.transactions.requests;
    this._responses = config.modules.transactions.responses;

    this._fileStorage = fileStorage;

    this._transactionEventRepository =
      transactionEventRepository ||
      new sequelize.SequelizeTransactionEventRepository(config, logger);
    this._authorizeRepository =
      authorizeRepository || new sequelize.SequelizeAuthorizationRepository(config, logger);
    this._deviceModelRepository =
      deviceModelRepository || new sequelize.SequelizeDeviceModelRepository(config, logger);
    this._componentRepository =
      componentRepository ||
      new SequelizeRepository<Component>(config, Component.MODEL_NAME, logger);
    this._locationRepository =
      locationRepository || new sequelize.SequelizeLocationRepository(config, logger);
    this._tariffRepository =
      tariffRepository || new sequelize.SequelizeTariffRepository(config, logger);
    this._reservationRepository =
      reservationRepository || new sequelize.SequelizeReservationRepository(config, logger);
    this._ocppMessageRepository =
      ocppMessageRepository || new SequelizeOCPPMessageRepository(config, this._logger);

    this._authorizers = authorizers || [];
    this._realTimeAuthorizer =
      realTimeAuthorizer ||
      new RealTimeAuthorizer(this._locationRepository, this.config, this._logger);

    this._signedMeterValuesUtil = new SignedMeterValuesUtil(fileStorage, config, this._logger);

    this._sendCostUpdatedOnMeterValue = config.modules.transactions.sendCostUpdatedOnMeterValue;
    this._costUpdatedInterval = config.modules.transactions.costUpdatedInterval;

    this._transactionService = new TransactionService(
      this._transactionEventRepository,
      this._authorizeRepository,
      this._locationRepository,
      this._reservationRepository,
      this._ocppMessageRepository,
      this._realTimeAuthorizer,
      this._authorizers,
      this._logger,
    );

    this._statusNotificationService = new StatusNotificationService(
      this._componentRepository,
      this._deviceModelRepository,
      this._locationRepository,
      this._cache,
      this._logger,
    );

    this._costCalculator = new CostCalculator(
      this._tariffRepository,
      this._transactionService,
      this._logger,
    );

    this._costNotifier = new CostNotifier(
      this,
      this._transactionEventRepository,
      this._costCalculator,
      this._logger,
    );
  }

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get authorizeRepository(): IAuthorizationRepository {
    return this._authorizeRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  get tariffRepository(): ITariffRepository {
    return this._tariffRepository;
  }

  get ocppMessageRepository(): IOCPPMessageRepository {
    return this._ocppMessageRepository;
  }

  /**
   * Handle OCPP 2.x requests
   */

  //TODO: Need additional handling for OCPP 2.1 as we need to extend the transaction service for ocpp 2.1
  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.TransactionEvent)
  protected async _handleTransactionEvent(
    message: IMessage<OCPP2_request_types.TransactionEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Transaction event received:', message, props);
    const tenantId: number = message.context.tenantId;
    const stationId: string = message.context.stationId;

    const transactionEvent = message.payload;
    const transactionId = transactionEvent.transactionInfo.transactionId;
    let response: OCPP2_response_types.TransactionEventResponse | undefined = undefined;
    let transaction: Transaction | undefined = undefined;
    if (transactionEvent.idToken) {
      if (message.protocol === OCPPVersion.OCPP2_1) {
        response = await this._transactionService.authorizeOcpp21IdToken(
          tenantId,
          transactionEvent,
          message.context,
        );
      } else {
        response = await this._transactionService.authorizeOcpp201IdToken(
          tenantId,
          transactionEvent,
          message.context,
        );
      }
    }
    try {
      transaction =
        await this._transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
          tenantId,
          message.payload,
          stationId,
        );
    } catch (error) {
      if ((error as any).name === 'SequelizeForeignKeyConstraintError') {
        await this.sendCallErrorWithMessage(
          message,
          new OcppError(
            message.context.correlationId,
            ErrorCode.PropertyConstraintViolation,
            'Referenced entity does not exist.',
          ),
        );
        return;
      }
      throw error;
    }
    if (message.payload.reservationId) {
      await this._transactionService.deactivateReservation(
        tenantId,
        transactionId,
        message.payload.reservationId,
        stationId,
      );
    }
    await this.deactivateOtherActiveTransactionsAtEvse201(
      tenantId,
      transactionId,
      stationId,
      transactionEvent,
    );

    if (response) {
      // For DirectPayment tokens on Started events, include transactionLimit
      // based on PaymentCtrlr.AuthorizationAmount from the device model.
      if (
        transactionEvent.eventType === TransactionEventEnum.Started &&
        response.idTokenInfo?.status === AuthorizationStatusEnum.Accepted &&
        message.protocol === OCPPVersion.OCPP2_1 &&
        transactionEvent.idToken?.type === OCPP2_1.IdTokenEnumType.DirectPayment
      ) {
        try {
          const authAmountAttributes: VariableAttribute[] =
            await this._deviceModelRepository.readAllByQuerystring(tenantId, {
              tenantId,
              stationId,
              component_name: 'PaymentCtrlr',
              variable_name: 'AuthorizationAmount',
              type: AttributeEnum.Actual,
            });

          if (authAmountAttributes.length > 0 && authAmountAttributes[0].value) {
            const authorizationAmount = parseFloat(authAmountAttributes[0].value);
            if (!isNaN(authorizationAmount) && authorizationAmount > 0) {
              const ocpp21Response = response as OCPP2_1.TransactionEventResponse;
              // Only set if not already set by another flow (e.g., C17 prepaid)
              if (!ocpp21Response.transactionLimit) {
                ocpp21Response.transactionLimit = {
                  maxCost: authorizationAmount,
                };
                this._logger.info(
                  `Set transactionLimit.maxCost=${authorizationAmount} for DirectPayment ` +
                    `token on station ${stationId}, transaction ${transactionId}.`,
                );
              }
            }
          }
        } catch (error) {
          this._logger.error(
            'Failed to read PaymentCtrlr.AuthorizationAmount from device model',
            error,
          );
        }
      }

      const messageConfirmation = await this.sendCallResultWithMessage(message, response);
      this._logger.debug('Transaction response sent: ', messageConfirmation);
      // If the transaction is accepted and interval is set, start the cost update
      if (
        transactionEvent.eventType === TransactionEventEnum.Started &&
        response.idTokenInfo?.status === AuthorizationStatusEnum.Accepted &&
        this._costUpdatedInterval
      ) {
        this._costNotifier.notifyWhileActive(
          stationId,
          transactionId,
          message.context.tenantId,
          this._costUpdatedInterval,
        );
      }
    } else {
      const response: OCPP2_response_types.TransactionEventResponse = {
        // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
      };

      if (message.payload.eventType === TransactionEventEnum.Updated) {
        // I02 - Show EV Driver Running Total Cost During Charging
        if (
          transaction &&
          transaction.isActive &&
          transaction.totalKwh &&
          this._sendCostUpdatedOnMeterValue
        ) {
          response.totalCost = await this._costCalculator.calculateTotalCost(
            tenantId,
            transaction.connectorId,
            transaction.totalKwh,
          );
        }

        // C23: Increasing authorization amount
        // When CS sends TransactionEventRequest(Updated) with triggerReason=LimitSet (OCPP 2.1),
        // it indicates the authorization amount has been increased and transactionLimit.maxCost updated.
        if (message.protocol === OCPPVersion.OCPP2_1 && transaction && transaction.isActive) {
          const ocpp21Payload = message.payload as unknown as OCPP2_1.TransactionEventRequest;
          if (
            ocpp21Payload.triggerReason === OCPP2_1.TriggerReasonEnumType.LimitSet &&
            ocpp21Payload.transactionInfo?.transactionLimit?.maxCost != null
          ) {
            const newMaxCost = ocpp21Payload.transactionInfo.transactionLimit.maxCost;
            this._logger.info(
              `Authorization amount increased for station ${stationId}, ` +
                `transaction ${transactionId}. New maxCost=${newMaxCost}.`,
            );

            // Store the updated maxCost in customData
            try {
              const existingCustomData = transaction.customData ?? {};
              await this._transactionEventRepository.updateTransactionByStationIdAndTransactionId(
                tenantId,
                {
                  customData: {
                    ...existingCustomData,
                    transactionLimit: {
                      ...(existingCustomData.transactionLimit ?? {}),
                      maxCost: newMaxCost,
                    },
                  },
                } as Partial<Transaction>,
                transactionId,
                stationId,
              );
            } catch (error) {
              this._logger.error(
                `Failed to store updated maxCost for transaction ${transactionId}`,
                error,
              );
            }
          }
        }

        // I06 - Update Tariff Information During Transaction
        const tariffAvailableAttributes: VariableAttribute[] =
          await this._deviceModelRepository.readAllByQuerystring(tenantId, {
            tenantId,
            stationId: stationId,
            component_name: 'TariffCostCtrlr',
            variable_instance: 'Tariff',
            variable_name: 'Available',
            type: AttributeEnum.Actual,
          });
        const supportTariff: boolean =
          tariffAvailableAttributes.length !== 0 && Boolean(tariffAvailableAttributes[0].value);

        if (supportTariff && transaction && transaction.isActive) {
          this._logger.debug(
            `Checking if updated tariff information is available for traction ${transaction.transactionId}`,
          );
          // TODO: checks if there is updated tariff information available and set it in the PersonalMessage field.
        }
      }

      if (message.payload.eventType === TransactionEventEnum.Ended && transaction.totalKwh) {
        response.totalCost = await this._costCalculator.calculateTotalCost(
          tenantId,
          transaction.connectorId,
          transaction.totalKwh,
        );
      }

      // Store total cost in db
      if (response.totalCost && transaction) {
        await this._transactionEventRepository.updateTransactionTotalCostById(
          tenantId,
          response.totalCost,
          transaction.id,
        );
      }

      // C21.FR.05/FR.06: If SettlementByCSMS is true and transaction ended, CSMS should settle with PSP
      if (message.payload.eventType === TransactionEventEnum.Ended && transaction) {
        try {
          const settlementByCSMSAttributes: VariableAttribute[] =
            await this._deviceModelRepository.readAllByQuerystring(tenantId, {
              tenantId,
              stationId,
              component_name: 'PaymentCtrlr',
              variable_name: 'SettlementByCSMS',
              type: AttributeEnum.Actual,
            });

          const settlementByCSMS =
            settlementByCSMSAttributes.length > 0 &&
            settlementByCSMSAttributes[0].value?.toLowerCase() === 'true';

          if (settlementByCSMS) {
            const totalCost = response.totalCost ?? transaction.totalCost;
            this._logger.info(
              `C21.FR.05: SettlementByCSMS is true for station ${stationId}, ` +
                `transaction ${transaction.transactionId}. ` +
                `CSMS should settle totalCost=${totalCost} with PSP. ` +
                `This requires external PSP integration.`,
            );
            // PSP settlement integration point:
            // Implementers should extend this to call their PSP API to settle
            // the payment using the pspRef from the authorization's idToken.
          }
        } catch (error) {
          this._logger.error(
            'Failed to check PaymentCtrlr.SettlementByCSMS from device model',
            error,
          );
        }
      }

      if (transactionEvent.meterValue) {
        const meterValuesValid = await this._signedMeterValuesUtil.validateMeterValues(
          tenantId,
          stationId,
          transactionEvent.meterValue,
        );

        if (!meterValuesValid) {
          this._logger.warn(
            'One or more MeterValues in this TransactionEvent have an invalid signature.',
          );
        }
      }

      const messageConfirmation = await this.sendCallResultWithMessage(message, response);
      this._logger.debug('Transaction response sent: ', messageConfirmation);
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.MeterValues)
  protected async _handleMeterValues(
    message: IMessage<OCPP2_request_types.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('MeterValues received:', message, props);

    // TODO: Meter values can be triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    const meterValues = message.payload.meterValue;
    const tenantId = message.context.tenantId;
    const stationId = message.context.stationId;
    const evseId = message.payload.evseId;

    // When evseId is 0, the MeterValuesRequest message SHALL be associated with the entire Charging Station.
    if (this._sendCostUpdatedOnMeterValue && evseId !== 0) {
      const activeTransaction: Transaction | undefined =
        await this.transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
          tenantId,
          stationId,
          evseId,
        );
      if (!activeTransaction) {
        this._logger.error(
          'Active Transaction not found on charging station {} evse {}',
          stationId,
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
        );
      }
    } else {
      await this._transactionService.createMeterValues(tenantId, meterValues);
    }

    const meterValuesValid = await this._signedMeterValuesUtil.validateMeterValues(
      tenantId,
      stationId,
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

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('MeterValues response sent: ', messageConfirmation);
  }

  //TODO: Need a meter event handler for OCPP 2.1 as we need to tweak or extend the transaction service for ocpp 2.1 (meter helper method is dependent on service)

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.StatusNotification)
  protected async _handleStatusNotification(
    message: IMessage<OCPP2_request_types.StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('StatusNotification received:', message, props);

    this._statusNotificationService
      .processStatusNotification(
        message.context.tenantId,
        message.context.stationId,
        message.payload,
      )
      .catch((error) => {
        this._logger.error('Failed to process status notification', error);
      });

    // Create response
    const response: OCPP2_response_types.StatusNotificationResponse = {};
    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('StatusNotification response sent: ', messageConfirmation);
  }

  /**
   * Handle OCPP 2.x common responses
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.CostUpdated)
  protected _handleCostUpdated(
    message: IMessage<OCPP2_response_types.CostUpdatedResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('CostUpdated response received:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetTransactionStatus)
  protected async _handleGetTransactionStatus(
    message: IMessage<OCPP2_response_types.GetTransactionStatusResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetTransactionStatus response received:', message, props);

    const response = message.payload;
    if (response.ongoingIndicator !== null && response.ongoingIndicator !== undefined) {
      await this._transactionService.updateTransactionStatus(
        message.context.tenantId,
        message.context.stationId,
        message.context.correlationId,
        response.ongoingIndicator,
      );
    }
  }

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
  @AsHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.NotifySettlement)
  protected async _handleNotifySettlement(
    message: IMessage<OCPP2_1.NotifySettlementRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifySettlementRequest received:', message, props);

    const tenantId = message.context.tenantId;
    const stationId = message.context.stationId;
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
        `Settlement ${request.status} for station ${stationId}, ` +
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
        await this._transactionEventRepository.updateTransactionByStationIdAndTransactionId(
          tenantId,
          {
            customData: {
              settlement: settlementData,
            },
          } as Partial<Transaction>,
          request.transactionId,
          stationId,
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
            stationId,
            component_name: 'PaymentCtrlr',
            variable_name: 'ReceiptByCSMS',
            type: AttributeEnum.Actual,
          });

        const receiptByCSMS =
          receiptByCSMSAttributes.length > 0 &&
          receiptByCSMSAttributes[0].value?.toLowerCase() === 'true';

        if (receiptByCSMS) {
          const receiptBaseUrl = this.config.modules.transactions.receiptBaseUrl;
          if (receiptBaseUrl) {
            const receiptId = request.transactionId
              ? `${stationId}-${request.transactionId}-${request.pspRef}`
              : `${stationId}-${request.pspRef}`;
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

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('NotifySettlement response sent:', messageConfirmation);

    // After settlement, CSMS MAY send SetDisplayMessageRequest with receipt URL
    // to display on the charging station (e.g., as a QR code).
    const finalReceiptUrl = response.receiptUrl ?? request.receiptUrl;
    if (isSettled && finalReceiptUrl) {
      try {
        const displayMessageId = Date.now() % 2147483647; // Unique positive integer ID
        await this.sendCall(
          stationId,
          tenantId,
          OCPPVersion.OCPP2_1,
          OCPP_CallAction.SetDisplayMessage,
          {
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
        );
        this._logger.info(
          `Sent SetDisplayMessageRequest with receiptUrl=${finalReceiptUrl} to station ${stationId}`,
        );
      } catch (error) {
        this._logger.error(
          `Failed to send SetDisplayMessageRequest to station ${stationId}`,
          error,
        );
      }
    }
  }

  /**
   * Handle OCPP 1.6 requests
   */

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StatusNotification)
  protected async _handleOcpp16StatusNotification(
    message: IMessage<OCPP1_6.StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('StatusNotification request received:', message, props);

    await this._statusNotificationService.processOcpp16StatusNotification(
      message.context.tenantId,
      message.context.stationId,
      message.payload,
    );

    // Create response
    const response: OCPP1_6.StatusNotificationResponse = {};
    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('StatusNotification response sent: ', messageConfirmation);
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.MeterValues)
  protected async _handleOcpp16MeterValues(
    message: IMessage<OCPP1_6.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('MeterValues request received:', message, props);

    const tenantId = message.context.tenantId;
    const stationId = message.context.stationId;
    const connectorId = message.payload.connectorId;
    const transactionId = message.payload.transactionId;
    const meterValues = message.payload.meterValue;

    if (connectorId !== 0 && transactionId && meterValues.length > 0) {
      try {
        const meterValueEntities: MeterValueDto[] = [];
        for (const meterValue of meterValues) {
          if (meterValue.sampledValue && meterValue.sampledValue.length > 0) {
            const meterValueEntity = OCPP1_6_Mapper.MeterValueMapper.fromMeterValueType(meterValue);
            meterValueEntity.tenantId = tenantId;
            meterValueEntity.connectorId = connectorId;
            meterValueEntities.push(meterValueEntity);
          }
        }
        if (meterValueEntities.length > 0) {
          await this._transactionEventRepository.updateTransactionByMeterValues(
            tenantId,
            meterValueEntities,
            stationId,
            transactionId,
          );
        }
      } catch (e) {
        this._logger.error(`Failed to process MeterValues.`, e);
      }
    }

    await this.sendCallResultWithMessage(message, {} as OCPP1_6.MeterValuesResponse);
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StartTransaction)
  protected async _handleOcpp16StartTransaction(
    message: IMessage<OCPP1_6.StartTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 StartTransaction request received:', message, props);
    const tenantId = message.context.tenantId;
    const stationId = message.context.stationId;
    const request = message.payload;

    // Authorize
    const response = await this._transactionService.authorizeOcpp16IdToken(
      message.context,
      request.idTag,
      request.connectorId,
    );

    // Send response to charger
    if (response.idTagInfo.status !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
      await this.sendCallResultWithMessage(message, response);
    } else {
      try {
        // Create transaction
        const newTransaction =
          await this._transactionEventRepository.createTransactionByStartTransaction(
            tenantId,
            request,
            stationId,
          );
        response.transactionId = parseInt(newTransaction.transactionId);
      } catch (error) {
        const errorMessage = (error as Error).message || '';
        if (errorMessage.includes('Charging station') && errorMessage.includes('does not exist')) {
          this._logger.error(
            `Charging station ${stationId} does not exist for idTag ${request.idTag}`,
          );
        } else {
          this._logger.error(`Failed to create transaction for idTag ${request.idTag}`, error);
        }
        response.idTagInfo = {
          status: OCPP1_6.StartTransactionResponseStatus.Invalid,
        };
      }
      await this.sendCallResultWithMessage(message, response);
    }

    await this.deactivateOtherActiveTransactionsAtEvse16(
      tenantId,
      response.transactionId.toString(),
      stationId,
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
        stationId,
      );
    }
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.StopTransaction)
  protected async _handleOcpp16StopTransaction(
    message: IMessage<OCPP1_6.StopTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 StopTransaction request received:', message, props);

    const tenantId = message.context.tenantId;
    const stationId = message.context.stationId;
    const request = message.payload;

    const authorization: Authorization | undefined = request.idTag
      ? await this._authorizeRepository.readOnlyOneByQuerystring(tenantId, {
          idToken: request.idTag,
        })
      : undefined;

    let idTokenInfoStatus = authorization?.status;
    if (authorization === undefined && request.idTag) {
      // Unknown idTag, fallback to Invalid
      idTokenInfoStatus = 'Invalid';
    }
    switch (idTokenInfoStatus) {
      case AuthorizationStatusEnum.Accepted:
      case AuthorizationStatusEnum.Blocked:
      case AuthorizationStatusEnum.Expired:
      case AuthorizationStatusEnum.ConcurrentTx:
      case AuthorizationStatusEnum.Invalid:
        break;
      default: // Other OCPP 2.0.1 statuses default to Invalid for OCPP 1.6
        idTokenInfoStatus = AuthorizationStatusEnum.Invalid;
    }

    let parentIdTag: string | undefined = undefined;
    if (authorization?.groupAuthorizationId) {
      const parentAuth = await this._authorizeRepository.readOnlyOneByQuery(tenantId, {
        where: { id: authorization.groupAuthorizationId },
      });
      if (parentAuth) {
        parentIdTag = parentAuth.idToken;
      }
    }

    const stopTransactionResponse: OCPP1_6.StopTransactionResponse = {
      ...(request.idTag
        ? {
            idTagInfo: {
              expiryDate: authorization?.cacheExpiryDateTime,
              parentIdTag,
              status: idTokenInfoStatus as unknown as OCPP1_6.StopTransactionResponseStatus,
            },
          }
        : {}),
    };

    await this.sendCallResultWithMessage(message, stopTransactionResponse);

    const transaction = await Transaction.findOne({
      where: {
        stationId,
        tenantId,
        transactionId: request.transactionId.toString(),
      },
      include: [StartTransaction],
    });

    if (!transaction) {
      this._logger.error(`Transaction ${request.transactionId} not found.`);
      return;
    }

    const stopTransaction = await this._transactionEventRepository.createStopTransaction(
      tenantId,
      transaction.id,
      stationId,
      request.meterStop,
      new Date(request.timestamp),
      request.transactionData?.map((data) =>
        OCPP1_6_Mapper.MeterValueMapper.fromMeterValueType(
          data as OCPP1_6.MeterValuesRequest['meterValue'][0],
        ),
      ) || [],
      request.reason || (request.idTag ? 'Remote' : 'Local'),
      authorization?.id,
    );

    if (!stopTransaction) {
      this._logger.error(
        `Failed to create StopTransaction record for transaction ${request.transactionId}`,
      );
    }

    if (transaction.startTransaction) {
      transaction.totalKwh = (request.meterStop - transaction.startTransaction.meterStart) / 1000; // Convert from Wh to kWh
    } else {
      this._logger.warn(
        `StartTransaction record not found at station ${stationId} for transactionId ${request.transactionId}. 
        Cannot calculate totalKwh.`,
      );
    }
    transaction.isActive = false;
    transaction.stoppedReason = request.reason;
    transaction.endTime = request.timestamp;
    await transaction.save();
  }

  /**
   * Handle OCPP 2.1 responses
   */
  @AsHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.SetDefaultTariff)
  protected async _handleSetDefaultTariff(
    message: IMessage<OCPP2_1.SetDefaultTariffResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 2.1 SetDefaultTariff response received:', message, props);

    if (message.payload.status !== TariffSetStatusEnum.Accepted) {
      this._logger.warn(
        `SetDefaultTariff rejected for station ${message.context.stationId}: ${message.payload.status}`,
      );
      return;
    }

    const tenantId = message.context.tenantId;
    const stationId = message.context.stationId;

    const storedRequest = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        tenantId,
        stationId,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });

    if (!storedRequest) {
      this._logger.error(
        `No SetDefaultTariffRequest found for correlationId ${message.context.correlationId} on station ${stationId}`,
      );
      return;
    }

    const request = storedRequest.message[3] as OCPP2_1.SetDefaultTariffRequest;
    const tariffData = request.tariff;

    const newTariff = Tariff.build({
      tenantId,
      currency: tariffData.currency,
      pricePerKwh: 0,
      tariffId: tariffData.tariffId,
      validFrom: tariffData.validFrom ?? undefined,
      description: tariffData.description ?? undefined,
      energy: tariffData.energy ?? undefined,
      chargingTime: tariffData.chargingTime ?? undefined,
      idleTime: tariffData.idleTime ?? undefined,
      fixedFee: tariffData.fixedFee ?? undefined,
      reservationTime: tariffData.reservationTime ?? undefined,
      reservationFixed: tariffData.reservationFixed ?? undefined,
      minCost: tariffData.minCost ?? undefined,
      maxCost: tariffData.maxCost ?? undefined,
    });

    const storedTariff = await this._tariffRepository.upsertTariffByTariffId(tenantId, newTariff);
    this._logger.info(`Tariff ${storedTariff.id} stored for station ${stationId}`);
  }

  protected async deactivateOtherActiveTransactionsAtEvse201(
    tenantId: number,
    transactionId: string,
    stationId: string,
    request: OCPP2_request_types.TransactionEventRequest,
  ) {
    const eventType = request.eventType;
    const evse = request.evse;
    const evseIsDefined = evse !== null && evse !== undefined;
    if (evseIsDefined) {
      if (
        eventType === TransactionEventEnum.Started ||
        eventType === TransactionEventEnum.Updated
      ) {
        await this._transactionService.deactivateOtherActiveTransactionsAtEvse(
          tenantId,
          transactionId,
          stationId,
          evse,
        );
      }
    }
  }

  protected async deactivateOtherActiveTransactionsAtEvse16(
    tenantId: number,
    transactionId: string,
    stationId: string,
    request: OCPP1_6.StartTransactionRequest,
  ) {
    const connector = await this._locationRepository.readConnectorByStationIdAndOcpp16ConnectorId(
      tenantId,
      stationId,
      request.connectorId,
    );
    if (!connector) {
      this._logger.error(`Unable to find connector ${request.connectorId}.`);
      throw new Error(`Unable to find connector ${request.connectorId}.`);
    }
    await this._transactionService.deactivateOtherActiveTransactionsAtEvse(
      tenantId,
      transactionId,
      stationId,
      request.connectorId,
    );
  }
}
