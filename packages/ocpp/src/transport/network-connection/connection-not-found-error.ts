// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Thrown when a message is sent to a station whose websocket is not held by this instance: it
 * disconnected, or is connected to another one.
 */
export class ConnectionNotFoundError extends Error {
  constructor(readonly identifier: string) {
    super(`Websocket connection not found for ${identifier}`);
    this.name = 'ConnectionNotFoundError';
  }
}
