// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IMessage } from './message.js';
import type { IMessageHandler } from './message-handler.js';
import {
  type OcppRequest,
  type OcppResponse,
  type CallAction,
  type HandlerProperties,
} from '@citrineos/types';
import { OcppError } from '@ocpp/rpc/message.js';
import type { IModule } from '@interfaces/modules/module.js';

/**
 * Abstract class implementing {@link IMessageHandler}.
 */
export abstract class AbstractMessageHandler implements IMessageHandler {
  /**
   * Fields
   */

  protected _module?: IModule;
  protected _logger: Logger<ILogObj>;

  /**
   * Constructor
   *
   * @param config The system configuration.
   * @param logger [Optional] The logger to use.
   */
  constructor(logger?: Logger<ILogObj>, module?: IModule) {
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
}
