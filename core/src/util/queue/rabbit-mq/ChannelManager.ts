// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import amqp from 'amqplib';
import { Logger, type ILogObj } from 'tslog';
import type { RabbitMQConnectionManager } from './ConnectionManager.js';

export class RabbitMQChannelManager {
  private channelMap = new Map<string, amqp.Channel | null>();

  protected _logger: Logger<ILogObj>;

  constructor(
    private connectionManager: RabbitMQConnectionManager,
    logger?: Logger<ILogObj>,
  ) {
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    // Recreate channels on reconnection
    connectionManager.on('connected', () => {
      this.recreateChannels().catch((err) => {
        this._logger.error('Error recreating channels after reconnection:', err);
      });
    });

    connectionManager.on('disconnected', () => {
      this._logger.info('Connection lost, clearing channels');
      for (const [id] of this.channelMap) {
        this.channelMap.set(id, null);
      }
    });
  }

  async getChannel(channelId: string): Promise<amqp.Channel> {
    let channel = this.channelMap.get(channelId);

    if (!channel) {
      const connection = await this.connectionManager.connect();
      channel = await connection.createChannel();

      channel.on('error', (err) => {
        this._logger.error(`Channel ${channelId} error:`, err);
        this.channelMap.set(channelId, null);
      });

      channel.on('close', () => {
        this._logger.info(`Channel ${channelId} closed`);
        this.channelMap.set(channelId, null);
      });

      this.channelMap.set(channelId, channel);
    }

    return channel;
  }

  async closeChannel(channelId: string): Promise<void> {
    const channel = this.channelMap.get(channelId);
    if (channel) {
      await channel.close();
      this.channelMap.delete(channelId);
    }
  }

  async closeAll(): Promise<void> {
    for (const [id, channel] of this.channelMap) {
      if (channel) {
        try {
          await channel.close();
        } catch (error) {
          this._logger.error(`Error closing channel ${id}:`, error);
        }
      }
    }
    this.channelMap.clear();
  }

  private async recreateChannels(): Promise<void> {
    for (const [channelId, channel] of this.channelMap) {
      if (channel === null) {
        this.getChannel(channelId).catch((err) => {
          this._logger.error(`Error recreating channel ${channelId}:`, err);
        });
      }
    }
  }
}
