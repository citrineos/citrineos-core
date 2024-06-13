// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  CallAction,
  ChargingLimitSourceEnumType,
  ChargingProfileCriterionType,
  ChargingProfileStatusEnumType,
  ChargingProfileType,
  ClearChargingProfileResponse,
  ClearChargingProfileStatusEnumType,
  ClearedChargingLimitResponse,
  EventGroup,
  GenericStatusEnumType,
  GetChargingProfilesRequest,
  GetChargingProfilesResponse,
  GetCompositeScheduleResponse,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  NotifyChargingLimitRequest,
  NotifyChargingLimitResponse,
  NotifyEVChargingNeedsRequest,
  NotifyEVChargingNeedsResponse,
  NotifyEVChargingNeedsStatusEnumType,
  NotifyEVChargingScheduleRequest,
  NotifyEVChargingScheduleResponse,
  ReportChargingProfilesRequest,
  ReportChargingProfilesResponse,
  SetChargingProfileResponse,
  SystemConfig,
} from '@citrineos/base';
import {
  generateRequestId,
  RabbitMqReceiver,
  RabbitMqSender,
  Timer,
} from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import { ILogObj, Logger } from 'tslog';
import {
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
  sequelize,
} from '@citrineos/data';

/**
 * Component that handles provisioning related messages.
 */
export class SmartChargingModule extends AbstractModule {
  /**
   * Fields
   */

  protected _requests: CallAction[] = [
    CallAction.NotifyChargingLimit,
    CallAction.NotifyEVChargingNeeds,
    CallAction.NotifyEVChargingSchedule,
    CallAction.ReportChargingProfiles,
  ];

  protected _responses: CallAction[] = [
    CallAction.ClearChargingProfile,
    CallAction.ClearedChargingLimit,
    CallAction.GetChargingProfiles,
    CallAction.GetCompositeSchedule,
    CallAction.SetChargingProfile,
  ];

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link SmartChargingModule}.
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
   * @param {ITransactionEventRepository} [transactionEventRepository] - An optional parameter of type {@link ITransactionEventRepository}
   * which represents a repository for accessing and manipulating transaction data.
   * If no `transactionEventRepository` is provided, a default {@link sequelize:transactionEventRepository} instance is created and used.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository}
   * which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is created and used.
   *
   * @param {IChargingProfileRepository} [chargingProfileRepository] - An optional parameter of type {@link IChargingProfileRepository}
   * which represents a repository for accessing and manipulating charging profile data.
   * If no `chargingProfileRepository` is provided, a default {@link sequelize:chargingProfileRepository} instance is created and used.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    transactionEventRepository?: ITransactionEventRepository,
    deviceModelRepository?: IDeviceModelRepository,
    chargingProfileRepository?: IChargingProfileRepository,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.SmartCharging,
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
      new sequelize.SequelizeTransactionEventRepository(config, this._logger);
    this._deviceModelRepository =
      deviceModelRepository ||
      new sequelize.SequelizeDeviceModelRepository(config, this._logger);
    this._chargingProfileRepository =
      chargingProfileRepository ||
      new sequelize.SequelizeChargingProfileRepository(config, this._logger);

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }
  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }
  get chargingProfileRepository(): IChargingProfileRepository {
    return this._chargingProfileRepository;
  }

  /**
   * Handle requests
   */

  @AsHandler(CallAction.NotifyEVChargingNeeds)
  protected async _handleNotifyEVChargingNeeds(
    message: IMessage<NotifyEVChargingNeedsRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyEVChargingNeeds received:', message, props);

    // TODO: this db operation is to support to run the use case K01 setChargingProfile
    //  we still need to complete the implementation of this use case
    const chargingNeeds =
      await this._chargingProfileRepository.createChargingNeeds(
        message.payload,
        message.context.stationId,
      );
    this._logger.info(
      `Charging needs created: ${JSON.stringify(chargingNeeds)}`,
    );

    // Create response
    const response: NotifyEVChargingNeedsResponse = {
      status: NotifyEVChargingNeedsStatusEnumType.Rejected,
    };

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) =>
        this._logger.debug(
          'NotifyEVChargingNeeds response sent: ',
          messageConfirmation,
        ),
    );
  }

  @AsHandler(CallAction.NotifyEVChargingSchedule)
  protected _handleNotifyEVChargingSchedule(
    message: IMessage<NotifyEVChargingScheduleRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('NotifyEVChargingSchedule received:', message, props);

    // Create response
    const response: NotifyEVChargingScheduleResponse = {
      status: GenericStatusEnumType.Accepted,
    };

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) =>
        this._logger.debug(
          'NotifyEVChargingSchedule response sent: ',
          messageConfirmation,
        ),
    );
  }

  @AsHandler(CallAction.NotifyChargingLimit)
  protected _handleNotifyChargingLimit(
    message: IMessage<NotifyChargingLimitRequest>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug('NotifyChargingLimit received:', message, props);

    // Create response
    const response: NotifyChargingLimitResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) =>
        this._logger.debug(
          'NotifyChargingLimit response sent: ',
          messageConfirmation,
        ),
    );
  }

  @AsHandler(CallAction.ReportChargingProfiles)
  protected async _handleReportChargingProfiles(
    message: IMessage<ReportChargingProfilesRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ReportChargingProfiles received:', message, props);

    const chargingProfiles = message.payload
      .chargingProfile as ChargingProfileType[];
    for (const chargingProfile of chargingProfiles) {
      await this._chargingProfileRepository.createOrUpdateChargingProfile(
        chargingProfile,
        message.context.stationId,
        message.payload.evseId,
        message.payload.chargingLimitSource,
        true,
      );
    }

    // Create response
    const response: ReportChargingProfilesResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) =>
        this._logger.debug(
          'ReportChargingProfiles response sent: ',
          messageConfirmation,
        ),
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.ClearChargingProfile)
  protected async _handleClearChargingProfile(
    message: IMessage<ClearChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'ClearChargingProfile response received:',
      message,
      props,
    );

    if (
      message.payload.status === ClearChargingProfileStatusEnumType.Accepted
    ) {
      const stationId: string = message.context.stationId;
      // Set existed profiles to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        {
          isActive: false,
        },
        {
          where: {
            stationId: stationId,
            isActive: true,
          },
          returning: false,
        },
      );
      // Request charging profiles to get the latest data
      this.sendCall(
        stationId,
        message.context.tenantId,
        CallAction.GetChargingProfiles,
        {
          requestId: generateRequestId(),
          chargingProfile: {
            chargingLimitSource: [
              ChargingLimitSourceEnumType.CSO,
              ChargingLimitSourceEnumType.EMS,
              ChargingLimitSourceEnumType.SO,
              ChargingLimitSourceEnumType.Other,
            ],
          } as ChargingProfileCriterionType,
        } as GetChargingProfilesRequest,
      );
    } else {
      this._logger.error(
        `Failed to clear charging profile: ${JSON.stringify(message.payload)}`,
      );
    }
  }

  @AsHandler(CallAction.GetChargingProfiles)
  protected _handleGetChargingProfiles(
    message: IMessage<GetChargingProfilesResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'GetChargingProfiles response received:',
      message,
      props,
    );
  }

  @AsHandler(CallAction.SetChargingProfile)
  protected async _handleSetChargingProfile(
    message: IMessage<SetChargingProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SetChargingProfile response received:', message, props);
    const response: SetChargingProfileResponse = message.payload;
    if (response.status === ChargingProfileStatusEnumType.Rejected) {
      this._logger.error(
        `Failed to set charging profile: ${JSON.stringify(response)}`,
      );
    } else {
      const stationId: string = message.context.stationId;
      // Set existed profiles to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        {
          isActive: false,
        },
        {
          where: {
            stationId: stationId,
            isActive: true,
            chargingLimitSource: ChargingLimitSourceEnumType.CSO,
          },
          returning: false,
        },
      );
      // Request charging profiles to get the latest data
      this.sendCall(
        stationId,
        message.context.tenantId,
        CallAction.GetChargingProfiles,
        {
          requestId: generateRequestId(),
          chargingProfile: {
            chargingLimitSource: [ChargingLimitSourceEnumType.CSO],
          } as ChargingProfileCriterionType,
        } as GetChargingProfilesRequest,
      );
    }
  }

  @AsHandler(CallAction.ClearedChargingLimit)
  protected _handleClearedChargingLimit(
    message: IMessage<ClearedChargingLimitResponse>,
    props?: HandlerProperties,
  ): void {
    this._logger.debug(
      'ClearedChargingLimit response received:',
      message,
      props,
    );
  }

  @AsHandler(CallAction.GetCompositeSchedule)
  protected async _handleGetCompositeSchedule(
    message: IMessage<GetCompositeScheduleResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'GetCompositeSchedule response received:',
      message,
      props,
    );
    const response = message.payload;
    if (response.status === GenericStatusEnumType.Accepted) {
      if (response.schedule) {
        const compositeSchedule =
          await this._chargingProfileRepository.createCompositeSchedule(
            response.schedule,
            message.context.stationId,
          );
        this._logger.info(
          `Composite schedule created: ${JSON.stringify(compositeSchedule)}`,
        );
      } else {
        this._logger.error(
          `Missing schedule in response: ${response.status} ${JSON.stringify(response.statusInfo)}`,
        );
      }
    } else {
      this._logger.error(
        `Failed to get composite schedule: ${response.status} ${JSON.stringify(response.statusInfo)}`,
      );
    }
  }
}
