// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AbstractConnectionManager } from '@citrineos/base';
import amqp from 'amqplib';
import { type ILogObj, Logger } from 'tslog';

export class RabbitMQConnectionManager extends AbstractConnectionManager<amqp.Connection> {
  private connection: amqp.Connection | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private reconnectDelay = 1000; // Start with 1 second

  constructor(
    private maxReconnectDelay: number,
    private url: string,
    logger?: Logger<ILogObj>,
  ) {
    super(logger);
  }

  async connect(): Promise<amqp.Connection> {
    if (this.connection) {
      return this.connection;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        this.once('connected', resolve);
        this.once('error', reject);
      });
    }

    this.isConnecting = true;

    try {
      this.connection = await amqp.connect(this.url);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.isConnecting = false;
      this.state = 'connected';

      this.connection.on('error', (err) => {
        this._logger.error('RabbitMQ connection error:', err);
        this.emit('error', err);
      });

      this.connection.on('close', () => {
        this._logger.warn('RabbitMQ connection closed');
        this.connection = null;
        this.state = 'disconnected';
        this.emit('disconnected');
        this.handleReconnect().catch((err) => {
          this._logger.error('Error during RabbitMQ reconnection:', err);
        });
      });

      this.emit('connected', this.connection);
      this._logger.info('Connected to RabbitMQ');
      return this.connection;
    } catch (error) {
      this.isConnecting = false;
      this._logger.error('Failed to connect to RabbitMQ:', error);
      this.handleReconnect().catch((err) => {
        this._logger.error('Error during RabbitMQ reconnection:', err);
      });
      throw error;
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.state === 'closed') {
      this._logger.info('Connection is closed, will not attempt to reconnect.');
      return;
    }
    this.reconnectAttempts++;

    // Exponential backoff with full jitter
    const maxDelay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay,
    );
    const delay = Math.random() * maxDelay + 1000; // Add 1 second base delay, plus full jitter between 0 and maxDelay

    this._logger.info(
      `Reconnecting in ${Math.round(delay / 1000)}s (attempt ${this.reconnectAttempts})`,
    );

    setTimeout(async () => {
      try {
        await this.connect();
      } catch (_error) {
        // Error already logged in connect()
      }
    }, delay);
  }

  async close(): Promise<void> {
    if (this.connection) {
      this.state = 'closed';
      await this.connection.close();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection !== null;
  }
}
