// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AdditionalInfoType,
  AsHandler,
  AuthorizationStatusEnumType,
  CallAction,
  CostUpdatedRequest,
  CostUpdatedResponse,
  CrudRepository,
  EventGroup,
  GetTransactionStatusResponse,
  HandlerProperties,
  ICache,
  IdTokenInfoType,
  IdTokenType,
  IMessage,
  IMessageHandler,
  IMessageSender,
  MeterValuesRequest,
  MeterValuesResponse,
  MeterValueUtils,
  ReportDataType,
  StatusNotificationRequest,
  StatusNotificationResponse,
  SystemConfig,
  TransactionEventEnumType,
  TransactionEventRequest,
  TransactionEventResponse,
} from '@citrineos/base';
import {
  Authorization,
  Component,
  Evse,
  IAuthorizationRepository,
  IDeviceModelRepository,
  ILocationRepository,
  ITariffRepository,
  ITransactionEventRepository,
  sequelize,
  SequelizeRepository,
  Tariff,
  Transaction,
  Variable,
} from '@citrineos/data';
import {IAuthorizer, RabbitMqReceiver, RabbitMqSender, Timer,} from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import {ILogObj, Logger} from 'tslog';
import {TransactionEventHandler} from "./handlers/TransactionEventHandler";
import {IHandler} from "./handlers/IHandler";

/**
 * Component that handles transaction related messages.
 */
export class TransactionsModule extends AbstractModule {
  protected _requests: CallAction[] = [
    CallAction.MeterValues,
    CallAction.StatusNotification,
    CallAction.TransactionEvent,
  ];
  protected _responses: CallAction[] = [
    CallAction.CostUpdated,
    CallAction.GetTransactionStatus,
  ];

  protected _handlers: Map<CallAction, IHandler> = new Map();

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _authorizeRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _componentRepository: CrudRepository<Component>;
  protected _locationRepository: ILocationRepository;
  protected _tariffRepository: ITariffRepository;

  private _authorizers: IAuthorizer[];

  private readonly _sendCostUpdatedOnMeterValue: boolean | undefined;
  private readonly _costUpdatedInterval: number | undefined;

  /**
   * This is the constructor function that initializes the {@link TransactionModule}.
   *
   * @param {SystemConfig} config - The `config` contains configuration settings for the module.
   *
   * @param {ICache} [cache] - The cache instance which is shared among the modules & Central System to pass information such as blacklisted actions or boot status.
   *
   * @param {IMessageSender} [sender] - The `sender` parameter is an optional parameter that represents an instance of the {@link IMessageSender} interface.
   * It is used to send messages from the central system to external systems or devices. If no `sender` is provided, a default {@link RabbitMqSender} instance is created and used.
   *
   * @param {IMessageHandler} [handler] - The `handler` parameter is an optional parameter that represents an instance of the {@link IMessageHandler} interface.
   * It is used to handle incoming messages and dispatch them to the appropriate methods or functions. If no `handler` is provided, a default {@link RabbitMqReceiver} instance is created and used.
   *
   * @param {Logger<ILogObj>} [logger] - The `logger` parameter is an optional parameter that represents an instance of {@link Logger<ILogObj>}.
   * It is used to propagate system wide logger settings and will serve as the parent logger for any sub-component logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
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
   * @param {IAuthorizer[]} [authorizers] - An optional parameter of type {@link IAuthorizer[]} which represents
   * a list of authorizers that can be used to authorize requests.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    transactionEventRepository?: ITransactionEventRepository,
    authorizeRepository?: IAuthorizationRepository,
    deviceModelRepository?: IDeviceModelRepository,
    componentRepository?: CrudRepository<Component>,
    locationRepository?: ILocationRepository,
    tariffRepository?: ITariffRepository,
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

    const timer = new Timer();
    this._logger.info('Initializing...');

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error(
        'Could not initialize module due to failure in handler initialization.',
      );
    }

    this._transactionEventRepository =
      transactionEventRepository ||
      new sequelize.SequelizeTransactionEventRepository(config, logger);
    this._authorizeRepository =
      authorizeRepository ||
      new sequelize.SequelizeAuthorizationRepository(config, logger);
    this._deviceModelRepository =
      deviceModelRepository ||
      new sequelize.SequelizeDeviceModelRepository(config, logger);
    this._componentRepository =
      componentRepository ||
      new SequelizeRepository<Component>(config, Component.MODEL_NAME, logger);
    this._locationRepository =
      locationRepository ||
      new sequelize.SequelizeLocationRepository(config, logger);
    this._tariffRepository =
      tariffRepository ||
      new sequelize.SequelizeTariffRepository(config, logger);

    this._authorizers = authorizers || [];

    this._sendCostUpdatedOnMeterValue = config.modules.transactions.sendCostUpdatedOnMeterValue;
    this._costUpdatedInterval = config.modules.transactions.costUpdatedInterval;

    this._handlers.set(CallAction.TransactionEvent, new TransactionEventHandler(
        this.config,
        this,
        this._transactionEventRepository,
        this._tariffRepository,
        this._authorizeRepository,
        this._deviceModelRepository,
        this._authorizers,
        this._logger
    ));

    this._logger.info(`Initialized in ${timer.end()}ms...`);
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
   * Handle requests
   */

  @AsHandler(CallAction.TransactionEvent)
  protected async _handleTransactionEvent(
    message: IMessage<TransactionEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Transaction event received:', message, props);
    return this._handlers.get(CallAction.TransactionEvent)?.handle(message, props);
  }

  @AsHandler(CallAction.MeterValues)
  protected async _handleMeterValues(
    message: IMessage<MeterValuesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('MeterValues received:', message, props);

    // TODO: Add meterValues to transactions
    // TODO: Meter values can be triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message
    // TODO: If sendCostUpdatedOnMeterValue is true, meterValues handler triggers cost update
    //  when it is added into a transaction

    const response: MeterValuesResponse = {
      // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
    };

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) => {
        this._logger.debug('MeterValues response sent: ', messageConfirmation);
      },
    );
  }

  @AsHandler(CallAction.StatusNotification)
  protected async _handleStatusNotification(
    message: IMessage<StatusNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('StatusNotification received:', message, props);

    const stationId = message.context.stationId;
    const statusNotificationRequest = message.payload;

    const chargingStation =
      await this._locationRepository.readChargingStationByStationId(stationId);
    if (chargingStation) {
      await this._locationRepository.addStatusNotificationToChargingStation(
        stationId,
        statusNotificationRequest,
      );
    } else {
      this._logger.warn(
        `Charging station ${stationId} not found. Status notification cannot be associated with a charging station.`,
      );
    }

    const component = await this._componentRepository.readOnlyOneByQuery({
      where: {
        name: 'Connector',
      },
      include: [
        {
          model: Evse,
          where: {
            id: statusNotificationRequest.evseId,
            connectorId: statusNotificationRequest.connectorId,
          },
        },
        {
          model: Variable,
          where: {
            name: 'AvailabilityState',
          },
        },
      ],
    });
    const variable = component?.variables?.[0];
    if (!component || !variable) {
      this._logger.warn(
        'Missing component or variable for status notification. Status notification cannot be assigned to device model.',
      );
    } else {
      const reportDataType: ReportDataType = {
        component: component,
        variable: variable,
        variableAttribute: [
          {
            value: statusNotificationRequest.connectorStatus,
          },
        ],
      };
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
        reportDataType,
        stationId,
        statusNotificationRequest.timestamp,
      );
    }

    // Create response
    const response: StatusNotificationResponse = {};
    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) => {
        this._logger.debug(
          'StatusNotification response sent: ',
          messageConfirmation,
        );
      },
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.CostUpdated)
  protected _handleCostUpdated(
    message: IMessage<CostUpdatedResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('CostUpdated response received:', message, props);
  }

  @AsHandler(CallAction.GetTransactionStatus)
  protected _handleGetTransactionStatus(
    message: IMessage<GetTransactionStatusResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'GetTransactionStatus response received:',
      message,
      props,
    );
  }
}
