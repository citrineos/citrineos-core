// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Duplex } from 'stream';

export interface IUpgradeError {
  /** The HTTP status {@link terminateConnection} writes. */
  readonly statusCode: number;

  /**
   * Terminates the WebSocket connection by sending an error response and closing the socket.
   * @param {Duplex} socket - The WebSocket duplex stream.
   * @returns {boolean} True if the connection was terminated successfully, false otherwise.
   */
  terminateConnection(socket: Duplex): boolean;
}

export function isUpgradeError(error: unknown): error is IUpgradeError {
  return (
    error instanceof Error &&
    'terminateConnection' in error &&
    typeof error.terminateConnection === 'function' &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  );
}
