/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import {
  AbstractModule,
  AsHandler,
  CallAction,
  EventGroup,
  FirmwareStatusNotificationRequest,
  FirmwareStatusNotificationResponse,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  LogStatusNotificationRequest,
  LogStatusNotificationResponse,
  NotifyMonitoringReportRequest,
  NotifyMonitoringReportResponse,
  SystemConfig
} from "@citrineos/base";
import { PubSubReceiver, PubSubSender, Timer } from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';

/**
 * Component that handles monitoring related messages.
 */
export class MonitoringModule extends AbstractModule {

  protected _requests: CallAction[] = [CallAction.NotifyMonitoringReport, CallAction.LogStatusNotification, CallAction.FirmwareStatusNotification];
  protected _responses: CallAction[] = [CallAction.GetMonitoringReport];

  /**
   * This is the constructor function that initializes the {@link MonitoringModule}.
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
   * @param {IAuthorizationRepository} [authorizeRepository] - An optional parameter of type {@link IAuthorizationRepository} which represents a repository for accessing and manipulating authorization data.
   * If no `authorizeRepository` is provided, a default {@link sequelize.AuthorizationRepository} instance is created and used.
   * 
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.DeviceModelRepository} instance is created and used.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>
  ) {
    super(config, cache, handler || new PubSubReceiver(config, logger), sender || new PubSubSender(config, logger), EventGroup.Monitoring, logger);

    const timer = new Timer();
    this._logger.info(`Initializing...`);

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error("Could not initialize module due to failure in handler initialization.");
    }

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  /**
   * Protected methods
   */

  @AsHandler(CallAction.NotifyMonitoringReport)
  protected _handleTransaction(
    message: IMessage<NotifyMonitoringReportRequest>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("NotifyMonitoringReport request received:", message, props);

    // Create response
    const response: NotifyMonitoringReportResponse = {};

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug("NotifyMonitoringReport response sent:", messageConfirmation));
  }

  @AsHandler(CallAction.LogStatusNotification)
  protected _handleLogStatusNotification(
    message: IMessage<LogStatusNotificationRequest>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("LogStatusNotification received:", message, props);

    // TODO: LogStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // Create response
    const response: LogStatusNotificationResponse = {};

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug("LogStatusNotification response sent:", messageConfirmation));
  }

  @AsHandler(CallAction.FirmwareStatusNotification)
  protected _handleFirmwareStatusNotification(
    message: IMessage<FirmwareStatusNotificationRequest>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("FirmwareStatusNotification received:", message, props);

    // TODO: FirmwareStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // Create response
    const response: FirmwareStatusNotificationResponse = {};

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug("FirmwareStatusNotification response sent:", messageConfirmation));
  }
}