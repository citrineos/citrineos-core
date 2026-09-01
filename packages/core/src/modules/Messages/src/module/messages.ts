// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { SystemConfig } from '@citrineos/types';
import { MessagesEventConsumer, MessagesEventPipeline } from '@util/queue/messages/index.js';
import type WebhookDispatcher from './webhook-dispatcher.js';
import { type ILogObj, Logger } from 'tslog';

export interface MessagesModuleDependencies {
  config: SystemConfig;
  messagesConsumer: MessagesEventConsumer;
  messagesEventPipeline: MessagesEventPipeline;
  webhookDispatcher: WebhookDispatcher;
  logger?: Logger<ILogObj>;
}

export class MessagesModule {
  private readonly _consumer: MessagesEventConsumer;
  private readonly _pipeline: MessagesEventPipeline;
  private readonly _webhookDispatcher: WebhookDispatcher;
  private readonly _logger: Logger<ILogObj>;

  constructor({
    messagesConsumer,
    messagesEventPipeline,
    webhookDispatcher,
    logger,
  }: MessagesModuleDependencies) {
    this._consumer = messagesConsumer;
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

    this._logger.info(
      `Started. Frame processors: [${frame.join(', ')}]. ` +
        `Connection processors: [${connection.join(', ')}]. ` +
        `Consuming: [${this._consumer.consumedQueues.join(', ')}]`,
    );
  }

  async shutdown(): Promise<void> {
    await this._consumer.shutdown();
    this._webhookDispatcher.shutdown();
  }
}
