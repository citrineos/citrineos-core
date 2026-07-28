// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type ILogObj, Logger } from 'tslog';
import { type HandlerProperties, type IMessage } from '@interfaces/messages/index.js';
import type { OcppRequest, OcppResponse } from '@ocpp/internal-types.js';
import type { IHandler } from '@interfaces/handlers/Handler.js';

export interface AbstractHandlerDependencies {
  logger: Logger<ILogObj>;
}

export abstract class AbstractHandler implements IHandler {
  protected readonly _logger: Logger<ILogObj>;
  protected readonly createHandlerReceivedMessageLog = (messageType: string) =>
    `Handler for ${messageType} received message:`;

  constructor(logger: Logger<ILogObj>) {
    this._logger = logger;
  }

  public abstract handle(
    message: IMessage<OcppRequest | OcppResponse>,
    props?: HandlerProperties,
  ): Promise<void>;
}
