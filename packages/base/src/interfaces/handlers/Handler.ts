// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { HandlerProperties } from '@interfaces/messages/internal-types.js';
import type { IMessage } from '@interfaces/messages/Message.js';
import type { OcppRequest, OcppResponse } from '@ocpp/internal-types.js';
import { type ILogObj, Logger } from 'tslog';

/**
 * Base interface for all OCPP handler classes.
 */
export interface IHandler {
  logger: Logger<ILogObj>;
  handle(message: IMessage<OcppRequest | OcppResponse>, props?: HandlerProperties): Promise<any>;
}
