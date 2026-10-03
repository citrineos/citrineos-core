// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  DeadLetterReason,
  DeadLetterSource,
  recordOcppMessageReemitted,
  ReemitOutcome,
} from '@/transport/metrics.js';
import { childLogger } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
import type * as amqplib from 'amqplib';
import type { ILogObj, Logger } from 'tslog';
import type { RabbitMQChannelManager } from './channel-manager.js';
import type { RabbitMqDeadLetterPublisher } from './dead-letter-publisher.js';
import { fromAmqpContent, toAmqpContent, toAmqpPublish, type IOCPPMessage } from './util.js';

/** When a message was first re-emitted, for messages that never go stale. */
const FIRST_REEMITTED_AT_HEADER = 'x-citrineos-first-reemitted-at';
/** Which re-emit attempt this is, starting at 0. */
const REEMIT_ATTEMPT_HEADER = 'x-citrineos-reemit-attempt';

/**
 * Re-publishes messages the router holds for a station it is no longer connected to, so the
 * router the station is connected to now picks them up through its bindings.
 *
 * A station that has just dropped has usually not reconnected anywhere yet, so the first attempt
 * often matches no binding. Messages are published `mandatory`, the broker returns the unroutable
 * ones, and those are retried with backoff until they go stale, or for reemitMaxRetrySeconds from
 * the first re-emit, whichever comes first. The latter bounds messages that never go stale. Past
 * either, the message is dead-lettered as unroutable.
 *
 * Retries are held in memory: a pod that crashes loses them. One that shuts down dead-letters
 * them.
 */
export class RabbitMqReemitter {
  private static readonly CHANNEL_ID = 'router-reemitter';

  private readonly _channelManager: RabbitMQChannelManager;
  private readonly _deadLetterPublisher: RabbitMqDeadLetterPublisher;
  private readonly _exchange: string;
  private readonly _timeouts: SystemConfig['timeouts'];
  private readonly _maxRetryMs: number;
  private readonly _logger: Logger<ILogObj>;
  private readonly _preparedChannels = new WeakSet<amqplib.Channel>();
  private readonly _retries = new Map<NodeJS.Timeout, IOCPPMessage>();

  constructor({
    config,
    channelManager,
    deadLetterPublisher,
    logger,
  }: {
    config: SystemConfig;
    channelManager: RabbitMQChannelManager;
    deadLetterPublisher: RabbitMqDeadLetterPublisher;
    logger?: Logger<ILogObj>;
  }) {
    this._channelManager = channelManager;
    this._deadLetterPublisher = deadLetterPublisher;
    this._exchange = config.messageBroker.amqp.exchange;
    this._timeouts = config.timeouts;
    this._maxRetryMs = config.messageBroker.amqp.reemitMaxRetrySeconds * 1000;
    this._logger = childLogger(logger, this.constructor.name);
  }

  async reemit(message: IOCPPMessage): Promise<void> {
    await this._publish(message, 0, Date.now());
  }

  /** Dead-letters every message still waiting for a retry. */
  async shutdown(): Promise<void> {
    const waiting = [...this._retries];
    this._retries.clear();
    for (const [timer, message] of waiting) {
      clearTimeout(timer);
      await this._deadLetterPublisher.publishMessage(
        message,
        DeadLetterReason.Shutdown,
        DeadLetterSource.Router,
      );
    }
  }

  private async _publish(
    message: IOCPPMessage,
    attempt: number,
    firstReemittedAt: number,
  ): Promise<void> {
    const publish = toAmqpPublish(message, this._timeouts);
    if (publish.stale && attempt === 0) {
      await this._deadLetterPublisher.publishMessage(
        message,
        DeadLetterReason.Stale,
        DeadLetterSource.Router,
      );
      return;
    }
    if (publish.stale || Date.now() > firstReemittedAt + this._maxRetryMs) {
      this._logger.info(
        `Dead-lettering ${message.action} for ${message.context.ocppConnectionName}: no router ` +
          `took it after ${attempt} re-emit(s). correlationId=${message.context.correlationId}`,
      );
      await this._deadLetterPublisher.publishMessage(
        message,
        DeadLetterReason.Unroutable,
        DeadLetterSource.Router,
      );
      return;
    }

    const options = publish.options;
    options.mandatory = true;
    options.headers = {
      ...options.headers,
      [FIRST_REEMITTED_AT_HEADER]: firstReemittedAt,
      [REEMIT_ATTEMPT_HEADER]: attempt,
    };

    try {
      const channel = await this._channelManager.getChannel(RabbitMqReemitter.CHANNEL_ID);
      if (!this._preparedChannels.has(channel)) {
        channel.on('return', (returned: amqplib.Message) => this._onReturn(returned));
        this._preparedChannels.add(channel);
      }
      channel.publish(this._exchange, '', toAmqpContent(message), options);
      recordOcppMessageReemitted(ReemitOutcome.Published);
      this._logger.debug(
        `Re-emitted ${message.action} for ${message.context.ocppConnectionName} ` +
          `(attempt ${attempt + 1}). correlationId=${message.context.correlationId}`,
      );
    } catch (error) {
      this._logger.error(
        `Failed to re-emit ${message.action} for ${message.context.ocppConnectionName}`,
        error,
      );
      this._scheduleRetry(message, attempt, firstReemittedAt);
    }
  }

  private _onReturn(returned: amqplib.Message): void {
    recordOcppMessageReemitted(ReemitOutcome.Returned);
    let message: IOCPPMessage;
    try {
      message = fromAmqpContent(returned.content);
    } catch (error) {
      this._deadLetterPublisher
        .publishRaw(
          returned.content,
          returned.properties.headers ?? {},
          DeadLetterReason.Poison,
          DeadLetterSource.Router,
          { error },
        )
        .catch(() => undefined);
      return;
    }
    const headers = returned.properties.headers;
    const attempt = Number(headers?.[REEMIT_ATTEMPT_HEADER]) || 0;
    const firstReemittedAt = Number(headers?.[FIRST_REEMITTED_AT_HEADER]) || Date.now();
    // Logged once per message, so a crash leaves a record of what was waiting in memory.
    if (attempt === 0) {
      this._logger.info(
        `No router holds ${message.context.ocppConnectionName}; retrying ${message.action} ` +
          `until one does. correlationId=${message.context.correlationId}`,
      );
    }
    this._scheduleRetry(message, attempt, firstReemittedAt);
  }

  private _scheduleRetry(message: IOCPPMessage, attempt: number, firstReemittedAt: number): void {
    const timer = setTimeout(() => {
      this._retries.delete(timer);
      this._publish(message, attempt + 1, firstReemittedAt).catch((error) =>
        this._logger.error('Re-emit retry failed', error),
      );
    }, this._backoff(attempt));
    this._retries.set(timer, message);
  }

  private _backoff(attempt: number): number {
    const base = Math.min(250 * 2 ** attempt, 5000);
    return base * (0.75 + Math.random() * 0.5); // ±25% jitter
  }
}
