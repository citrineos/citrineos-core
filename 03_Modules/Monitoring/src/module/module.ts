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


import { AbstractModule, CallAction, SystemConfig, ICache, IMessageSender, IMessageHandler, EventGroup, AsHandler, IMessage, NotifyEventRequest, HandlerProperties, NotifyEventResponse, GetVariablesResponse, SetVariablesResponse } from "@citrineos/base";
import { IDeviceModelRepository, sequelize } from "@citrineos/data";
import { PubSubReceiver, PubSubSender, Timer } from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';
import { DeviceModelService } from "./services";

/**
 * Component that handles monitoring related messages.
 */
export class MonitoringModule extends AbstractModule {

  protected _requests: CallAction[] = [CallAction.NotifyEvent];
  protected _responses: CallAction[] = [CallAction.GetVariables, CallAction.SetVariables];

  protected _deviceModelRepository: IDeviceModelRepository;

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  public _deviceModelService: DeviceModelService;

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
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.DeviceModelRepository} instance is created and used.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    deviceModelRepository?: IDeviceModelRepository
  ) {
    super(config, cache, handler || new PubSubReceiver(config, logger), sender || new PubSubSender(config, logger), EventGroup.Monitoring, logger);

    const timer = new Timer();
    this._logger.info(`Initializing...`);

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error("Could not initialize module due to failure in handler initialization.");
    }

    this._deviceModelRepository = deviceModelRepository || new sequelize.DeviceModelRepository(config, this._logger);

    this._deviceModelService = new DeviceModelService(this._deviceModelRepository);

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  /**
   * Handle requests
   */

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

  /**
   * Handle responses
   */

  @AsHandler(CallAction.GetVariables)
  protected async _handleGetVariables(
    message: IMessage<GetVariablesResponse>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("GetVariables response received", message, props);
    this._deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId(message.payload.getVariableResult, message.context.stationId);
  }

  @AsHandler(CallAction.SetVariables)
  protected async _handleSetVariables(
    message: IMessage<SetVariablesResponse>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("SetVariables response received", message, props);

    message.payload.setVariableResult.forEach(async setVariableResultType => {
      this._deviceModelRepository.updateResultByStationId(setVariableResultType, message.context.stationId);
    });
  }
}