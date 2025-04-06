// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IMessage, IMessageConfirmation, OcppError, OcppRequest, OcppResponse } from '../..';
import { MessageState } from '.';

/**
 * IMessageSender
 *
 * Represents an interface for sending messages.
 *
 * All implementations of this interface should carry any context from the {@link IMessage}
 * to be sent as metadata in the underlying message transport. This will allow to route
 * messages to the correct module and filter them accordingly.
 */
export interface IMessageSender {
  /**
   * Sends a request message.
   *
   * @param message - The message object.
   * @param payload - The payload object.
   * @returns A promise that resolves to the message confirmation.
   */
  sendRequest(message: IMessage<OcppRequest>, payload?: OcppRequest): Promise<IMessageConfirmation>;

  /**
   * Sends a response message.
   *
   * @param message - The message object.
   * @param payload - The payload object.
   * @returns A promise that resolves to the message confirmation.
   */
  sendResponse(
    message: IMessage<OcppResponse | OcppError>,
    payload?: OcppResponse | OcppError,
  ): Promise<IMessageConfirmation>;

  /**
   * Sends a message.
   *
   * @param message - The message object.
   * @param payload - The payload object.
   * @param state - The message state.
   * @returns A promise that resolves to the message confirmation.
   */
  send(
    message: IMessage<OcppRequest | OcppResponse | OcppError>,
    payload?: OcppRequest | OcppResponse | OcppError,
    state?: MessageState,
  ): Promise<IMessageConfirmation>;

  /**
   * Shuts down the sender.
   */
  shutdown(): Promise<void>; // Turning off the sender
}
