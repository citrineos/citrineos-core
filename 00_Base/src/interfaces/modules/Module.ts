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

import { OcppRequest, OcppResponse, SystemConfig } from "../..";
import { CallAction } from "../../ocpp/rpc/message";
import { HandlerProperties, IMessage, IMessageConfirmation, IMessageHandler, IMessageSender, MessageOrigin } from "../messages";

/**
 * Base interface for all OCPP modules.
 * 
 */
export interface IModule {

    sendCall(identifier: string, tenantId: string, action: CallAction, payload: OcppRequest, origin?: MessageOrigin): Promise<IMessageConfirmation>;
    sendCallResult(correlationId: string, identifier: string, tenantId: string, action: CallAction, payload: OcppResponse, origin?: MessageOrigin): Promise<IMessageConfirmation>;
    sendCallResultWithMessage(message: IMessage<OcppResponse>, payload: OcppResponse): Promise<IMessageConfirmation>

    handle(message: IMessage<OcppRequest | OcppResponse>, props?: HandlerProperties): void;
    shutdown(): void;

    config: SystemConfig;
    sender: IMessageSender;
    handler: IMessageHandler;
}