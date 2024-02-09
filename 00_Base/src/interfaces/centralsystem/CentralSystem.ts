// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Call, CallError, CallResult } from "../..";
import { IClientConnection } from "./ClientConnection";

/**
 * Interface for the central system
 */
export interface ICentralSystem {

    onCall(connection: IClientConnection, message: Call): void;
    onCallResult(connection: IClientConnection, message: CallResult): void;
    onCallError(connection: IClientConnection, message: CallError): void;

    sendCall(identifier: string, message: Call): Promise<boolean>;
    sendCallResult(identifier: string, message: CallResult): Promise<boolean>;
    sendCallError(identifier: string, message: CallError): Promise<boolean>;

    shutdown(): void;
}