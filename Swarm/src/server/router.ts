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

import { Call, CallAction, CallError, CallResult, EventGroup, ICentralSystem, IClientConnection, IMessage, IMessageConfirmation, IMessageContext, IMessageHandler, IMessageRouter, IMessageSender, LOG_LEVEL_OCPP, MessageOrigin, MessageState, MessageTypeId, OcppRequest, OcppResponse, SystemConfig } from "@citrineos/base";
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

    handle(message: IMessage<OcppRequest | OcppResponse>, context?: IMessageContext): void {

        this._logger.debug("Received message:", message);

        if (message.state === MessageState.Response) {
            let callResult = [MessageTypeId.CallResult, message.context.correlationId, message.payload] as CallResult;
            this._centralSystem.sendCallResult(message.context.stationId, callResult).catch(error => {
                // TODO: Inform module about error
                logger.error('Error sending call result:', error);
            });
        } else if (message.state === MessageState.Request) {
            let call = [MessageTypeId.Call, message.context.correlationId, message.action, message.payload] as Call;
            this._centralSystem.sendCall(message.context.stationId, call).catch(error => {
                // TODO: Inform module about error
                logger.error('Error sending call:', error);
            });
        }
        // TODO: Handle other message types including errors
    }
}

export class OcppMessageRouter implements IMessageRouter {

    private _sender: IMessageSender;
    private _handler: IMessageHandler;

    constructor(sender: IMessageSender, handler: IMessageHandler) {
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
            eventGroup: EventGroup.General, // TODO: Change to appropriate event group based on cache value to allow module to receive responses for requests it sent
            action,
            state: MessageState.Response,
            context,
            payload
        };

        return this._sender.send(_message);
    }

    routeCallError(client: IClientConnection, message: CallError): Promise<IMessageConfirmation> {
        throw new Error('Method not implemented.');
    }

    get sender(): IMessageSender {
        return this._sender;
    }

    get handler(): IMessageHandler {
        return this._handler;
    }
}