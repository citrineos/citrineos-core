// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  CallAction,
  ClearChargingProfileResponse,
  ClearedChargingLimitResponse,
  EventGroup,
  GenericStatusEnumType,
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
import { RabbitMqReceiver, RabbitMqSender, Timer } from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import { ILogObj, Logger } from 'tslog';

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
    CallAction.ReportChargingProfiles
  ];

  protected _responses: CallAction[] = [
    CallAction.ClearChargingProfile,
    CallAction.ClearedChargingLimit,
    CallAction.GetChargingProfiles,
    CallAction.GetCompositeSchedule,
    CallAction.SetChargingProfile
  ];

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
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>
  ) {
    super(config, cache, handler || new RabbitMqReceiver(config, logger), sender || new RabbitMqSender(config, logger), EventGroup.SmartCharging, logger);

    const timer = new Timer();
    this._logger.info('Initializing...');

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error('Could not initialize module due to failure in handler initialization.');
    }

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  /**
   * Handle requests
   */

  @AsHandler(CallAction.NotifyEVChargingNeeds)
  protected _handleNotifyEVChargingNeeds(
    message: IMessage<NotifyEVChargingNeedsRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug('NotifyEVChargingNeeds received:', message, props);

    // Create response
    const response: NotifyEVChargingNeedsResponse = {
      status: NotifyEVChargingNeedsStatusEnumType.Rejected
    };

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug('NotifyEVChargingNeeds response sent: ', messageConfirmation));
  }

  @AsHandler(CallAction.NotifyEVChargingSchedule)
  protected _handleNotifyEVChargingSchedule(
    message: IMessage<NotifyEVChargingScheduleRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug('NotifyEVChargingSchedule received:', message, props);

    // Create response
    const response: NotifyEVChargingScheduleResponse = {
      status: GenericStatusEnumType.Accepted
    };

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug('NotifyEVChargingSchedule response sent: ', messageConfirmation));
  }



  @AsHandler(CallAction.NotifyChargingLimit)
  protected _handleNotifyChargingLimit(
    message: IMessage<NotifyChargingLimitRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug('NotifyChargingLimit received:', message, props);

    // Create response
    const response: NotifyChargingLimitResponse = {
    };

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug('NotifyChargingLimit response sent: ', messageConfirmation));
  }



  @AsHandler(CallAction.ReportChargingProfiles)
  protected _handleReportChargingProfiles(
    message: IMessage<ReportChargingProfilesRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug('ReportChargingProfiles received:', message, props);

    // Create response
    const response: ReportChargingProfilesResponse = {
    };

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug('ReportChargingProfiles response sent: ', messageConfirmation));
  }


  /**
   * Handle responses
   */

  @AsHandler(CallAction.ClearChargingProfile)
  protected _handleClearChargingProfile(
    message: IMessage<ClearChargingProfileResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug('ClearChargingProfile response received:', message, props);
  }

  @AsHandler(CallAction.GetChargingProfiles)
  protected _handleGetChargingProfiles(
    message: IMessage<GetChargingProfilesResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug('GetChargingProfiles response received:', message, props);
  }

  @AsHandler(CallAction.SetChargingProfile)
  protected _handleSetChargingProfile(
    message: IMessage<SetChargingProfileResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug('SetChargingProfile response received:', message, props);
  }

  @AsHandler(CallAction.ClearedChargingLimit)
  protected _handleClearedChargingLimit(
    message: IMessage<ClearedChargingLimitResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug('ClearedChargingLimit response received:', message, props);
  }

  @AsHandler(CallAction.GetCompositeSchedule)
  protected _handleGetCompositeSchedule(
    message: IMessage<GetCompositeScheduleResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug('GetCompositeSchedule response received:', message, props);
  }
}
