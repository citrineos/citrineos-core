// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  IConnectionManager,
  IMessage,
  IMessageConfirmation,
  IMessageSender,
  OcppRequest,
  OcppResponse,
} from '@citrineos/base';
import { AbstractMessageSender, MessageState, OcppError } from '@citrineos/base';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

type AnyMessage = IMessage<OcppRequest | OcppResponse | OcppError>;

/**
 * A decorator around any {@link IMessageSender} that adds resilience when the
 * underlying message broker is unavailable.
 *
 * Behaviour when the broker is **disconnected**:
 * - **Call messages** (`MessageState.Request`): a `maxCallLengthSeconds` timeout is
 *   started.  When it fires the optional {@link onCallTimeout} callback is invoked
 *   (e.g. to close the charger's WebSocket) and the pending entry is removed from
 *   memory to prevent retry accumulation.
 * - **All other messages** (`MessageState.Response` / `MessageState.Unknown`): the
 *   message is held in an in-memory buffer and replayed in order once the broker
 *   reconnects.
 *
 * Behaviour when the broker **reconnects**:
 * - All buffered non-Call messages are flushed in order through the inner sender.
 * - In-flight Call timeouts continue to run (they will still close the WS connection
 *   because the Call was never delivered to a module).
 */
export class BrokerAwareMessageSender extends AbstractMessageSender implements IMessageSender {
  /** Pending non-Call messages waiting to be flushed after reconnection. */
  private _buffer: AnyMessage[] = [];

  /**
   * Active Call timeouts keyed by connection identifier (`tenantId:stationId`).
   * When a timeout fires the entry is deleted and `_onCallTimeout` is invoked.
   */
  private _callTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * Optional callback invoked when a Call times out while the broker is down.
   * Typically used to close the corresponding WebSocket connection.
   * Can be set after construction to avoid circular dependency issues.
   */
  onCallTimeout?: (stationId: string, tenantId: number) => Promise<void>;

  constructor(
    private readonly _inner: IMessageSender,
    private readonly _connectionManager: IConnectionManager,
    private readonly _maxCallLengthSeconds: number,
    logger?: Logger<ILogObj>,
  ) {
    super(logger);

    _connectionManager.on('connected', () => {
      this._flushBuffer().catch((err) => {
        this._logger.error('BrokerAwareMessageSender: error flushing buffer after reconnect', err);
      });
    });

    _connectionManager.on('disconnected', () => {
      this._logger.warn(
        'BrokerAwareMessageSender: broker disconnected – ' +
          'Calls will time out, other messages will be buffered.',
      );
    });
  }

  sendRequest(
    message: IMessage<OcppRequest>,
    payload?: OcppRequest,
  ): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Request);
  }

  sendResponse(
    message: IMessage<OcppResponse | OcppError>,
    payload?: OcppResponse | OcppError,
  ): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Response);
  }

  async send(
    message: AnyMessage,
    payload?: OcppRequest | OcppResponse | OcppError,
    state?: MessageState,
  ): Promise<IMessageConfirmation> {
    if (payload) message.payload = payload;
    if (state) message.state = state;

    if (this._connectionManager.isConnected()) {
      return this._inner.send(message);
    }

    if (message.state === MessageState.Request) {
      return this._handleDisconnectedCall(message as IMessage<OcppRequest>);
    }

    return this._bufferMessage(message);
  }

  async shutdown(): Promise<void> {
    this._clearAllCallTimeouts();
    this._buffer = [];
    await this._inner.shutdown();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Starts a `maxCallLengthSeconds` timer for a Call that cannot be delivered
   * because the broker is down.  On expiry the optional {@link onCallTimeout}
   * callback is invoked and the timeout entry is cleaned up.
   *
   * Returns `{ success: true }` so the router does not immediately send a
   * CallError – the charger will wait until the connection is closed by the timer.
   */
  private _handleDisconnectedCall(message: IMessage<OcppRequest>): IMessageConfirmation {
    const { stationId, tenantId } = message.context;
    const identifier = `${tenantId}:${stationId}`;

    // If a timeout for this identifier is already running, let it be – a second
    // Call from the same station while the first is still pending would be
    // blocked by the router's cache serialisation anyway.
    if (this._callTimeouts.has(identifier)) {
      this._logger.debug(
        `BrokerAwareMessageSender: Call timeout already running for ${identifier}, skipping duplicate.`,
      );
      return { success: true };
    }

    this._logger.warn(
      `BrokerAwareMessageSender: broker down – Call for ${identifier} will close WS ` +
        `in ${this._maxCallLengthSeconds}s if broker does not recover.`,
    );

    const handle = setTimeout(() => {
      this._callTimeouts.delete(identifier);
      this._logger.warn(
        `BrokerAwareMessageSender: Call timeout expired for ${identifier} – closing connection.`,
      );
      if (this.onCallTimeout) {
        this.onCallTimeout(stationId, tenantId).catch((err) => {
          this._logger.error(
            `BrokerAwareMessageSender: error closing connection for ${identifier}`,
            err,
          );
        });
      }
    }, this._maxCallLengthSeconds * 1000);

    this._callTimeouts.set(identifier, handle);

    // Tell the router the message was "accepted" – the timer handles teardown.
    return { success: true };
  }

  /** Adds a non-Call message to the in-memory buffer. */
  private _bufferMessage(message: AnyMessage): IMessageConfirmation {
    this._logger.info(
      `BrokerAwareMessageSender: broker down – buffering message ` +
        `(state=${message.state}) for ${message.context.stationId}.`,
    );
    this._buffer.push(message);
    return { success: true };
  }

  /**
   * Replays all buffered messages through the inner sender.
   * If the broker drops again mid-flush the remaining messages are re-buffered.
   */
  private async _flushBuffer(): Promise<void> {
    if (this._buffer.length === 0) return;

    this._logger.info(
      `BrokerAwareMessageSender: broker reconnected – flushing ${this._buffer.length} buffered message(s).`,
    );

    const toFlush = this._buffer.splice(0);

    for (const message of toFlush) {
      if (!this._connectionManager.isConnected()) {
        // Broker dropped again – re-buffer the rest and stop.
        this._logger.warn(
          'BrokerAwareMessageSender: broker disconnected again during flush – re-buffering remainder.',
        );
        this._buffer.unshift(...toFlush.slice(toFlush.indexOf(message)));
        return;
      }

      try {
        const result = await this._inner.send(message);
        if (!result.success) {
          this._logger.error(
            `BrokerAwareMessageSender: failed to flush message for ${message.context.stationId}:`,
            result.payload,
          );
        }
      } catch (err) {
        this._logger.error(
          `BrokerAwareMessageSender: error flushing message for ${message.context.stationId}:`,
          err,
        );
      }
    }
  }

  private _clearAllCallTimeouts(): void {
    for (const handle of this._callTimeouts.values()) {
      clearTimeout(handle);
    }
    this._callTimeouts.clear();
  }
}
