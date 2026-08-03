// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type SystemConfig,
  type HandlerProperties,
  MessageOrigin,
  type OcppRequest,
  type OcppResponse,
  type CallAction,
  type OCPPVersionType,
} from '@citrineos/types';
import { OcppError } from '@ocpp/rpc/message.js';
import type { ICache } from '@interfaces/cache/cache.js';
import type { IMessage } from '@interfaces/messages/Message.js';
import type { IMessageConfirmation } from '@interfaces/messages/MessageConfirmation.js';
import type { IMessageHandler } from '@interfaces/messages/MessageHandler.js';
import type { IMessageSender } from '@interfaces/messages/MessageSender.js';
import type { OCPPValidator } from '@interfaces/modules/OCPPValidator.js';

/**
 * Base interface for all OCPP modules.
 *
 */
export interface IModule {
  config: SystemConfig;
  ocppValidator: OCPPValidator;
  cache: ICache;
  sender: IMessageSender;
  handler: IMessageHandler;
  sendCall(
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppRequest,
    callbackUrl?: string,
    correlationId?: string,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;
  sendCallResult(
    correlationId: string,
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppResponse,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;
  sendCallError(
    correlationId: string,
    ocppConnectionName: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    error: OcppError,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;

  handle(message: IMessage<OcppRequest | OcppResponse>, props?: HandlerProperties): Promise<void>;
  shutdown(): Promise<void>;
}
