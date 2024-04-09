// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AsHandler,
  BaseModule,
  CacheService,
  CallAction,
  CostUpdatedResponse,
  EventGroup,
  GetTransactionStatusResponse,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  inject,
  injectable,
  LoggerService,
  MeterValuesRequest,
  MeterValuesResponse,
  StatusNotificationRequest,
  StatusNotificationResponse,
  SystemConfig,
  SystemConfigService,
  TransactionEventRequest,
} from "@citrineos/base";
import {RabbitMqReceiver, RabbitMqSender, Timer} from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import {ILogObj, Logger} from 'tslog';
import {TransactionEventService} from "./services/transaction.event.service";
import {DeviceModelRepository, TariffRepository} from "@citrineos/data";
import {
  AuthorizationRepository,
  IAuthorizationRepository,
  ITransactionEventRepository,
  sequelize,
  TransactionEventRepository
  IAuthorizationRepository,
  IDeviceModelRepository,
  ITariffRepository,
  ITransactionEventRepository,
  MeterValue,
  sequelize,
  Tariff,
  Transaction,
  VariableAttribute
} from "@citrineos/data";

/**
 * Component that handles transaction related messages.
 */
@injectable()
export class TransactionsModule extends BaseModule {

  protected _requests: CallAction[] = [
    CallAction.MeterValues,
    CallAction.StatusNotification,
    CallAction.TransactionEvent
  ];
  protected _responses: CallAction[] = [
    CallAction.CostUpdated,
    CallAction.GetTransactionStatus
  ];

  /**
   * This is the constructor function that initializes the {@link TransactionModule}.
   *
   *
   *
   * It is used to send messages from the central system to external systems or devices. If no `sender` is provided, a default {@link RabbitMqSender} instance is created and used.
   *
   * It is used to handle incoming messages and dispatch them to the appropriate methods or functions. If no `handler` is provided, a default {@link RabbitMqReceiver} instance is created and used.
   *
   * It is used to propagate system wide logger settings and will serve as the parent logger for any sub-component logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
   *
   * If no `transactionEventRepository` is provided, a default {@link sequelize:transactionEventRepository} instance
   * is created and used.
   * If no `authorizeRepository` is provided, a default {@link sequelize:authorizeRepository} instance is
   * created and used.
   *
   * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is
   * created and used.
   *
   * represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:tariffRepository} instance is
   * created and used.
   * @param configService
   * @param cacheService
   * @param loggerService
   * @param rabbitMqSender
   * @param rabbitMqReceiver
   * @param transactionEventService
   */
  constructor(
      @inject(SystemConfigService) private readonly configService?: SystemConfigService,
      @inject(CacheService) private readonly cacheService?: CacheService,
      @inject(LoggerService) private readonly loggerService?: LoggerService,
      @inject(RabbitMqSender) private readonly rabbitMqSender?: RabbitMqSender,
      @inject(RabbitMqReceiver) private readonly rabbitMqReceiver?: RabbitMqReceiver,
      @inject(TransactionEventService) private readonly transactionEventService?: TransactionEventService
  ) {
    super(configService?.systemConfig!, cacheService?.cache!, rabbitMqReceiver!, rabbitMqSender!, EventGroup.Transactions, loggerService?.logger!);

    const timer = new Timer();
    this._logger.info(`Initializing...`);

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error("Could not initialize module due to failure in handler initialization.");
    }

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  /**
   * Handle requests
   */

  @AsHandler(CallAction.TransactionEvent)
  protected async _handleTransactionEvent(
    message: IMessage<TransactionEventRequest>,
    props?: HandlerProperties
  ): Promise<void> {
    await this.transactionEventService?.handleTransactionEvent(message, props);
  }

  @AsHandler(CallAction.MeterValues)
  protected async _handleMeterValues(
    message: IMessage<MeterValuesRequest>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("MeterValues received:", message, props);

    // TODO: Add meterValues to transactions
    // TODO: Meter values can be triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message
    // TODO: If sendCostUpdatedOnMeterValue is true, meterValues handler triggers cost update
    //  when it is added into a transaction

    const response: MeterValuesResponse = {
      // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
    };

    this.sendCallResultWithMessage(message, response).then(messageConfirmation => {
      this._logger.debug("MeterValues response sent: ", messageConfirmation)
    })
  }

  @AsHandler(CallAction.StatusNotification)
  protected _handleStatusNotification(
    message: IMessage<StatusNotificationRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug("StatusNotification received:", message, props);

    // Create response
    const response: StatusNotificationResponse = {};

    this.sendCallResultWithMessage(message, response)
        .then(messageConfirmation => {
          this._logger.debug("StatusNotification response sent: ", messageConfirmation)
        });
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.CostUpdated)
  protected _handleCostUpdated(
    message: IMessage<CostUpdatedResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("CostUpdated response received:", message, props);
  }

  @AsHandler(CallAction.GetTransactionStatus)
  protected _handleGetTransactionStatus(
    message: IMessage<GetTransactionStatusResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("GetTransactionStatus response received:", message, props);
  }

}
