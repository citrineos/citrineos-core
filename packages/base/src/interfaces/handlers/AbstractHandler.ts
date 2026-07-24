// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type ILogObj, Logger } from 'tslog';
import { type HandlerProperties, type IMessage } from '@interfaces/messages/index.js';
import type { OcppRequest, OcppResponse } from '@ocpp/internal-types.js';
import type { IHandler } from '@interfaces/handlers/Handler.js';
import type { IOcppSender } from '@interfaces/handlers/IOcppSender.js';

export abstract class AbstractHandler implements IHandler {
  protected readonly _ocppSender: IOcppSender;
  protected readonly _logger: Logger<ILogObj>;

  constructor({ ocppSender, logger }: { ocppSender: IOcppSender; logger: Logger<ILogObj> }) {
    this._ocppSender = ocppSender;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Getters & Setters
   */

  get logger(): Logger<ILogObj> {
    return this._logger;
  }

  public abstract handle(
    message: IMessage<OcppRequest | OcppResponse>,
    props?: HandlerProperties,
  ): Promise<void>;
}
