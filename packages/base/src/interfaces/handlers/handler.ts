// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { HandlerProperties, OcppRequest, OcppResponse } from '@citrineos/types';
import type { IMessage } from '@interfaces/messages/message.js';

/**
 * Base interface for all OCPP handler classes.
 */
export interface IHandler {
  handle(message: IMessage<OcppRequest | OcppResponse>, props?: HandlerProperties): Promise<any>;
}
