// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { IClientConnection } from "@citrineos/base";

/**
 * Implementation of the client connection
 */
export class ClientConnectionImpl implements IClientConnection {

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