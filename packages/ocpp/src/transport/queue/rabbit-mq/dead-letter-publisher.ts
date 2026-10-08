// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  DeadLetterOutcome,
  recordOcppMessageDeadLettered,
  type DeadLetterReason,
  type DeadLetterSource,
} from '@/transport/metrics.js';
import { childLogger } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import type * as amqplib from 'amqplib';
import type { ILogObj, Logger } from 'tslog';
import type { RabbitMQChannelManager } from './channel-manager.js';
import { toAmqpContent, toAmqpHeaders, type IOCPPMessage } from './util.js';

/**
 * Headers CitrineOS adds to a message it dead-letters itself. A message the broker dead-letters
 * (a TTL running out on a queue) carries the broker's `x-death` header instead.
 */
export const DeadLetterHeader = {
  Reason: 'x-citrineos-dead-letter-reason',
  Source: 'x-citrineos-dead-letter-source',
  Queue: 'x-citrineos-dead-letter-queue',
  Error: 'x-citrineos-dead-letter-error',
} as const;

/** The fanout exchange every CitrineOS work queue dead-letters to. */
export function deadLetterExchangeName(exchange: string): string {
  return `${exchange}.dlx`;
}

/** The queue the messages module drains dead letters from. */
export function deadLetterQueueName(exchange: string): string {
  return `${exchange}.dlq`;
}

export async function assertDeadLetterExchange(
  channel: amqplib.Channel,
  exchange: string,
): Promise<void> {
  await channel.assertExchange(deadLetterExchangeName(exchange), 'fanout', { durable: true });
}

export interface DeadLetterDetail {
  /** The queue the message was consumed from, when there was one. */
  queue?: string;
  error?: unknown;
}

/**
 * Publishes messages CitrineOS has given up on to the dead-letter exchange, tagged with why.
 *
 * Publishing is best effort and never throws: the caller has already decided to stop delivering
 * the message, and a failure here must not turn into a redelivery. When nothing is bound to the
 * exchange, because the messages module is not deployed, the broker discards the message.
 */
export class RabbitMqDeadLetterPublisher {
  private static readonly CHANNEL_ID = 'dead-letter-publisher';

  private readonly _channelManager: RabbitMQChannelManager;
  private readonly _exchange: string;
  private readonly _logger: Logger<ILogObj>;
  private readonly _preparedChannels = new WeakSet<amqplib.Channel>();

  constructor({
    config,
    channelManager,
    logger,
  }: {
    config: SystemConfig;
    channelManager: RabbitMQChannelManager;
    logger?: Logger<ILogObj>;
  }) {
    this._channelManager = channelManager;
    this._exchange = config.messageBroker.amqp.exchange;
    this._logger = childLogger(logger, this.constructor.name);
  }

  async publishMessage(
    message: IOCPPMessage,
    reason: DeadLetterReason,
    source: DeadLetterSource,
    detail: DeadLetterDetail = {},
  ): Promise<void> {
    await this.publishRaw(toAmqpContent(message), toAmqpHeaders(message), reason, source, detail);
  }

  /**
   * @param content The body exactly as it was consumed, which may not be parseable.
   * @param headers The headers it was consumed with; routing headers are kept for reporting.
   */
  async publishRaw(
    content: Buffer,
    headers: Record<string, unknown>,
    reason: DeadLetterReason,
    source: DeadLetterSource,
    detail: DeadLetterDetail = {},
  ): Promise<void> {
    const deadLetterHeaders: Record<string, unknown> = {
      ...headers,
      [DeadLetterHeader.Reason]: reason,
      [DeadLetterHeader.Source]: source,
    };
    if (detail.queue) {
      deadLetterHeaders[DeadLetterHeader.Queue] = detail.queue;
    }
    if (detail.error !== undefined) {
      deadLetterHeaders[DeadLetterHeader.Error] =
        detail.error instanceof Error ? detail.error.message : String(detail.error);
    }

    try {
      const channel = await this._channelManager.getChannel(RabbitMqDeadLetterPublisher.CHANNEL_ID);
      if (!this._preparedChannels.has(channel)) {
        await assertDeadLetterExchange(channel, this._exchange);
        this._preparedChannels.add(channel);
      }
      // No expiration: a TTL carried over from the original publish would expire the dead letter.
      channel.publish(deadLetterExchangeName(this._exchange), '', content, {
        contentEncoding: 'utf-8',
        contentType: 'application/json',
        persistent: true,
        headers: deadLetterHeaders,
      });
      recordOcppMessageDeadLettered(reason, source, DeadLetterOutcome.Published);
      this._logger.debug(`Dead-lettered a message (${reason}) from ${source}`, deadLetterHeaders);
    } catch (error) {
      recordOcppMessageDeadLettered(reason, source, DeadLetterOutcome.Failed);
      this._logger.error(
        `Failed to dead-letter a message (${reason}) from ${source}; it is dropped.`,
        deadLetterHeaders,
        content.toString(),
        error,
      );
    }
  }
}
