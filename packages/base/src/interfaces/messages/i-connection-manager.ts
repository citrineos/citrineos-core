// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Interface for managing a message transport connection.
 *
 * Implementations connect to a specific transport backend (e.g. RabbitMQ, Kafka)
 * and expose lifecycle events so that dependent components can react to
 * connect/disconnect transitions.
 *
 * Implementations MUST emit the following events (compatible with Node.js EventEmitter):
 * - `connected`    – after a connection is successfully established; argument is the
 *                    transport-specific connection object.
 * - `disconnected` – when the connection is lost.
 * - `error`        – on connection errors; argument is the Error.
 */
export interface IConnectionManager {
  /** Current connection state, e.g. `'connected'`, `'disconnected'`, `'closed'`. */
  readonly state: string;

  /**
   * Establishes a connection to the transport backend.
   * If a connection is already in progress this should wait for it to complete
   * rather than opening a second one.
   */
  connect(): Promise<unknown>;

  /** Gracefully closes the connection and prevents automatic reconnection. */
  close(): Promise<void>;

  /** Returns `true` when an active connection exists. */
  isConnected(): boolean;

  // Minimal EventEmitter surface required by consumers.
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: string | symbol, listener: (...args: any[]) => void): this;
  off(event: string | symbol, listener: (...args: any[]) => void): this;
}
