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

import { Call, CallAction, CallError, CallResult, EventGroup, ICache, ICentralSystem, IClientConnection, IMessage, IMessageConfirmation, IMessageContext, IMessageHandler, IMessageRouter, IMessageSender, LOG_LEVEL_OCPP, MessageOrigin, MessageState, MessageTypeId, OcppError, OcppRequest, OcppResponse, SystemConfig } from "@citrineos/base";
import { RabbitMqReceiver } from "@citrineos/util";
import { ILogObj, Logger } from "tslog";

const logger = new Logger({ name: "OCPPMessageRouter" });

/**
 * Implementation of a message handler utilizing {@link RabbitMqReceiver} as the underlying transport.
 */
export class CentralSystemMessageHandler extends RabbitMqReceiver {

    /**
     * Fields
     */

    private _centralSystem: ICentralSystem;

    /**
     * Constructor
     * 
     * @param centralSystem Central system implementation to use
     */

    constructor(systemConfig: SystemConfig, centralSystem: ICentralSystem, logger?: Logger<ILogObj>) {
        super(systemConfig, logger);
        this._centralSystem = centralSystem;
    }

    /**
     * Methods
     */

    async handle(message: IMessage<OcppRequest | OcppResponse | OcppError>, context?: IMessageContext): Promise<void> {

        logger.debug("Received message:", message);

        if (message.state === MessageState.Response) {
            if (message.payload instanceof OcppError) {
                let callError = (message.payload as OcppError).asCallError();
                await this._centralSystem.sendCallError(message.context.stationId, callError);
            } else {
                let callResult = [MessageTypeId.CallResult, message.context.correlationId, message.payload] as CallResult;
                await this._centralSystem.sendCallResult(message.context.stationId, callResult);
            }
        } else if (message.state === MessageState.Request) {
            let call = [MessageTypeId.Call, message.context.correlationId, message.action, message.payload] as Call;
            await this._centralSystem.sendCall(message.context.stationId, call);
        }
    }
}

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

    async registerConnection(client: IClientConnection): Promise<boolean> {
        const requestSubscription = await this.handler.subscribe(client.identifier, undefined, {
            stationId: client.identifier,
            state: MessageState.Request.toString(),
            origin: MessageOrigin.CentralSystem.toString()
        });

        const responseSubscription = await this.handler.subscribe(client.identifier, undefined, {
            stationId: client.identifier,
            state: MessageState.Response.toString(),
            origin: MessageOrigin.ChargingStation.toString()
        });

        return requestSubscription && responseSubscription;
    }

    routeCall(client: IClientConnection, message: Call): Promise<IMessageConfirmation> {
        let messageId = message[1];
        let action = message[2] as CallAction;
        let payload = message[3] as OcppRequest;

        // TODO: Add tenantId to context
        let context: IMessageContext = { correlationId: messageId, stationId: client.identifier, tenantId: '' };

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

    routeCallResult(client: IClientConnection, message: CallResult, action: CallAction): Promise<IMessageConfirmation> {
        let messageId = message[1];
        let payload = message[2] as OcppResponse;

        // TODO: Add tenantId to context
        let context: IMessageContext = { correlationId: messageId, stationId: client.identifier, tenantId: '' };

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

    routeCallError(client: IClientConnection, message: CallError, action: CallAction): Promise<IMessageConfirmation> {
        let messageId = message[1];
        let payload = new OcppError(messageId, message[2], message[3], message[4]);

        // TODO: Add tenantId to context
        let context: IMessageContext = { correlationId: messageId, stationId: client.identifier, tenantId: '' };

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