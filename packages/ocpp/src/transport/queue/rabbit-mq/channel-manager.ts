// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { EventEmitter } from 'node:events';
import amqp from 'amqplib';
import { childLogger } from '@citrineos/base';
import type { ILogObj, Logger } from 'tslog';
import type { RabbitMQConnectionManager } from './connection-manager.js';

export class RabbitMQChannelManager extends EventEmitter {
  private channelMap = new Map<string, amqp.Channel | null>();
  private pendingChannels = new Map<string, Promise<amqp.Channel>>();
  private intentionallyClosing = new Set<amqp.Channel>();

  protected _logger: Logger<ILogObj>;

  private connectionManager: RabbitMQConnectionManager;

  constructor({
    connectionManager,
    logger,
  }: {
    connectionManager: RabbitMQConnectionManager;
    logger?: Logger<ILogObj>;
  }) {
    super();
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
    let channel = this.channelMap.get(channelId);

    if (!channel) {
      let pending = this.pendingChannels.get(channelId);
      if (!pending) {
        pending = this.createChannel(channelId);
        this.pendingChannels.set(channelId, pending);
      }
      try {
        channel = await pending;
      } finally {
        if (this.pendingChannels.get(channelId) === pending) {
          this.pendingChannels.delete(channelId);
        }
      }
    }

    return channel;
  }

  async closeChannel(channelId: string): Promise<void> {
    const channel = this.channelMap.get(channelId);
    if (channel) {
      this.intentionallyClosing.add(channel);
      try {
        await channel.close();
      } finally {
        this.intentionallyClosing.delete(channel);
        if (this.channelMap.get(channelId) === channel) {
          this.channelMap.delete(channelId);
        }
      }
    }
  }

  getConnectionManager(): RabbitMQConnectionManager {
    return this.connectionManager;
  }

  async closeAll(): Promise<void> {
    for (const [id, channel] of this.channelMap) {
      if (channel) {
        this.intentionallyClosing.add(channel);
        try {
          await channel.close();
        } catch (error) {
          this._logger.error(`Error closing channel ${id}:`, error);
        } finally {
          this.intentionallyClosing.delete(channel);
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

  private async createChannel(channelId: string): Promise<amqp.Channel> {
    const connection = await this.connectionManager.connect();
    const channel = await connection.createChannel();
    const invalidate = (reason: 'error' | 'close', error?: Error) => {
      if (reason === 'error') {
        this._logger.error(`Channel ${channelId} error:`, error);
      } else {
        this._logger.info(`Channel ${channelId} closed`);
      }
      if (this.channelMap.get(channelId) !== channel) return;
      this.channelMap.set(channelId, null);
      if (!this.intentionallyClosing.has(channel)) {
        this.emit('channelInvalidated', channelId);
      }
    };

    channel.on('error', (error) => invalidate('error', error));
    channel.on('close', () => invalidate('close'));
    this.channelMap.set(channelId, channel);
    return channel;
  }
}
