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
  ChangeAvailabilityResponse,
  EventGroup,
  HandlerProperties,
  HeartbeatRequest,
  HeartbeatResponse,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  NotifyEventRequest,
  NotifyEventResponse,
  StatusNotificationRequest,
  StatusNotificationResponse,
  SystemConfig
} from "@citrineos/base";
import { RabbitMqReceiver, RabbitMqSender, Timer } from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';

/**
 * Component that handles provisioning related messages.
 */
export class AvailabilityModule extends AbstractModule {

  /**
   * Fields
   */

  protected _requests: CallAction[] = [
    CallAction.Heartbeat,
    CallAction.StatusNotification,
    CallAction.NotifyEvent
  ];

  protected _responses: CallAction[] = [
    CallAction.ChangeAvailability
  ];

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link AvailabilityModule}.
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
    super(config, cache, handler || new RabbitMqReceiver(config, logger, cache), sender || new RabbitMqSender(config, logger), EventGroup.Availability, logger);

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

  @AsHandler(CallAction.Heartbeat)
  protected _handleHeartbeat(
    message: IMessage<HeartbeatRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug("Heartbeat received:", message, props);

    // Create response
    const response: HeartbeatResponse = {
      currentTime: new Date().toISOString()
    };

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug("Heartbeat response sent:", messageConfirmation));
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
      .then(messageConfirmation => this._logger.debug("StatusNotification response sent:", messageConfirmation));
  }

  @AsHandler(CallAction.NotifyEvent)
  protected _handleNotifyEvent(
    message: IMessage<NotifyEventRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug("NotifyEvent received:", message, props);

    // Create response
    const response: NotifyEventResponse = {};

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug("NotifyEvent response sent:", messageConfirmation));
  }

  @AsHandler(CallAction.ChangeAvailability)
  protected _handleChangeAvailability(
    message: IMessage<ChangeAvailabilityResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("ChangeAvailability response received:", message, props);
  }
}