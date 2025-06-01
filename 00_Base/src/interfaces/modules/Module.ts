// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ICache, OcppError, OcppRequest, OcppResponse, SystemConfig } from '../..';
import { CallAction, OCPPVersionType } from '../../ocpp/rpc/message';
import {
  HandlerProperties,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  MessageOrigin,
} from '../messages';

/**
 * Base interface for all OCPP modules.
 *
 */
export interface IModule {
  config: SystemConfig;
  cache: ICache;
  sender: IMessageSender;
  handler: IMessageHandler;
  sendCall(
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppRequest,
    correlationId?: string,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;
  sendCallResult(
    correlationId: string,
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    payload: OcppResponse,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;
  sendCallError(
    correlationId: string,
    stationId: string,
    tenantId: number,
    protocol: OCPPVersionType,
    action: CallAction,
    error: OcppError,
    origin?: MessageOrigin,
  ): Promise<IMessageConfirmation>;

  handle(message: IMessage<OcppRequest | OcppResponse>, props?: HandlerProperties): Promise<void>;
  shutdown(): Promise<void>;
}
