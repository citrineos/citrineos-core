// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MESSAGES_DLX, MESSAGES_QUEUES, type MessagesQueueSpec } from '@citrineos/types';
import type * as amqplib from 'amqplib';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { RabbitMQChannelManager } from '@/transport/index.js';

/**
 * One entry of RabbitMQ's `x-death` header: why a message died, which queue it died on, and how
 * many times that has happened. Absent when a message was published to the DLX directly.
 */
interface DeathRecord {
  reason?: string;
  queue?: string;
  count?: number;
  'routing-keys'?: string[];
}

/** What arriving on a dead-letter queue tells us. */
export interface DeadLetterReport {
  /** The dead-letter queue it arrived on. */
  dlq: string;
  /** The work queue it died on, per `x-death`. */
  originQueue?: string;
  /** `rejected`, `expired` or `maxlen`. */
  reason?: string;
  /** How many times it has died this way. */
  deaths?: number;
  /** Routing key it was published with, preserved through dead-lettering. */
  routingKey: string;
  /** Envelope facets, when the body was still readable JSON. */
  kind?: string;
  tenantId?: number;
  ocppConnectionName?: string;
  correlationId?: string;
  /** Exact body as it sat on the queue. The only faithful record of an unparseable event. */
  body: string;
}

/**
 * Drains the messages-plane dead-letter queues.
 *
 * An event reaching a DLQ has already spent its one retry, so there is nothing left to attempt
 * automatically. For now arrival is only reported: the log line carries the whole body, which is
 * what makes the event recoverable at all once it has been acked.
 *
 * TODO decide what happens to a dead-lettered event instead of dropping it and logging.
 */
export class MessagesDeadLetterConsumer {
  private static readonly CHANNEL_PREFIX = 'messages-dlq-consumer-';

  private readonly _channelManager: RabbitMQChannelManager;
  private readonly _logger: Logger<ILogObj>;

  /** dlq name -> consumerTag, for queues currently being consumed on this connection. */
  private _consumerTags = new Map<string, string>();
  private _started = false;

  constructor({
    channelManager,
    logger,
  }: {
    channelManager: RabbitMQChannelManager;
    logger?: Logger<ILogObj>;
  }) {
    this._channelManager = channelManager;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });

    this._channelManager.getConnectionManager().on('connected', () => {
      if (!this._started) return;
      this._consumerTags.clear();
      this.subscribe().catch((error) =>
        this._logger.error('Failed to re-subscribe after reconnect:', error),
      );
    });
  }

  get consumedQueues(): string[] {
    return [...this._consumerTags.keys()];
  }

  async start(): Promise<void> {
    this._started = true;
    await this.subscribe();
  }

  /** Starts consuming any dead-letter queue not already being consumed. Idempotent. */
  async subscribe(): Promise<void> {
    for (const spec of MESSAGES_QUEUES) {
      if (this._consumerTags.has(spec.dlq)) continue;
      try {
        await this._consumeDlq(spec);
      } catch (error) {
        this._logger.error(`Failed to consume ${spec.dlq}:`, error);
      }
    }

    if (this._consumerTags.size > 0) {
      this._logger.info(`Draining dead-letter queues: ${this.consumedQueues.join(', ')}`);
    }
  }

  async shutdown(): Promise<void> {
    this._started = false;

    for (const [dlq, consumerTag] of this._consumerTags) {
      try {
        const channel = await this._channelManager.getChannel(this._channelId(dlq));
        await channel.cancel(consumerTag);
      } catch (error) {
        this._logger.warn(`Could not cancel consumer for ${dlq} during shutdown`, error);
      }
    }
    this._consumerTags.clear();
  }

  private _channelId(dlq: string): string {
    return `${MessagesDeadLetterConsumer.CHANNEL_PREFIX}${dlq}`;
  }

  private async _consumeDlq(spec: MessagesQueueSpec): Promise<void> {
    const channel = await this._channelManager.getChannel(this._channelId(spec.dlq));

    await channel.assertExchange(MESSAGES_DLX, 'topic', { durable: true });
    await channel.assertQueue(spec.dlq, { durable: true, autoDelete: false });
    await channel.bindQueue(spec.dlq, MESSAGES_DLX, spec.binding);

    const { consumerTag } = await channel.consume(spec.dlq, (message) =>
      this._onDelivery(spec.dlq, message, channel),
    );
    this._consumerTags.set(spec.dlq, consumerTag);
  }

  private async _onDelivery(
    dlq: string,
    message: amqplib.ConsumeMessage | null,
    channel: amqplib.Channel,
  ): Promise<void> {
    if (!message) return;

    try {
      this._report(this._describe(dlq, message));
    } catch (error) {
      // Reporting must never be the reason a dead-lettered event sticks around unacked.
      this._logger.error(`Failed to report a dead-lettered event on ${dlq}:`, error);
    }

    // TODO when a decided-upon strategy for DLQ processing exists, don't just ack the message;
    // return it to the proper queues.
    channel.ack(message);
  }

  private _describe(dlq: string, message: amqplib.ConsumeMessage): DeadLetterReport {
    const body = message.content.toString();
    const death = (message.properties.headers?.['x-death'] as DeathRecord[] | undefined)?.[0];

    let envelope: Record<string, unknown> | undefined;
    try {
      const parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object') envelope = parsed as Record<string, unknown>;
    } catch {
      // A body that never parsed is exactly the poison case that lands here. `body` still holds it.
    }

    return {
      dlq,
      originQueue: death?.queue,
      reason: death?.reason,
      deaths: death?.count,
      routingKey: message.fields.routingKey,
      kind: envelope?.['kind'] as string | undefined,
      tenantId: envelope?.['tenantId'] as number | undefined,
      ocppConnectionName: envelope?.['ocppConnectionName'] as string | undefined,
      correlationId: envelope?.['correlationId'] as string | undefined,
      body,
    };
  }

  private _report(report: DeadLetterReport): void {
    const subject =
      report.kind && report.ocppConnectionName
        ? `${report.kind} event for tenant ${report.tenantId} / ${report.ocppConnectionName}`
        : 'unreadable event';

    this._logger.error(
      `Dead-lettered ${subject} on ${report.dlq} ` +
        `(reason: ${report.reason ?? 'unknown'}, from: ${report.originQueue ?? 'unknown'}, ` +
        `deaths: ${report.deaths ?? 1}, routingKey: ${report.routingKey}). ` +
        'Acked and dropped — no recovery is implemented yet.',
      report,
    );
  }
}
