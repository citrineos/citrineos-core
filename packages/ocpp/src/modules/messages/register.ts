// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IConnectionEventProcessor, IFrameEventProcessor } from '@citrineos/types';
import { asClass, asFunction, type AwilixContainer } from 'awilix';
import {
  MessagesDeadLetterConsumer,
  MessagesEventConsumer,
  MessagesEventPipeline,
} from '@/transport/index.js';
import { MessagesModule } from './messages.js';
import { ConnectionWebhookProcessor } from '@modules/messages/processors/connection-webhook-processor.js';
import { FrameWebhookProcessor } from '@modules/messages/processors/frame-webhook-processor.js';
import { OcppMessagePersistProcessor } from '@modules/messages/processors/ocpp-message-persist-processor.js';
import { WebhookDispatcher } from './webhook-dispatcher.js';

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
    messagesDeadLetterConsumer: asClass(MessagesDeadLetterConsumer).singleton(),
    messagesEventPipeline: asClass(MessagesEventPipeline).singleton(),
    messagesModule: asClass(MessagesModule).singleton(),
  });
}
