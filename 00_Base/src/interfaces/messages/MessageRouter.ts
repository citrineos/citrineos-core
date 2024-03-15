// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { EventGroup, ICache, IMessage, IMessageConfirmation, IMessageContext, IMessageHandler, IMessageSender, MessageOrigin, MessageState, OcppRequest, OcppResponse } from "../..";
import { Call, CallAction, CallError, CallResult, OcppError } from "../../ocpp/rpc/message";

/**
 * MessageRouter
 * 
 * The interface for all message routers.
 */
export interface IMessageRouter {
    // API
    // TODO: Add route for "unknown" messages
    routeCall(connectionIdentifier: string, message: Call): Promise<IMessageConfirmation>;
    routeCallResult(connectionIdentifier: string, message: CallResult, action: CallAction): Promise<IMessageConfirmation>;
    routeCallError(connectionIdentifier: string, message: CallError, action: CallAction): Promise<IMessageConfirmation>;
    // Getter & Setter
    get sender(): IMessageSender;
    get handler(): IMessageHandler;
}

/**
 * Default implementation of the {@link IMessageRouter} interface.
 */
export class OcppMessageRouter implements IMessageRouter {

    public readonly CALLBACK_URL_CACHE_PREFIX: string = "CALLBACK_URL_";

    private _cache: ICache;
    private _sender: IMessageSender;
    private _handler: IMessageHandler;

    constructor(cache: ICache, sender: IMessageSender, handler: IMessageHandler) {
        this._cache = cache;
        this._sender = sender;
        this._handler = handler;
    }

    async routeCall(connectionIdentifier: string, message: Call): Promise<IMessageConfirmation> {
        const messageId = message[1];
        const action = message[2] as CallAction;
        const payload = message[3] as OcppRequest;

        // TODO: Add tenantId to context
        const context: IMessageContext = { correlationId: messageId, stationId: connectionIdentifier, tenantId: '' };

        // TODO: Use base util builder instead
        const _message: IMessage<OcppRequest> = {
            origin: MessageOrigin.ChargingStation,
            eventGroup: EventGroup.General, // TODO: Change to appropriate event group
            action,
            state: MessageState.Request,
            context,
            payload
        };

        return this._sender.send(_message);
    }

    async routeCallResult(connectionIdentifier: string, message: CallResult, action: CallAction): Promise<IMessageConfirmation> {
        const messageId = message[1];
        const payload = message[2] as OcppResponse;

        // TODO: Add tenantId to context
        const context: IMessageContext = { correlationId: messageId, stationId: connectionIdentifier, tenantId: '' };

        const _message: IMessage<OcppRequest> = {
            origin: MessageOrigin.CentralSystem,
            eventGroup: EventGroup.General,
            action,
            state: MessageState.Response,
            context,
            payload
        };

        return this._sender.send(_message);
    }

    async routeCallError(connectionIdentifier: string, message: CallError, action: CallAction): Promise<IMessageConfirmation> {
        const messageId = message[1];
        const payload = new OcppError(messageId, message[2], message[3], message[4]);

        // TODO: Add tenantId to context
        const context: IMessageContext = { correlationId: messageId, stationId: connectionIdentifier, tenantId: '' };

        const _message: IMessage<OcppError> = {
            origin: MessageOrigin.CentralSystem,
            eventGroup: EventGroup.General,
            action,
            state: MessageState.Response,
            context,
            payload
        };

        // Fulfill callback for api, if needed
        this.handleMessageApiCallback(_message);

        // No error routing currently done
        throw new Error('Method not implemented.');
    }

    async handleMessageApiCallback(message: IMessage<OcppError>): Promise<void> {
        const url: string | null = await this._cache.get(message.context.correlationId, this.CALLBACK_URL_CACHE_PREFIX + message.context.stationId);
        if (url) {
            await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(message.payload)
            });
        }
    }

    get sender(): IMessageSender {
        return this._sender;
    }

    get handler(): IMessageHandler {
        return this._handler;
    }
}