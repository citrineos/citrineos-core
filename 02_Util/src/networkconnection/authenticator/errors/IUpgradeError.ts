// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { Duplex } from 'stream';

export interface IUpgradeError {
  /**
   * Terminates the WebSocket connection by sending an error response and closing the socket.
   * @param {Duplex} socket - The WebSocket duplex stream.
   * @returns {boolean} True if the connection was terminated successfully, false otherwise.
   */
  terminateConnection(socket: Duplex): boolean;
}
