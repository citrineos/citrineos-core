// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import type * as amqplib from 'amqplib';
import type { ILogObj, Logger } from 'tslog';
import type { RabbitMQChannelManager } from '@/transport/index.js';
import {
  assertDeadLetterExchange,
  DeadLetterHeader,
  deadLetterExchangeName,
  deadLetterQueueName,
} from '@/transport/queue/rabbit-mq/dead-letter-publisher.js';
import { recordOcppDeadLetterReceived, UNKNOWN_ACTION } from '@/transport/metrics.js';
import { UNKNOWN_DEAD_LETTER_REASON } from './messages-metrics.js';

/** Dead letters with the same reason, action and source are logged once per window. */
const REPORT_WINDOW_MS = 60_000;

/** The first entry of RabbitMQ's `x-death` header, set when the broker dead-lettered it. */
interface DeathRecord {
  reason?: string;
  queue?: string;
}

/** What a dead letter from the OCPP exchange tells us about why it was dropped. */
export interface OcppDeadLetterReport {
  /** CitrineOS's reason (stale, poison, ...), or the broker's `x-death` reason (expired). */
  reason: string;
  /** router or module, when CitrineOS dead-lettered it. */
  source?: string;
  queue?: string;
  error?: string;
  action: string;
  eventGroup?: string;
  origin?: string;
  state?: string;
  tenantId?: string;
  ocppConnectionName?: string;
  correlationId?: string;
  /** Exact body as it was dead-lettered. The only record of it once acked. */
  body: string;
}

/**
 * Drains the dead-letter queue of the OCPP exchange: messages a router or module gave up on, and
 * messages whose TTL ran out on a router's queue.
 *
 * Nothing is replayed. Each dead letter is counted by reason and action, for alerting; the first
 * of a kind in each window is logged in full and the rest are summarised when the window closes,
 * so an outage that drops thousands of messages logs a handful of lines.
 */
export class OcppDeadLetterConsumer {
  private static readonly CHANNEL_ID = 'ocpp-dlq-consumer';

  private readonly _channelManager: RabbitMQChannelManager;
  private readonly _logger: Logger<ILogObj>;
  private readonly _exchange: string;
  private readonly _prefetch: number;
  private readonly _queueArguments: Record<string, unknown>;

  private _consumerTag?: string;
  private _started = false;
  private _window = new Map<string, { report: OcppDeadLetterReport; count: number }>();
  private _windowTimer?: ReturnType<typeof setInterval>;

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
    this._logger = childLogger(logger, this.constructor.name);
    this._exchange = config.messageBroker.amqp.exchange;
    this._prefetch = config.messageBroker.amqp.prefetch.messagesDeadLetter;
    // Bounds the queue while nothing drains it, e.g. when the messages module is down. Past
    // either bound the oldest dead letter is dropped; ocpp_message_dead_lettered_total, counted
    // where each is produced, still includes it.
    const { maxLength, maxLengthBytes } = config.messageBroker.amqp.deadLetterQueue;
    this._queueArguments = {
      'x-max-length': maxLength,
      'x-max-length-bytes': maxLengthBytes,
      'x-overflow': 'drop-head',
    };

    this._channelManager.getConnectionManager().on('connected', () => {
      if (!this._started) return;
      this._consumerTag = undefined;
      this._subscribe().catch((error) =>
        this._logger.error('Failed to re-subscribe after reconnect:', error),
      );
    });
  }

  get queue(): string {
    return deadLetterQueueName(this._exchange);
  }

  async start(): Promise<void> {
    this._started = true;
    this._windowTimer = setInterval(() => this._closeWindow(), REPORT_WINDOW_MS);
    this._windowTimer.unref();
    await this._subscribe();
  }

  async shutdown(): Promise<void> {
    this._started = false;
    clearInterval(this._windowTimer);
    this._closeWindow();
    if (!this._consumerTag) return;
    try {
      const channel = await this._channelManager.getChannel(OcppDeadLetterConsumer.CHANNEL_ID);
      await channel.cancel(this._consumerTag);
    } catch (error) {
      this._logger.warn(`Could not cancel consumer for ${this.queue} during shutdown`, error);
    }
    this._consumerTag = undefined;
  }

  private async _subscribe(): Promise<void> {
    if (this._consumerTag) return;
    const channel = await this._channelManager.getChannel(OcppDeadLetterConsumer.CHANNEL_ID);

    await assertDeadLetterExchange(channel, this._exchange);
    await channel.assertQueue(this.queue, {
      durable: true,
      autoDelete: false,
      arguments: this._queueArguments,
    });
    await channel.bindQueue(this.queue, deadLetterExchangeName(this._exchange), '');

    // basic.qos only applies to consumers started after it, so it is set ahead of each consume.
    await channel.prefetch(this._prefetch);
    const { consumerTag } = await channel.consume(this.queue, (message) =>
      this._onDelivery(message, channel),
    );
    this._consumerTag = consumerTag;
    this._logger.info(`Draining dead-letter queue ${this.queue}`);
  }

  private _onDelivery(message: amqplib.ConsumeMessage | null, channel: amqplib.Channel): void {
    if (!message) return;
    try {
      this._record(this._describe(message));
    } catch (error) {
      // Reporting must never be the reason a dead letter sticks around unacked.
      this._logger.error(`Failed to report a dead letter on ${this.queue}:`, error);
    }
    channel.ack(message);
  }

  private _describe(message: amqplib.ConsumeMessage): OcppDeadLetterReport {
    const headers = message.properties.headers ?? {};
    const death = (headers['x-death'] as DeathRecord[] | undefined)?.[0];
    const header = (key: string): string | undefined =>
      headers[key] === undefined ? undefined : String(headers[key]);

    return {
      reason: header(DeadLetterHeader.Reason) ?? death?.reason ?? UNKNOWN_DEAD_LETTER_REASON,
      source: header(DeadLetterHeader.Source),
      queue: header(DeadLetterHeader.Queue) ?? death?.queue,
      error: header(DeadLetterHeader.Error),
      action: header('action') ?? UNKNOWN_ACTION,
      eventGroup: header('eventGroup'),
      origin: header('origin'),
      state: header('state'),
      tenantId: header('tenantId'),
      ocppConnectionName: header('ocppConnectionName'),
      correlationId: header('correlationId'),
      body: message.content.toString(),
    };
  }

  private _record(report: OcppDeadLetterReport): void {
    recordOcppDeadLetterReceived(report.reason, report.action);

    const key = `${report.reason}|${report.action}|${report.source ?? ''}`;
    const seen = this._window.get(key);
    if (seen) {
      seen.count++;
      return;
    }
    this._window.set(key, { report, count: 1 });
    this._logger.error(
      `Dead letter: ${report.action} for tenant ${report.tenantId} / ${report.ocppConnectionName} ` +
        `(reason: ${report.reason}, source: ${report.source ?? 'broker'}, ` +
        `queue: ${report.queue ?? 'unknown'}${report.error ? `, error: ${report.error}` : ''}). ` +
        'Further dead letters like it are summarised for the next minute.',
      report,
    );
  }

  private _closeWindow(): void {
    for (const { report, count } of this._window.values()) {
      if (count > 1) {
        this._logger.error(
          `${count - 1} more dead letter(s) of ${report.action} ` +
            `(reason: ${report.reason}, source: ${report.source ?? 'broker'}) in the last minute`,
        );
      }
    }
    this._window.clear();
  }
}
