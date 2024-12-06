// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Duplex } from 'stream';


export interface IUpgradeError {

    /**
     * Terminates the WebSocket connection by sending an error response and closing the socket.
     * @param {Duplex} socket - The WebSocket duplex stream.
     */
    terminateConnection(socket: Duplex): void;
}