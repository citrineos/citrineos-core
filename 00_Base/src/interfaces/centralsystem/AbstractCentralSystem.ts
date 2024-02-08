// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import Ajv, { ErrorObject } from "ajv";
import { ICentralSystem } from "./CentralSystem";
import { Call, CallAction, CallError, CallResult, ICache, SystemConfig, CALL_SCHEMA_MAP, CALL_RESULT_SCHEMA_MAP } from "../..";
import { ILogObj, Logger } from "tslog";
import { IClientConnection } from "./ClientConnection";

export abstract class AbstractCentralSystem implements ICentralSystem {

    /**
     * Fields
     */

    protected _ajv: Ajv;
    protected _cache?: ICache;
    protected _config: SystemConfig;
    protected _logger: Logger<ILogObj>;

    /**
     * Constructor of abstract central system.
     *
     * @param {Ajv} ajv - The Ajv instance to use for schema validation.
     */
    constructor(config: SystemConfig, logger?: Logger<ILogObj>, blacklistCache?: ICache, ajv?: Ajv) {
        this._config = config;
        this._cache = blacklistCache;
        this._ajv = ajv || new Ajv({ removeAdditional: 'all', useDefaults: true, coerceTypes: 'array', strict: false });
        this._logger = logger ? logger.getSubLogger({ name: this.constructor.name }) : new Logger<ILogObj>({ name: this.constructor.name });
    }

    abstract onCall(connection: IClientConnection, message: Call): void;
    abstract onCallResult(connection: IClientConnection, message: CallResult): void;
    abstract onCallError(connection: IClientConnection, message: CallError): void;

    abstract sendCall(identifier: string, message: Call): Promise<boolean>;
    abstract sendCallResult(identifier: string, message: CallResult): Promise<boolean>;
    abstract sendCallError(identifier: string, message: CallError): Promise<boolean>;

    abstract shutdown(): void;

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
