// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { EventEmitter } from 'events';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { IConnectionManager } from './IConnectionManager.js';

/**
 * Abstract base class for managing a message transport connection.
 *
 * Implementations are responsible for establishing, maintaining, and closing
 * connections to a specific transport backend (e.g. RabbitMQ, Kafka).
 *
 * Emits:
 * - `connected` when a connection is established (with the connection object as argument)
 * - `disconnected` when the connection is lost
 * - `error` on connection errors
 *
 * @template TConnection The transport-specific connection type returned by {@link connect}.
 */
export abstract class AbstractConnectionManager<TConnection = unknown>
  extends EventEmitter
  implements IConnectionManager
{
  protected _logger: Logger<ILogObj>;

  public state: string = 'disconnected';

  constructor(logger?: Logger<ILogObj>) {
    super();
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Establishes a connection to the transport backend.
   * Implementations should handle in-progress connection attempts and
   * return the existing connection if already connected.
   */
  abstract connect(): Promise<TConnection>;

  /**
   * Gracefully closes the connection.
   */
  abstract close(): Promise<void>;

  /**
   * Returns true if there is an active connection.
   */
  abstract isConnected(): boolean;
}
