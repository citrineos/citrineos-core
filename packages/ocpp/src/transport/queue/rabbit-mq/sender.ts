// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type IMessage,
  type IMessageConfirmation,
  type IMessageSender,
  AbstractMessageSender,
  OcppError,
} from '@citrineos/base';
import {
  type OcppRequest,
  type OcppResponse,
  type SystemConfig,
  MessageState,
} from '@citrineos/types';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { RabbitMQChannelManager } from './channel-manager.js';
import { RabbitMQConnectionManager } from './connection-manager.js';
import type { RabbitMqDeadLetterPublisher } from './dead-letter-publisher.js';
import { DeadLetterReason, DeadLetterSource } from '@/transport/metrics.js';
import { toAmqpContent, toAmqpPublish } from './util.js';

/**
 * Implementation of a {@link IMessageSender} using RabbitMQ as the underlying transport.
 */
export class RabbitMqSender extends AbstractMessageSender implements IMessageSender {
  /**
   * Constants
   */
  private static readonly CHANNEL_ID = 'sender';

  /**
   * Fields
   */
  protected _connectionManager: RabbitMQConnectionManager;
  protected _channelManager: RabbitMQChannelManager;

  /**
   * Constructor for the class.
   *
   * @param timeouts - Decides when a message the CSMS sends expires on the broker.
   * @param deadLetterPublisher - Takes a message that is already stale when it is sent.
   * @param {Logger<ILogObj>} [logger] - The logger object.
   */
  constructor(
    private exchange: string,
    connectionManager: RabbitMQConnectionManager,
    channelManager: RabbitMQChannelManager,
    private readonly timeouts: SystemConfig['timeouts'],
    private readonly deadLetterPublisher: RabbitMqDeadLetterPublisher,
    logger?: Logger<ILogObj>,
  ) {
    super(logger);
    this._connectionManager = connectionManager;
    this._channelManager = channelManager;
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
    if (this._connectionManager.isConnected() === false) {
      return { success: false, payload: 'RabbitMQ disconnected. Cannot send message.' };
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

    const publish = toAmqpPublish(message, this.timeouts);
    if (publish.stale) {
      this._logger.info(
        `Dead-lettering ${message.action} for ${message.context.ocppConnectionName}: it went ` +
          `stale before it was sent. correlationId=${message.context.correlationId}`,
      );
      await this.deadLetterPublisher.publishMessage(
        message,
        DeadLetterReason.Stale,
        DeadLetterSource.Sender,
      );
      return { success: false, payload: 'Message went stale before it was sent' };
    }

    const channel = await this._channelManager.getChannel(RabbitMqSender.CHANNEL_ID);
    if (!channel) {
      throw new Error('RabbitMQ is down: cannot send message.');
    }

    this._logger.debug(`Publishing to ${this.exchange}:`, message);

    const success = channel.publish(
      this.exchange || '',
      '',
      toAmqpContent(message),
      publish.options,
    );
    return { success };
  }

  /**
   * Shuts down the sender by closing the client.
   *
   * @return {Promise<void>} A promise that resolves when the client is closed.
   */
  async shutdown(): Promise<void> {
    return;
  }
}
