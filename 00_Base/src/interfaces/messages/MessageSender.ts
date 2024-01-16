/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { IMessage, OcppRequest, IMessageConfirmation, OcppResponse, OcppError } from "../..";
import { MessageState } from ".";

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
    sendResponse(message: IMessage<OcppResponse | OcppError>, payload?: OcppResponse | OcppError): Promise<IMessageConfirmation>;

    /**
     * Sends a message.
     * 
     * @param message - The message object.
     * @param payload - The payload object.
     * @param state - The message state.
     * @returns A promise that resolves to the message confirmation.
     */
    send(message: IMessage<OcppRequest | OcppResponse | OcppError>, payload?: OcppRequest | OcppResponse | OcppError, state?: MessageState): Promise<IMessageConfirmation>;

    /**
     * Shuts down the sender.
     */
    shutdown(): void; // Turning off the sender
}