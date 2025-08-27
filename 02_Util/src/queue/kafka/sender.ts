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
  CircuitBreakerState,
  CircuitBreaker,
} from '@citrineos/base';
import { Admin, Kafka, Producer } from 'kafkajs';
import { ILogObj, Logger } from 'tslog';

/**
 * Implementation of a {@link IMessageSender} using Kafka as the underlying transport.
 */
export class KafkaSender extends AbstractMessageSender implements IMessageSender {
  /**
   * Fields
   */
  private _client: Kafka;
  private _topicName: string;
  private _producers: Array<Producer>;
  private _circuitBreaker: CircuitBreaker;
  private _reconnectInterval?: NodeJS.Timeout;

  /**
   * Constructor
   *
   * @param topicPrefix Custom topic prefix, defaults to "ocpp"
   */
  constructor(config: SystemConfig, logger?: Logger<ILogObj>, circuitBreaker?: CircuitBreaker) {
    super(config, logger);
    this._circuitBreaker = circuitBreaker ?? new CircuitBreaker();
    this._circuitBreaker.onStateChange(this._onCircuitBreakerStateChange.bind(this));
    this._client = new Kafka({
      brokers: config.util.messageBroker.kafka?.brokers || [],
      ssl: true,
      sasl: {
        mechanism: 'plain',
        username: config.util.messageBroker.kafka?.sasl.username || '',
        password: config.util.messageBroker.kafka?.sasl.password || '',
      },
    });
    this._producers = new Array<Producer>();
    this._topicName = `${this._config.util.messageBroker.kafka?.topicPrefix}-${this._config.util.messageBroker.kafka?.topicName}`;
    this._initAdmin();
  }

  private _initAdmin() {
    const admin: Admin = this._client.admin();
    admin
      .connect()
      .then(() => admin.listTopics())
      .then((topics) => {
        if (!topics || topics.filter((topic) => topic === this._topicName).length === 0) {
          this._client
            .admin()
            .createTopics({ topics: [{ topic: this._topicName }] })
            .then(() => {
              this._logger.debug(`Topic ${this._topicName} created.`);
              this._circuitBreaker.triggerSuccess();
            })
            .catch((error) => {
              this._logger.error('Failed to create topic', error);
              this._circuitBreaker.triggerFailure(error?.message);
            });
        } else {
          this._circuitBreaker.triggerSuccess();
        }
      })
      .then(() => admin.disconnect())
      .catch((error) => {
        this._logger.error('Failed to connect to Kafka', error);
        this._circuitBreaker.triggerFailure(error?.message);
      });
  }

  /**
   * Convenience method to send a request message.
   *
   * @param message The {@link IMessage} to send
   * @param payload The payload to send
   * @returns
   */
  sendRequest(
    message: IMessage<OcppRequest>,
    payload?: OcppRequest,
  ): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Request);
  }

  /**
   * Convenience method to send a confirmation message.
   * @param message The {@link IMessage} to send
   * @param payload The payload to send
   * @returns
   */
  sendResponse(
    message: IMessage<OcppResponse | OcppError>,
    payload?: OcppResponse | OcppError,
  ): Promise<IMessageConfirmation> {
    return this.send(message, payload, MessageState.Response);
  }

  /**
   * Publishes the given message to kafka.
   *
   * @param message The {@link IMessage} to publish
   * @param payload The payload to within the {@link IMessage}
   * @param state The {@link MessageState} of the {@link IMessage}
   * @returns
   */
  send(
    message: IMessage<OcppRequest | OcppResponse | OcppError>,
    payload?: OcppRequest | OcppResponse | OcppError,
    state?: MessageState,
  ): Promise<IMessageConfirmation> {
    if (this._circuitBreaker.state === 'CLOSED') {
      return Promise.resolve({
        success: false,
        payload: 'Circuit breaker is CLOSED. Cannot send message.',
      });
    }
    if (payload) {
      message.payload = payload;
    }
    if (state) {
      message.state = state;
    }
    if (!message.state) {
      throw new Error('Message state must be set');
    }
    if (!message.payload) {
      throw new Error('Message payload must be set');
    }
    this._logger.debug(`Publishing to ${this._topicName}:`, message);
    const producer = this._client.producer();
    return producer
      .connect()
      .then(() =>
        producer.send({
          topic: this._topicName,
          messages: [
            {
              headers: {
                origin: message.origin.toString(),
                eventGroup: message.eventGroup.toString(),
                action: message.action.toString(),
                state: message.state.toString(),
                ...message.context,
                tenantId: message.context.tenantId.toString(),
              },
              value: JSON.stringify(message),
            },
          ],
        }),
      )
      .then(() => this._producers.push(producer))
      .then((result) => ({ success: true, result }))
      .catch((error) => {
        this._circuitBreaker.triggerFailure(error?.message);
        return { success: false, error };
      });
  }

  /**
   * Interface implementation
   */
  async shutdown(): Promise<void> {
    for (const producer of this._producers) {
      await producer.disconnect();
    }
  }

  private _onCircuitBreakerStateChange(state: CircuitBreakerState, reason?: string) {
    this._logger.info(`[CircuitBreaker] State changed to ${state}${reason ? `: ${reason}` : ''}`);
    switch (state) {
      case 'FAILING':
        this._logger.warn(
          'Circuit breaker is FAILING. Kafka sender will not send messages until recovery. Reason:',
          reason,
        );
        break;

      case 'CLOSED': {
        this._logger.error(
          'Circuit breaker is CLOSED. Shutting down Kafka sender. Reason:',
          reason,
        );
        void this.shutdown();
        if (this._reconnectInterval) {
          clearInterval(this._reconnectInterval);
        }
        const delay = (this._config.maxReconnectDelay || 30) * 1000;
        this._logger.warn(
          `Starting continuous reconnect attempts every ${delay / 1000} seconds while circuit breaker is CLOSED.`,
        );
        this._reconnectInterval = setInterval(() => {
          this._logger.info('Attempting Kafka reconnect due to circuit breaker CLOSED...');
          try {
            this._initAdmin();
            this._logger.info('Kafka reconnect attempt finished (success or already open).');
          } catch (err) {
            this._logger.error('Kafka reconnect attempt failed.', err);
          }
        }, delay);
        break;
      }

      case 'OPEN':
        this._logger.info(
          'Circuit breaker is OPEN. Will attempt to (re)initialize Kafka admin connection.',
        );
        if (this._reconnectInterval) {
          this._logger.info('Clearing reconnect interval as circuit breaker is now OPEN.');
          clearInterval(this._reconnectInterval);
          this._reconnectInterval = undefined;
        }
        this._initAdmin();
        break;

      default:
        this._logger.warn('Unknown circuit breaker state:', state);
        break;
    }
  }
}
