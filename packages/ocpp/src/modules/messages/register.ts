// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ICallEventProcessor,
  IConnectionEventProcessor,
  IFrameEventProcessor,
  IWebsocketLifecycleEventProcessor,
} from '@citrineos/types';
import { asClass, asFunction, type AwilixContainer } from 'awilix';
import {
  type IOcppDeadLetterProcessor,
  MessagesDeadLetterConsumer,
  MessagesEventConsumer,
  MessagesEventPipeline,
  OcppDeadLetterConsumer,
} from '@/transport/index.js';
import { MessagesModule } from './messages.js';
import { CallOutcomeAlertProcessor } from '@modules/messages/processors/call-outcome-alert-processor.js';
import { ConnectionWebhookProcessor } from '@modules/messages/processors/connection-webhook-processor.js';
import { FrameWebhookProcessor } from '@modules/messages/processors/frame-webhook-processor.js';
import { LatestOcppMessageTimestampProcessor } from '@modules/messages/processors/latest-ocpp-message-timestamp-processor.js';
import { OcppCallFailureAlertProcessor } from '@modules/messages/processors/ocpp-call-failure-alert-processor.js';
import { OcppDeadLetterAlertProcessor } from '@modules/messages/processors/ocpp-dead-letter-alert-processor.js';
import { OcppMessagePersistProcessor } from '@modules/messages/processors/ocpp-message-persist-processor.js';
import { StationConnectivityAlertProcessor } from '@modules/messages/processors/station-connectivity-alert-processor.js';
import { WebsocketEventPersistProcessor } from '@modules/messages/processors/websocket-event-persist-processor.js';
import { WebhookDispatcher } from './webhook-dispatcher.js';

/** The processors this registrar resolves out of the container. */
interface MessagesCradle {
  ocppMessagePersistProcessor: OcppMessagePersistProcessor;
  frameWebhookProcessor: FrameWebhookProcessor;
  latestOcppMessageTimestampProcessor: LatestOcppMessageTimestampProcessor;
  connectionWebhookProcessor: ConnectionWebhookProcessor;
  websocketEventPersistProcessor: WebsocketEventPersistProcessor;
  ocppCallFailureAlertProcessor: OcppCallFailureAlertProcessor;
  stationConnectivityAlertProcessor: StationConnectivityAlertProcessor;
  callOutcomeAlertProcessor: CallOutcomeAlertProcessor;
  ocppDeadLetterAlertProcessor: OcppDeadLetterAlertProcessor;
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
      cradle.latestOcppMessageTimestampProcessor,
      cradle.ocppCallFailureAlertProcessor,
    ]).singleton(),

    connectionEventProcessors: asFunction((cradle: MessagesCradle): IConnectionEventProcessor[] => [
      cradle.connectionWebhookProcessor,
    ]).singleton(),

    websocketLifecycleEventProcessors: asFunction(
      (cradle: MessagesCradle): IWebsocketLifecycleEventProcessor[] => [
        cradle.websocketEventPersistProcessor,
        cradle.stationConnectivityAlertProcessor,
      ],
    ).singleton(),

    callEventProcessors: asFunction((cradle: MessagesCradle): ICallEventProcessor[] => [
      cradle.callOutcomeAlertProcessor,
    ]).singleton(),

    ocppDeadLetterProcessors: asFunction((cradle: MessagesCradle): IOcppDeadLetterProcessor[] => [
      cradle.ocppDeadLetterAlertProcessor,
    ]).singleton(),

    ocppMessagePersistProcessor: asClass(OcppMessagePersistProcessor).singleton(),
    frameWebhookProcessor: asClass(FrameWebhookProcessor).singleton(),
    latestOcppMessageTimestampProcessor: asClass(LatestOcppMessageTimestampProcessor).singleton(),
    connectionWebhookProcessor: asClass(ConnectionWebhookProcessor).singleton(),
    websocketEventPersistProcessor: asClass(WebsocketEventPersistProcessor).singleton(),
    ocppCallFailureAlertProcessor: asClass(OcppCallFailureAlertProcessor).singleton(),
    stationConnectivityAlertProcessor: asClass(StationConnectivityAlertProcessor).singleton(),
    callOutcomeAlertProcessor: asClass(CallOutcomeAlertProcessor).singleton(),
    ocppDeadLetterAlertProcessor: asClass(OcppDeadLetterAlertProcessor).singleton(),
    webhookDispatcher: asClass(WebhookDispatcher).singleton(),

    messagesEventConsumer: asClass(MessagesEventConsumer).singleton(),
    messagesDeadLetterConsumer: asClass(MessagesDeadLetterConsumer).singleton(),
    ocppDeadLetterConsumer: asClass(OcppDeadLetterConsumer).singleton(),
    messagesEventPipeline: asClass(MessagesEventPipeline).singleton(),
    messagesModule: asClass(MessagesModule).singleton(),
  });
}
