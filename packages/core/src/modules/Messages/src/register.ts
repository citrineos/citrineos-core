// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IConnectionEventProcessor, IFrameEventProcessor } from '@citrineos/types';
import { asClass, asFunction, type AwilixContainer } from 'awilix';
import { MessagesEventConsumer } from '@util/queue/rabbit-mq/messages/messages-event-consumer.js';
import { MessagesEventPipeline } from '@util/queue/rabbit-mq/messages/messages-event-pipeline.js';
import { MessagesModule } from './module/messages.js';
import { ConnectionWebhookProcessor } from './module/processors/connection-webhook-processor.js';
import { FrameWebhookProcessor } from './module/processors/frame-webhook-processor.js';
import { OcppMessagePersistProcessor } from './module/processors/ocpp-message-persist-processor.js';
import { WebhookDispatcher } from './module/webhook-dispatcher.js';

/** The processors this registrar resolves out of the container. */
interface MessagesCradle {
  ocppMessagePersistProcessor: OcppMessagePersistProcessor;
  frameWebhookProcessor: FrameWebhookProcessor;
  connectionWebhookProcessor: ConnectionWebhookProcessor;
}

/**
 * Order matters when listing the processors in the overall lists (i.e. frameEventProcessors)!
 * They will be executed first -> last. Otherwise, you can register them as singletons in any order.
 */
export function registerMessagesServices(container: AwilixContainer): void {
  container.register({
    frameEventProcessors: asFunction((cradle: MessagesCradle): IFrameEventProcessor[] => [
      cradle.ocppMessagePersistProcessor,
      cradle.frameWebhookProcessor,
    ]).singleton(),

    connectionEventProcessors: asFunction((cradle: MessagesCradle): IConnectionEventProcessor[] => [
      cradle.connectionWebhookProcessor,
    ]).singleton(),

    ocppMessagePersistProcessor: asClass(OcppMessagePersistProcessor).singleton(),
    frameWebhookProcessor: asClass(FrameWebhookProcessor).singleton(),
    connectionWebhookProcessor: asClass(ConnectionWebhookProcessor).singleton(),
    webhookDispatcher: asClass(WebhookDispatcher).singleton(),

    messagesEventConsumer: asClass(MessagesEventConsumer).singleton(),
    messagesEventPipeline: asClass(MessagesEventPipeline).singleton(),
    messagesModule: asClass(MessagesModule).singleton(),
  });
}
