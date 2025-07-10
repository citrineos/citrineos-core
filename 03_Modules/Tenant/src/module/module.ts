// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  BootstrapConfig,
  CallAction,
  EventGroup,
  ICache,
  IMessageHandler,
  IMessageSender,
  SystemConfig,
} from '@citrineos/base';
import { RabbitMqReceiver, RabbitMqSender } from '@citrineos/util';
import { ILogObj, Logger } from 'tslog';

export class TenantModule extends AbstractModule {
  /**
   * Fields
   */

  _requests: CallAction[] = [];
  _responses: CallAction[] = [];

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link TenantModule}.
   *
   * @param {BootstrapConfig & SystemConfig} config - The `config` contains configuration settings for the module.
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
    config: BootstrapConfig & SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.Tenant,
      logger,
    );
    this._requests = config.modules.tenant.requests;
    this._responses = config.modules.tenant.responses;
  }
}
