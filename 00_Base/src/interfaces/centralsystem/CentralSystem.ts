// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Call, CallError, CallResult, IModule, INetworkConnection } from "../..";

/**
 * Interface for the central system
 */
export interface ICentralSystem extends IModule {
    /**
     * Register a connection to the message handler with the given connection identifier.
     *
     * @param {string} connectionIdentifier - the identifier of the connection
     * @return {Promise<boolean>} true if both request and response subscriptions are successful, false otherwise
     */
    registerConnection(connectionIdentifier: string): Promise<boolean>
    deregisterConnection(connectionIdentifier: string): Promise<boolean>

    onCall(identifier: string, message: Call): void;
    onCallResult(identifier: string, message: CallResult): void;
    onCallError(identifier: string, message: CallError): void;

    networkConnection: INetworkConnection;
}