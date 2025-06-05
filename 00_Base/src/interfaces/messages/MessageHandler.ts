// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IMessage, OcppRequest, OcppResponse } from '../..';
import { CallAction } from '../../ocpp/rpc/message';
import { IModule } from '../modules';
import { HandlerProperties } from '.';

/**
 * MessageHandler
 *
 * The interface for all message handlers.
 *
 */
export interface IMessageHandler {
  /**
   * Subscribes to messages based on actions and context filters.
   *
   * @param identifier - The identifier to subscribe for.
   * @param actions - Optional. The list of call actions to subscribe to.
   * @param filter - Optional. An additional message context filter. **Note**: Might not be supported by all implementations. @see {@link IMessageContext} for available attributes.
   * @returns A promise that resolves to a boolean value indicating whether the initialization was successful.
   */
  subscribe(
    identifier: string,
    actions?: CallAction[],
    filter?: { [k: string]: string },
  ): Promise<boolean>;

  /**
   * Unsubscribe from messages. E.g. when a connection drops.
   *
   * @param identifier - The identifier to unsubscribe from.
   * @returns A promise that resolves to a boolean value indicating whether the unsubscription was successful.
   */
  unsubscribe(identifier: string): Promise<boolean>;

  /**
   * Handles incoming messages.
   * @param message - The message to be handled.
   * @param props - Optional properties for the handler.
   */
  handle(message: IMessage<OcppRequest | OcppResponse>, props?: HandlerProperties): void;

  /**
   * Shuts down the handler. Unregister all handlers and opening up any resources.
   */
  shutdown(): Promise<void>;

  get module(): IModule | undefined;
  set module(value: IModule | undefined);

  initConnection(): Promise<void>;
}
