// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import amqp from 'amqplib';
import type { ILogObj, Logger } from 'tslog';
import type { RabbitMQConnectionManager } from './connection-manager.js';

export class RabbitMQChannelManager {
  private channelMap = new Map<string, amqp.Channel | null>();
  private pendingChannels = new Map<string, Promise<amqp.Channel>>();

  protected _logger: Logger<ILogObj>;

  private connectionManager: RabbitMQConnectionManager;

  constructor({
    connectionManager,
    logger,
  }: {
    connectionManager: RabbitMQConnectionManager;
    logger?: Logger<ILogObj>;
  }) {
    this._logger = childLogger(logger, this.constructor.name);

    this.connectionManager = connectionManager;

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
    const channel = this.channelMap.get(channelId);
    if (channel) {
      return channel;
    }

    const inFlight = this.pendingChannels.get(channelId);
    if (inFlight) {
      return inFlight;
    }

    const pending: Promise<amqp.Channel> = this.createChannel(channelId).finally(() => {
      if (this.pendingChannels.get(channelId) === pending) {
        this.pendingChannels.delete(channelId);
      }
    });
    this.pendingChannels.set(channelId, pending);
    return pending;
  }

  async closeChannel(channelId: string): Promise<void> {
    const channel = this.channelMap.get(channelId);
    if (channel) {
      await channel.close();
      this.channelMap.delete(channelId);
    }
  }

  getConnectionManager(): RabbitMQConnectionManager {
    return this.connectionManager;
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

  private async createChannel(channelId: string): Promise<amqp.Channel> {
    const connection = await this.connectionManager.connect();
    const channel = await connection.createChannel();

    const forget = () => {
      if (this.channelMap.get(channelId) === channel) {
        this.channelMap.set(channelId, null);
      }
    };

    channel.on('error', (err) => {
      this._logger.error(`Channel ${channelId} error:`, err);
      forget();
    });

    channel.on('close', () => {
      this._logger.info(`Channel ${channelId} closed`);
      forget();
    });

    this.channelMap.set(channelId, channel);
    return channel;
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
