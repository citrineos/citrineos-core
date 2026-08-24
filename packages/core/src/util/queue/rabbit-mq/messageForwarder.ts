// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RabbitMQChannelManager, RabbitMQConnectionManager } from '@/util/index.js';
import { type ILogObj, Logger } from 'tslog';
import { instanceToPlain } from 'class-transformer';

/**
 * Forwards messages to the Messages module
 */
export class RabbitMqMessageForwarder {
  private readonly _channelId = 'messageForwarder';

  private readonly _exchange: string = 'messages';

  protected _logger: Logger<ILogObj>;
  protected _connectionManager: RabbitMQConnectionManager;
  protected _channelManager: RabbitMQChannelManager;

  constructor(
    connectionManager: RabbitMQConnectionManager,
    channelManager: RabbitMQChannelManager,
    logger?: Logger<ILogObj>,
  ) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._connectionManager = connectionManager;
    this._channelManager = channelManager;
  }

  async forward(payload: object, tenantId: number) {
    if (!this._connectionManager.isConnected()) {
      return { success: false, payload: 'RabbitMQ disconnected. Cannot forward message.' };
    }

    const channel = await this._channelManager.getChannel(this._channelId);
    if (!channel) {
      throw new Error('RabbitMQ is down: cannot send message.');
    }

    this._logger.debug(`Forwarding message to ${this._exchange}:`, payload);

    channel.publish(
      this._exchange || '',
      '',
      Buffer.from(JSON.stringify(instanceToPlain(payload)), 'utf-8'),
      {
        contentEncoding: 'utf-8',
        contentType: 'application/json',
        headers: {
          tenantId,
        },
      },
    );
  }
}
