// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  CallAction,
  CrudRepository,
  ErrorCode,
  EventGroup,
  HandlerProperties,
  ICache,
  IFileStorage,
  IMessage,
  IMessageHandler,
  IMessageSender,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OcppError,
  OCPPVersion,
  SystemConfig,
} from '@citrineos/base';
import {
  Component,
  IAuthorizationRepository,
  IDeviceModelRepository,
  ILocationRepository,
  IReservationRepository,
  ITariffRepository,
  ITransactionEventRepository,
  MeterValue,
  sequelize,
  SequelizeRepository,
  Transaction,
  VariableAttribute,
} from '@citrineos/data';
import {
  IAuthorizer,
  RabbitMqReceiver,
  RabbitMqSender,
  SignedMeterValuesUtil,
} from '@citrineos/util';
import { ILogObj, Logger } from 'tslog';
import { TransactionService } from './TransactionService';
import { StatusNotificationService } from './StatusNotificationService';
import { CostNotifier } from './CostNotifier';
import { CostCalculator } from './CostCalculator';

/**
 * Component that handles transaction related messages.
 */
export class TransactionsModule extends AbstractModule {
  _requests: CallAction[] = [
    OCPP2_0_1_CallAction.MeterValues,
    OCPP2_0_1_CallAction.StatusNotification,
    OCPP2_0_1_CallAction.TransactionEvent,
    OCPP1_6_CallAction.MeterValues,
    OCPP1_6_CallAction.StatusNotification,
    OCPP1_6_CallAction.StartTransaction,
  ];
  _responses: CallAction[] = [
    OCPP2_0_1_CallAction.CostUpdated,
    OCPP2_0_1_CallAction.GetTransactionStatus,
  ];

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _authorizeRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _componentRepository: CrudRepository<Component>;
  protected _locationRepository: ILocationRepository;
  protected _tariffRepository: ITariffRepository;
  protected _reservationRepository: IReservationRepository;

  protected _transactionService: TransactionService;
  protected _statusNotificationService: StatusNotificationService;

  protected _fileStorage: IFileStorage;

  private readonly _authorizers: IAuthorizer[];

  private readonly _signedMeterValuesUtil: SignedMeterValuesUtil;
  private _costNotifier: CostNotifier;
  private _costCalculator: CostCalculator;

  private readonly _sendCostUpdatedOnMeterValue: boolean | undefined;
  private readonly _costUpdatedInterval: number | undefined;

  /**
   * This is the constructor function that initializes the {@link TransactionsModule}.
   *
   * @param {SystemConfig} config - The `config` contains configuration settings for the module.
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
   * @param {IAuthorizer[]} [authorizers] - An optional parameter of type {@link IAuthorizer[]} which represents
   * a list of authorizers that can be used to authorize requests.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    fileStorage: IFileStorage,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    transactionEventRepository?: ITransactionEventRepository,
    authorizeRepository?: IAuthorizationRepository,
    deviceModelRepository?: IDeviceModelRepository,
    componentRepository?: CrudRepository<Component>,
    locationRepository?: ILocationRepository,
    tariffRepository?: ITariffRepository,
    reservationRepository?: IReservationRepository,
    authorizers?: IAuthorizer[],
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.Transactions,
      logger,
    );

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

    this._authorizers = authorizers || [];

    this._signedMeterValuesUtil = new SignedMeterValuesUtil(fileStorage, config, this._logger);

    this._sendCostUpdatedOnMeterValue = config.modules.transactions.sendCostUpdatedOnMeterValue;
    this._costUpdatedInterval = config.modules.transactions.costUpdatedInterval;

    this._transactionService = new TransactionService(
      this._transactionEventRepository,
      this._authorizeRepository,
      this._reservationRepository,
      this._authorizers,
      this._logger,
    );

    this._statusNotificationService = new StatusNotificationService(
      this._componentRepository,
      this._deviceModelRepository,
      this._locationRepository,
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

  /**
   * Handle OCPP 2.0.1 requests
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.TransactionEvent)
  protected async _handleTransactionEvent(
    message: IMessage<OCPP2_0_1.TransactionEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Transaction event received:', message, props);
    const stationId: string = message.context.stationId;

    await this._transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(
      message.payload,
      stationId,
    );

    const transactionEvent = message.payload;
    const transactionId = transactionEvent.transactionInfo.transactionId;

    if (message.payload.reservationId) {
      await this._transactionService.deactivateReservation(
        transactionId,
        message.payload.reservationId,
        stationId,
      );
    }

    if (transactionEvent.idToken) {
      const response = await this._transactionService.authorizeIdToken(
        transactionEvent,
        message.context,
      );
      const messageConfirmation = await this.sendCallResultWithMessage(message, response);
      this._logger.debug('Transaction response sent: ', messageConfirmation);
      // If the transaction is accepted and interval is set, start the cost update
      if (
        transactionEvent.eventType === OCPP2_0_1.TransactionEventEnumType.Started &&
        response.idTokenInfo?.status === OCPP2_0_1.AuthorizationStatusEnumType.Accepted &&
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
      const response: OCPP2_0_1.TransactionEventResponse = {
        // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
      };

      const transaction: Transaction | undefined =
        await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(
          stationId,
          transactionId,
        );

      if (message.payload.eventType === OCPP2_0_1.TransactionEventEnumType.Updated) {
        // I02 - Show EV Driver Running Total Cost During Charging
        if (transaction && transaction.isActive && this._sendCostUpdatedOnMeterValue) {
          response.totalCost = await this._costCalculator.calculateTotalCost(
            stationId,
            transaction.id,
            transaction.totalKwh,
          );
        }

        // I06 - Update Tariff Information During Transaction
        const tariffAvailableAttributes: VariableAttribute[] =
          await this._deviceModelRepository.readAllByQuerystring({
            stationId: stationId,
            component_name: 'TariffCostCtrlr',
            variable_instance: 'Tariff',
            variable_name: 'Available',
            type: OCPP2_0_1.AttributeEnumType.Actual,
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

      if (message.payload.eventType === OCPP2_0_1.TransactionEventEnumType.Ended && transaction) {
        response.totalCost = await this._costCalculator.calculateTotalCost(
          stationId,
          transaction.id,
          transaction.totalKwh,
        );
      }

      // Store total cost in db
      if (response.totalCost && transaction) {
        await this._transactionEventRepository.updateTransactionTotalCostById(
          response.totalCost,
          transaction.id,
        );
      }

      if (transactionEvent.meterValue) {
        const meterValuesValid = await this._signedMeterValuesUtil.validateMeterValues(
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

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.MeterValues)
  protected async _handleMeterValues(
    message: IMessage<OCPP2_0_1.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('MeterValues received:', message, props);

    // TODO: Meter values can be triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    const meterValues = message.payload.meterValue;
    const stationId = message.context.stationId;
    const evseId = message.payload.evseId;

    // When evseId is 0, the MeterValuesRequest message SHALL be associated with the entire Charging Station.
    if (this._sendCostUpdatedOnMeterValue && evseId !== 0) {
      const activeTransaction: Transaction | undefined =
        await this.transactionEventRepository.getActiveTransactionByStationIdAndEvseId(
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

      await this._transactionService.createMeterValues(meterValues, activeTransaction?.id);

      if (activeTransaction) {
        await this._costNotifier.calculateCostAndNotify(
          activeTransaction,
          message.context.tenantId,
        );
      }
    } else {
      await this._transactionService.createMeterValues(meterValues);
    }

    const meterValuesValid = await this._signedMeterValuesUtil.validateMeterValues(
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

    const response: OCPP2_0_1.MeterValuesResponse = {
      // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
    };

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('MeterValues response sent: ', messageConfirmation);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.StatusNotification)
  protected async _handleStatusNotification(
    message: IMessage<OCPP2_0_1.StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('StatusNotification received:', message, props);

    await this._statusNotificationService.processStatusNotification(
      message.context.stationId,
      message.payload,
    );

    // Create response
    const response: OCPP2_0_1.StatusNotificationResponse = {};
    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('StatusNotification response sent: ', messageConfirmation);
  }

  /**
   * Handle OCPP 2.0.1 responses
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.CostUpdated)
  protected _handleCostUpdated(
    message: IMessage<OCPP2_0_1.CostUpdatedResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('CostUpdated response received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetTransactionStatus)
  protected _handleGetTransactionStatus(
    message: IMessage<OCPP2_0_1.GetTransactionStatusResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('GetTransactionStatus response received:', message, props);
  }

  /**
   * Handle OCPP 1.6 requests
   */

  @AsHandler(OCPPVersion.OCPP1_6, OCPP1_6_CallAction.StatusNotification)
  protected async _handleOcpp16StatusNotification(
    message: IMessage<OCPP1_6.StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('StatusNotification request received:', message, props);

    await this._statusNotificationService.processOcpp16StatusNotification(
      message.context.stationId,
      message.payload,
    );

    // Create response
    const response: OCPP1_6.StatusNotificationResponse = {};
    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('StatusNotification response sent: ', messageConfirmation);
  }

  @AsHandler(OCPPVersion.OCPP1_6, OCPP1_6_CallAction.MeterValues)
  protected async _handleOcpp16MeterValues(
    message: IMessage<OCPP1_6.MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('MeterValues request received:', message, props);

    const stationId = message.context.stationId;
    const connectorId = message.payload.connectorId;
    const transactionId = message.payload.transactionId;
    const meterValues = message.payload.meterValue;

    if (connectorId !== 0 && transactionId && meterValues.length > 0) {
      try {
        const meterValueEntities: MeterValue[] = [];
        for (const meterValue of meterValues) {
          if (meterValue.sampledValue && meterValue.sampledValue.length > 0) {
            meterValueEntities.push(
              MeterValue.build({
                ...meterValue,
                connectorId,
              }),
            );
          }
        }
        if (meterValueEntities.length > 0) {
          await this._transactionEventRepository.updateTransactionByMeterValues(
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

  @AsHandler(OCPPVersion.OCPP1_6, OCPP1_6_CallAction.StartTransaction)
  protected async _handleOcpp16StartTransaction(
    message: IMessage<OCPP1_6.StartTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 StartTransaction request received:', message, props);
    const stationId = message.context.stationId;
    const request = message.payload;

    // Authorize
    const response = await this._transactionService.authorizeOcpp16IdToken(request.idTag);

    // Send response to charger
    if (response.idTagInfo.status !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
      await this.sendCallResultWithMessage(message, response);
    } else {
      try {
        // Create transaction
        const newTransaction =
          await this._transactionEventRepository.createTransactionByStartTransaction(
            request,
            stationId,
          );
        response.transactionId = parseInt(newTransaction.transactionId);
      } catch (error) {
        this._logger.error(`Failed to create transaction for idTag ${request.idTag}`, error);
        response.idTagInfo = {
          status: OCPP1_6.StartTransactionResponseStatus.Invalid,
        };
      }
      await this.sendCallResultWithMessage(message, response);
    }

    // Deactivate reservation
    if (request.reservationId) {
      await this._transactionService.deactivateReservation(
        response.transactionId.toString(),
        request.reservationId,
        stationId,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP1_6, OCPP1_6_CallAction.StopTransaction)
  protected async _handleOcpp16StopTransaction(
    message: IMessage<OCPP1_6.StopTransactionRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 StopTransaction request received:', message, props);

    const stationId = message.context.stationId;
    const request = message.payload;

    const transaction = await this._transactionEventRepository.readOnlyOneByQuery({
      stationId,
      transactionId: request.transactionId.toString(),
    });

    if (!transaction) {
      this._logger.error(`Transaction ${request.transactionId} not found or already stopped.`);
      await this.sendCallResultWithMessage(message, {});
      return;
    }

    const idTokenRecord = request.idTag
      ? await this._authorizeRepository.readOnlyOneByQuery({
          idToken: request.idTag,
        })
      : null;
    const idTokenDatabaseId = idTokenRecord ? idTokenRecord.id : undefined;

    const stopTransaction = await this._transactionEventRepository.createStopTransaction(
      request.transactionId.toString(),
      stationId,
      request.meterStop,
      new Date(request.timestamp),
      request.transactionData?.map((data) => MeterValue.build({ ...data })) || [],
      request.reason || (request.idTag ? 'Remote' : 'Local'),
      idTokenDatabaseId,
    );

    if (!stopTransaction) {
      this._logger.error(
        `Failed to create StopTransaction record for transaction ${request.transactionId}`,
      );
      await this.sendCallResultWithMessage(message, {});
      return;
    }

    await this._transactionService.finalizeTransaction(transaction.id, stopTransaction);

    const idTagInfo = await this._authorizeRepository.readAllByQuerystring({
      idToken: request.idTag as string,
      type: null,
    });

    await this.sendCallResultWithMessage(message, {
      idTagInfo: idTagInfo ? { status: 'Accepted' } : undefined,
    });

    this._logger.info(`Transaction ${request.transactionId} stopped successfully.`);
  }
}
