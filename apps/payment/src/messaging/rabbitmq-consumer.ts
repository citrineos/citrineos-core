// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import { MessageOrigin, MessageState } from '@citrineos/types';
import amqp from 'amqplib';
import type { ILogObj, Logger } from 'tslog';
import type { ScanAndChargeService } from '../services/scan-and-charge-service.js';
import type { SettlementService } from '../services/settlement-service.js';
import {
  parseTransactionMessage,
  TRANSACTION_ACTIONS,
  TransactionMessageKind,
} from './transaction-messages.js';

const RECONNECT_DELAY_MS = 5_000;

export interface RabbitMqConsumerOptions {
  url: string;
  exchange: string;
  queue: string;
}

/**
 * Receives a copy of the transaction calls stations send Core, through a durable queue of its own
 * bound to Core's exchange, so nothing is lost while this app is down. Messages are handled one at
 * a time: a transaction's start has to be handled before its end.
 */
export class RabbitMqConsumer {
  private _connection?: amqp.ChannelModel;
  private _stopping = false;
  private readonly _logger: Logger<ILogObj>;

  constructor(
    private readonly _options: RabbitMqConsumerOptions,
    private readonly _settlement: SettlementService,
    private readonly _scanAndCharge: ScanAndChargeService,
    logger?: Logger<ILogObj>,
  ) {
    this._logger = childLogger(logger, this.constructor.name);
  }

  async start(): Promise<void> {
    const connection = await amqp.connect(this._options.url);
    this._connection = connection;
    connection.on('error', (error) => this._logger.error('RabbitMQ connection error', error));
    connection.on('close', () => {
      if (!this._stopping) {
        this._logger.error(`RabbitMQ connection closed; reconnecting in ${RECONNECT_DELAY_MS} ms`);
        setTimeout(() => void this._reconnect(), RECONNECT_DELAY_MS);
      }
    });

    const channel = await connection.createChannel();
    await channel.prefetch(1);
    // Declared exactly as Core declares it; any other options would make the broker refuse it.
    await channel.assertExchange(this._options.exchange, 'headers', { durable: false });
    await channel.assertQueue(this._options.queue, { durable: true });
    for (const action of TRANSACTION_ACTIONS) {
      await channel.bindQueue(this._options.queue, this._options.exchange, '', {
        'x-match': 'all',
        action,
        state: String(MessageState.Request),
        origin: MessageOrigin.ChargingStation,
      });
    }

    await channel.consume(this._options.queue, (message) => {
      if (!message) {
        return;
      }
      void this._handle(message.properties.headers ?? {}, message.content).finally(() =>
        channel.ack(message),
      );
    });
    this._logger.info(`Consuming ${TRANSACTION_ACTIONS.join(', ')} from ${this._options.queue}`);
  }

  async stop(): Promise<void> {
    this._stopping = true;
    await this._connection?.close();
  }

  private async _reconnect(): Promise<void> {
    try {
      await this.start();
    } catch (error) {
      this._logger.error(`RabbitMQ reconnect failed; retrying in ${RECONNECT_DELAY_MS} ms`, error);
      setTimeout(() => void this._reconnect(), RECONNECT_DELAY_MS);
    }
  }

  private async _handle(headers: Record<string, unknown>, body: Buffer): Promise<void> {
    try {
      for (const message of parseTransactionMessage(headers, body)) {
        switch (message.kind) {
          case TransactionMessageKind.PluggedIn:
            await this._scanAndCharge.onTransactionPluggedIn(message);
            break;
          case TransactionMessageKind.Started:
            await this._settlement.onTransactionStarted(message);
            await this._scanAndCharge.onTransactionAuthorized(message);
            break;
          case TransactionMessageKind.Ended:
            await this._settlement.onTransactionEnded(message);
            break;
        }
      }
    } catch (error) {
      this._logger.error(`Failed to handle ${String(headers.action)} message`, error);
    }
  }
}
