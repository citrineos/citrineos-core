// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SystemConfig } from '@citrineos/types';
import {
  MessagesDeadLetterConsumer,
  MessagesEventConsumer,
  MessagesEventPipeline,
} from '@/transport/index.js';
import type WebhookDispatcher from './webhook-dispatcher.js';
import { type ILogObj, Logger } from 'tslog';

export interface MessagesModuleDependencies {
  config: SystemConfig;
  messagesEventConsumer: MessagesEventConsumer;
  messagesDeadLetterConsumer: MessagesDeadLetterConsumer;
  messagesEventPipeline: MessagesEventPipeline;
  webhookDispatcher: WebhookDispatcher;
  logger?: Logger<ILogObj>;
}

export class MessagesModule {
  private readonly _consumer: MessagesEventConsumer;
  private readonly _deadLetterConsumer: MessagesDeadLetterConsumer;
  private readonly _pipeline: MessagesEventPipeline;
  private readonly _webhookDispatcher: WebhookDispatcher;
  private readonly _logger: Logger<ILogObj>;

  constructor({
    messagesEventConsumer,
    messagesDeadLetterConsumer,
    messagesEventPipeline,
    webhookDispatcher,
    logger,
  }: MessagesModuleDependencies) {
    this._consumer = messagesEventConsumer;
    this._deadLetterConsumer = messagesDeadLetterConsumer;
    this._pipeline = messagesEventPipeline;
    this._webhookDispatcher = webhookDispatcher;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async start(): Promise<void> {
    const { frame, connection } = this._pipeline.processorNames;
    if (frame.length === 0 && connection.length === 0) {
      this._logger.warn(
        'Starting with no processors — every event will be acked and discarded. Check registerMessagesServices in register.ts.',
      );
    }

    await this._consumer.start((event) => this._pipeline.run(event).then(() => undefined));

    await this._deadLetterConsumer
      .start()
      .catch((error) => this._logger.error('Failed to start dead-letter reporting:', error));

    this._logger.info(
      `Started. Frame processors: [${frame.join(', ')}]. ` +
        `Connection processors: [${connection.join(', ')}]. ` +
        `Consuming: [${this._consumer.consumedQueues.join(', ')}]. ` +
        `Draining: [${this._deadLetterConsumer.consumedQueues.join(', ')}]`,
    );
  }

  async shutdown(): Promise<void> {
    await this._consumer.shutdown();
    await this._deadLetterConsumer.shutdown();
    this._webhookDispatcher.shutdown();
  }
}
