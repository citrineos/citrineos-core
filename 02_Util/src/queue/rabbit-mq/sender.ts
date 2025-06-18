// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractMessageSender,
  IMessage,
  IMessageConfirmation,
  IMessageSender,
  MessageState,
  OcppError,
  OcppRequest,
  OcppResponse,
  SystemConfig,
} from '@citrineos/base';
import * as amqplib from 'amqplib';
import { instanceToPlain } from 'class-transformer';
import { ILogObj, Logger } from 'tslog';
import { CircuitBreakerState } from '../../../../00_Base/src/interfaces/modules/CircuitBreaker';
import { CircuitBreaker } from '../../../../00_Base/src/util/CircuitBreaker';

/**
 * Implementation of a {@link IMessageSender} using RabbitMQ as the underlying transport.
 */
export class RabbitMqSender extends AbstractMessageSender implements IMessageSender {
  /**
   * Constants
   */
  private static readonly QUEUE_PREFIX = 'amqp_queue_';
  private static readonly RECONNECT_DELAY = 5000;

  /**
   * Fields
   */
  protected _connection?: amqplib.Connection;
  protected _channel?: amqplib.Channel;
  private _reconnecting = false;
  private _abortReconnectController?: AbortController;
  private _circuitBreaker: CircuitBreaker;

  /**
   * Constructor for the class.
   *
   * @param {SystemConfig} config - The system configuration.
   * @param {Logger<ILogObj>} [logger] - The logger object.
   */
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, circuitBreaker?: CircuitBreaker) {
    super(config, logger);
    if (!circuitBreaker) throw new Error('CircuitBreaker instance required');
    this._circuitBreaker = circuitBreaker;
    this._circuitBreaker.onStateChange(this._onCircuitBreakerStateChange.bind(this));
    this._connectWithRetry()
      .then((channel) => {
        this._channel = channel;
      })
      .catch((error) => {
        this._logger.error('Failed to connect to RabbitMQ', error);
      });
  }

  /**
   * Methods
   */

  /**
   * Sends a request message with an optional payload and returns a promise that resolves to the confirmation message.
   *
   * @param {IMessage<OcppRequest>} message - The message to be sent.
   * @param {OcppRequest | undefined} payload - The optional payload to be sent with the message.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the confirmation message.
   */
  sendRequest(
    message: IMessage<OcppRequest>,
    payload?: OcppRequest | undefined,
  ): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Request);
  }

  /**
   * Sends a response message and returns a promise of the message confirmation.
   *
   * @param {IMessage<OcppResponse | OcppError>} message - The message to send.
   * @param {OcppResponse | OcppError} payload - The payload to include in the response.
   * @return {Promise<IMessageConfirmation>} - A promise that resolves to the message confirmation.
   */
  sendResponse(
    message: IMessage<OcppResponse | OcppError>,
    payload?: OcppResponse | OcppError,
  ): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Response);
  }

  /**
   * Sends a message and returns a promise that resolves to a message confirmation.
   *
   * @param {IMessage<OcppRequest | OcppResponse | OcppError>} message - The message to be sent.
   * @param {OcppRequest | OcppResponse | OcppError} [payload] - The payload to be included in the message.
   * @param {MessageState} [state] - The state of the message.
   * @return {Promise<IMessageConfirmation>} - A promise that resolves to a message confirmation.
   */
  async send(
    message: IMessage<OcppRequest | OcppResponse | OcppError>,
    payload?: OcppRequest | OcppResponse | OcppError,
    state?: MessageState,
  ): Promise<IMessageConfirmation> {
    if (this._circuitBreaker.state === 'CLOSED') {
      return { success: false, payload: 'Circuit breaker is CLOSED. Cannot send message.' };
    }

    if (payload) {
      message.payload = payload;
    }

    if (state) {
      message.state = state;
    }

    if (!message.state) {
      return { success: false, payload: 'Message state must be set' };
    }

    if (!message.payload) {
      return { success: false, payload: 'Message payload must be set' };
    }

    const exchange = this._config.util.messageBroker.amqp?.exchange as string;
    if (!this._channel) {
      throw new Error('RabbitMQ is down: cannot unsubscribe.');
    }
    const channel = this._channel;

    this._logger.debug(`Publishing to ${exchange}:`, message);

    const success = channel.publish(
      exchange || '',
      '',
      Buffer.from(JSON.stringify(instanceToPlain(message)), 'utf-8'),
      {
        contentEncoding: 'utf-8',
        contentType: 'application/json',
        headers: {
          origin: message.origin.toString(),
          eventGroup: message.eventGroup.toString(),
          action: message.action.toString(),
          state: message.state.toString(),
          ...message.context,
          tenantId: message.context.tenantId.toString(),
        },
      },
    );
    return { success };
  }

  /**
   * Shuts down the sender by closing the client.
   *
   * @return {Promise<void>} A promise that resolves when the client is closed.
   */
  shutdown(): Promise<void> {
    this._abortReconnectController?.abort();
    return Promise.resolve();
  }

  /**
   * Protected Methods
   */

  /**
   * Connect to RabbitMQ with retry logic.
   * This method will keep trying to connect until successful, unless aborted.
   *
   * @param {AbortSignal} [abortSignal] - Optional abort signal to stop retrying.
   * @return {Promise<amqplib.Channel>} A promise that resolves to the AMQP channel.
   */
  protected async _connectWithRetry(abortSignal?: AbortSignal): Promise<amqplib.Channel> {
    const url = this._config.util.messageBroker.amqp?.url;
    if (!url) {
      throw new Error('RabbitMQ URL is not configured');
    }
    while (true) {
      if (abortSignal?.aborted) {
        this._logger.warn('RabbitMQ reconnect aborted by signal.');
        throw new Error('RabbitMQ reconnect aborted');
      }
      if (this._circuitBreaker.state === 'CLOSED') {
        throw new Error('Circuit breaker is CLOSED. Cannot connect to RabbitMQ.');
      }
      try {
        const connection = await amqplib.connect(url);
        this._connection = connection;
        const channel = await connection.createChannel();
        channel.on('error', (err) => {
          this._logger.error('AMQP channel error', err);
        });
        this._setupConnectionListeners();
        this._circuitBreaker.triggerSuccess();
        return channel;
      } catch (err) {
        this._logger.error('RabbitMQ connect failed, triggering circuit breaker failure', err);
        this._circuitBreaker.triggerFailure((err as Error)?.message);
        await new Promise((res) => setTimeout(res, 1000));
      }
    }
  }

  private _onCircuitBreakerStateChange(state: CircuitBreakerState, reason?: string) {
    if (state === 'CLOSED') {
      this._logger.error('Circuit breaker CLOSED: shutting down RabbitMQ sender. Reason:', reason);
      void this.shutdown();
    }
    if (state === 'OPEN') {
      this._logger.info('Circuit breaker OPEN: attempting to re-initialize RabbitMQ connection.');
      this._connectWithRetry()
        .then((channel) => {
          this._channel = channel;
        })
        .catch((err) => {
          this._logger.error(
            'Failed to re-initialize RabbitMQ connection after circuit breaker OPEN',
            err,
          );
        });
    }
  }

  /**
   * Setup listeners for connection and channel events.
   * This will handle disconnections and errors.
   * Ensures listeners are not attached multiple times to the same connection.
   */
  private _setupConnectionListeners() {
    if (this._connection) {
      // Only attach listeners if not already attached to this connection
      if ((this._connection as any)._listenersAttached) return;
      this._connection.removeAllListeners('close');
      this._connection.removeAllListeners('error');
      this._connection.on('close', () => this._handleDisconnect());
      this._connection.on('error', () => this._handleDisconnect());
      (this._connection as any)._listenersAttached = true;
    }
  }

  /**
   * Handle RabbitMQ disconnection.
   * This method will attempt to reconnect to RabbitMQ when the connection is lost.
   * Debounces concurrent reconnects.
   */
  private async _handleDisconnect() {
    this._logger.warn('RabbitMQ connection lost. Triggering circuit breaker failure.');
    this._connection = undefined;
    this._channel = undefined;
    this._circuitBreaker.triggerFailure('RabbitMQ connection lost');
  }
}
