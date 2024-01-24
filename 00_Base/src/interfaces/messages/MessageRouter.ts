// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IMessageConfirmation, IMessageHandler, IMessageSender } from "../..";
import { Call, CallAction, CallError, CallResult } from "../../ocpp/rpc/message";
import { IClientConnection } from "../centralsystem";

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
    routeCallError(client: IClientConnection, message: CallError, action: CallAction): Promise<IMessageConfirmation>;
    // Getter & Setter
    get sender(): IMessageSender;
    get handler(): IMessageHandler;
}