// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import Ajv, { ErrorObject } from "ajv";
import { ICentralSystem } from "./CentralSystem";
import { Call, CallAction, CallError, CallResult, ICache, SystemConfig, CALL_SCHEMA_MAP, CALL_RESULT_SCHEMA_MAP, IMessageConfirmation, MessageOrigin, OcppError, OcppRequest, OcppResponse, IMessageHandler, IMessageSender, IMessage, MessageState } from "../..";
import { ILogObj, Logger } from "tslog";

export abstract class AbstractCentralSystem implements ICentralSystem {

    /**
     * Fields
     */

    protected _ajv: Ajv;
    protected _cache: ICache;
    protected _config: SystemConfig;
    protected _logger: Logger<ILogObj>;
    protected readonly _handler: IMessageHandler;
    protected readonly _sender: IMessageSender;

    /**
     * Constructor of abstract central system.
     *
     * @param {Ajv} ajv - The Ajv instance to use for schema validation.
     */
    constructor(config: SystemConfig, cache: ICache, handler: IMessageHandler, sender: IMessageSender, logger?: Logger<ILogObj>,  ajv?: Ajv) {
        this._config = config;
        this._cache = cache;
        this._handler = handler;
        this._sender = sender;
        this._ajv = ajv || new Ajv({ removeAdditional: 'all', useDefaults: true, coerceTypes: 'array', strict: false });
        this._logger = logger ? logger.getSubLogger({ name: this.constructor.name }) : new Logger<ILogObj>({ name: this.constructor.name });

        // Set module for proper message flow.
        this._handler.module = this;
    }

    /**
     * Getters & Setters
     */

    get cache(): ICache {
        return this._cache;
    }

    get sender(): IMessageSender {
        return this._sender;
    }

    get handler(): IMessageHandler {
        return this._handler;
    }

    /**
     * Sets the system configuration for the module.
     *
     * @param {SystemConfig} config - The new configuration to set.
     */
    set config(config: SystemConfig) {
        this._config = config;
        // Update all necessary settings for hot reload
        this._logger.info(`Updating system configuration for central system...`);
        this._logger.settings.minLevel = this._config.logLevel;
    }

    get config(): SystemConfig {
        return this._config;
    }

    abstract onCall(identifier: string, message: Call): void;
    abstract onCallResult(identifier: string, message: CallResult): void;
    abstract onCallError(identifier: string, message: CallError): void;

    abstract sendCall(identifier: string, tenantId: string, action: CallAction, payload: OcppRequest, correlationId?: string, origin?: MessageOrigin): Promise<IMessageConfirmation>;
    abstract sendCallResult(correlationId: string, identifier: string, tenantId: string, action: CallAction, payload: OcppResponse, origin?: MessageOrigin): Promise<IMessageConfirmation>;
    abstract sendCallError(correlationId: string, identifier: string, tenantId: string, action: CallAction, error: OcppError, origin?: MessageOrigin): Promise<IMessageConfirmation>;


    abstract shutdown(): void;

    /**
     * Public Methods
     */

    async registerConnection(connectionIdentifier: string): Promise<boolean> {
        const requestSubscription = await this._handler.subscribe(connectionIdentifier, undefined, {
            stationId: connectionIdentifier,
            state: MessageState.Request.toString(),
            origin: MessageOrigin.CentralSystem.toString()
        });

        const responseSubscription = await this._handler.subscribe(connectionIdentifier, undefined, {
            stationId: connectionIdentifier,
            state: MessageState.Response.toString(),
            origin: MessageOrigin.ChargingStation.toString()
        });

        return requestSubscription && responseSubscription;
    }

    async deregisterConnection(connectionIdentifier: string): Promise<boolean> {
        // TODO: ensure that all queue implementations in 02_Util only unsubscribe 1 queue per call
        // ...which will require refactoring this method to unsubscribe request and response queues separately
        return await this._handler.unsubscribe(connectionIdentifier)
    }

    async handle(message: IMessage<OcppRequest | OcppResponse>): Promise<void> {
        this._logger.debug("Received message:", message);

        if (message.state === MessageState.Response) {
            if (message.payload instanceof OcppError) {
                await this.sendCallError(message.context.correlationId, message.context.stationId, message.context.tenantId, message.action, message.payload, message.origin);
            } else {
                await this.sendCallResult(message.context.correlationId, message.context.stationId, message.context.tenantId, message.action, message.payload, message.origin);
            }
        } else if (message.state === MessageState.Request) {
            await this.sendCall(message.context.stationId, message.context.tenantId, message.action, message.payload, message.context.correlationId, message.origin);
        }
    }

    /**
     * Protected Methods
     */

    /**
     * Validates a Call object against its schema.
     * 
     * @param {string} identifier - The identifier of the EVSE.
     * @param {Call} message - The Call object to validate.
     * @return {boolean} - Returns true if the Call object is valid, false otherwise.
     */
    protected _validateCall(identifier: string, message: Call): { isValid: boolean, errors?: ErrorObject[] | null } {
        const action = message[2] as CallAction;
        const payload = message[3];

        const schema = CALL_SCHEMA_MAP.get(action);
        if (schema) {
            const validate = this._ajv.compile(schema);
            const result = validate(payload);
            if (!result) {
                this._logger.debug('Validate Call failed', validate.errors);
                return { isValid: false, errors: validate.errors };
            } else {
                return { isValid: true };
            }
        } else {
            this._logger.error("No schema found for action", action, message);
            return { isValid: false }; // TODO: Implement config for this behavior
        }
    }

    /**
     * Validates a CallResult object against its schema.
     *
     * @param {string} identifier - The identifier of the EVSE.
     * @param {CallAction} action - The original CallAction.
     * @param {CallResult} message - The CallResult object to validate.
     * @return {boolean} - Returns true if the CallResult object is valid, false otherwise.
     */
    protected _validateCallResult(identifier: string, action: CallAction, message: CallResult): { isValid: boolean, errors?: ErrorObject[] | null } {
        const payload = message[2];

        const schema = CALL_RESULT_SCHEMA_MAP.get(action);
        if (schema) {
            const validate = this._ajv.compile(schema);
            const result = validate(payload);
            if (!result) {
                this._logger.debug('Validate CallResult failed', validate.errors);
                return { isValid: false, errors: validate.errors };
            } else {
                return { isValid: true };
            }
        } else {
            this._logger.error("No schema found for call result with action", action, message);
            return { isValid: false }; // TODO: Implement config for this behavior
        }
    }
}
