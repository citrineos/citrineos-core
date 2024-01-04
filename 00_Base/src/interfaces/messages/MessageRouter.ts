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

import { IMessageConfirmation, IMessageHandler, IMessageSender } from "../..";
import { Call, CallAction, CallError, CallResult } from "../../ocpp/rpc/message";
import { IClientConnection } from "../server";

/**
 * MessageRouter
 * 
 * The interface for all message routers.
 */
export interface IMessageRouter {
    // API
    registerConnection(client: IClientConnection): Promise<boolean>;
    // TODO: Add route for "unknown" messages
    routeCall(client: IClientConnection, message: Call): Promise<IMessageConfirmation>;
    routeCallResult(client: IClientConnection, message: CallResult, action: CallAction): Promise<IMessageConfirmation>;
    routeCallError(client: IClientConnection, message: CallError): Promise<IMessageConfirmation>;
    // Getter & Setter
    get sender(): IMessageSender;
    get handler(): IMessageHandler;
}