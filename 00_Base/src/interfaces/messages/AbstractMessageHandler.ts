// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import { IMessage, IMessageHandler, OcppError, OcppRequest, OcppResponse } from '../..';
import { SystemConfig } from '../../config/types';
import { CallAction } from '../../ocpp/rpc/message';
import { IModule } from '../modules';
import { HandlerProperties } from '.';

/**
 * Abstract class implementing {@link IMessageHandler}.
 */
export abstract class AbstractMessageHandler implements IMessageHandler {
  /**
   * Fields
   */

  protected _config: SystemConfig;
  protected _module?: IModule;
  protected _logger: Logger<ILogObj>;

  /**
   * Constructor
   *
   * @param config The system configuration.
   * @param logger [Optional] The logger to use.
   */
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, module?: IModule) {
    this._config = config;
    this._module = module;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Getter & Setter
   */

  get module(): IModule | undefined {
    return this._module;
  }
  set module(value: IModule | undefined) {
    this._module = value;
  }

  /**
   * Methods
   */

  async handle(
    message: IMessage<OcppRequest | OcppResponse | OcppError>,
    props?: HandlerProperties,
  ): Promise<void> {
    await this._module?.handle(message, props);
  }

  /**
   * Abstract Methods
   */

  abstract subscribe(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean>;
  abstract unsubscribe(identifier: string): Promise<boolean>;
  abstract shutdown(): Promise<void>;
  abstract initConnection(): Promise<void>;
}
