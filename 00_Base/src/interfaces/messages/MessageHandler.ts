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

import { IMessage, OcppRequest, OcppResponse } from "../..";
import { CallAction } from "../../ocpp/rpc/message";
import { IModule } from "../modules";
import { HandlerProperties } from ".";

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
    subscribe(identifier: string, actions?: CallAction[], filter?: { [k: string]: string }): Promise<boolean>;

    /**
     * Unsubscribe from messages. E.g. when a connection drops.
     * 
     * @param identifier - The identifier to unsubscribe from.
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
    shutdown(): void;

    get module(): IModule | undefined;
    set module(value: IModule | undefined);
}