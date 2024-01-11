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

import { ICentralSystem } from '../..';
import { ErrorCode, CallError, MessageTypeId } from '../../ocpp/rpc/message';

/**
 * Custom error to handle OCPP errors better.
 */
export class OcppError extends Error {

    private _messageId: string;
    private _errorCode: ErrorCode;
    private _errorDetails: object;

    constructor(messageId: string, errorCode: ErrorCode, errorDescription: string, errorDetails: object = {}) {
        super(errorDescription);
        this.name = "OcppError";
        this._messageId = messageId;
        this._errorCode = errorCode;
        this._errorDetails = errorDetails;
    }

    asCallError(): CallError {
        return [MessageTypeId.CallError, this._messageId, this._errorCode, this.message, this._errorDetails] as CallError;
    }

    sendAsCallError(identifier: string, centralSystem: ICentralSystem): void {
        centralSystem.sendCallError(identifier, this.asCallError());
    }
}

/**
 * Interface for the client connection
 */
export interface IClientConnection {
    get identifier(): string;
    get sessionIndex(): string;
    get ip(): string;
    get port(): number;
    get isAlive(): boolean;
    set isAlive(value: boolean);
}

/**
 * Implementation of the client connection
 */
export class ClientConnection implements IClientConnection {

    /**
     * Fields
     */

    private _identifier: string;
    private _sessionIndex: string;
    private _ip: string;
    private _port: number;
    private _isAlive: boolean;

    /**
     * Constructor
     */

    constructor(identifier: string, sessionIndex: string, ip: string, port: number) {
        this._identifier = identifier;
        this._sessionIndex = sessionIndex;
        this._ip = ip;
        this._port = port;
        this._isAlive = false;
    }

    /**
     * Properties
     */

    get identifier(): string {
        return this._identifier;
    }

    get sessionIndex(): string {
        return this._sessionIndex;
    }

    get ip(): string {
        return this._ip;
    }

    get port(): number {
        return this._port;
    }

    get isAlive(): boolean {
        return this._isAlive;
    }

    set isAlive(value: boolean) {
        this._isAlive = value;
    }

    get connectionUrl(): string {
        return `ws://${this._ip}:${this._port}/${this._identifier}`;
    }
}

export { IAdminEndpointDefinition } from './AdminEndpointDefinition';
export { AsAdminEndpoint } from './AsAdminEndpoint';
export { ICentralSystem, AbstractCentralSystem } from './CentralSystem';
export { AbstractCentralSystemApi, ICentralSystemApi } from './CentralSystemApi';

export const METADATA_ADMIN_ENDPOINTS = 'METADATA_ADMIN_ENDPOINTS';

