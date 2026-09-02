// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  buildEndpoints,
  type BuiltEndpoint,
  type EndpointClass,
  type EndpointResolverCradle,
} from '@citrineos/base';
import { asClass, asFunction, type AwilixContainer } from 'awilix';
import { CreateSubscriptionEndpoint } from './module/endpoints/CreateSubscriptionEndpoint.js';
import { DeleteSubscriptionEndpoint } from './module/endpoints/DeleteSubscriptionEndpoint.js';
import { DeleteWebsocketConnectionEndpoint } from './module/endpoints/DeleteWebsocketConnectionEndpoint.js';
import { DeleteWebsocketMappingEndpoint } from './module/endpoints/DeleteWebsocketMappingEndpoint.js';
import { GenerateCertificateChainEndpoint } from './module/endpoints/GenerateCertificateChainEndpoint.js';
import { GetSubscriptionsEndpoint } from './module/endpoints/GetSubscriptionsEndpoint.js';
import { PutWebsocketMappingEndpoint } from './module/endpoints/PutWebsocketMappingEndpoint.js';
import { ReloadTlsCertificatesEndpoint } from './module/endpoints/ReloadTlsCertificatesEndpoint.js';
import { MessagesExchangeSink } from '@util/queue/rabbit-mq/messages/messages-exchange-sink.js';
import { CallbackUrlNotifier } from '@modules/OcppRouter/src/module/callback-url-notifier.js';
import { MessagesEventPublisher } from '@/util/index.js';

const ADMIN_ENDPOINTS = [
  CreateSubscriptionEndpoint,
  DeleteSubscriptionEndpoint,
  DeleteWebsocketConnectionEndpoint,
  DeleteWebsocketMappingEndpoint,
  GenerateCertificateChainEndpoint,
  GetSubscriptionsEndpoint,
  PutWebsocketMappingEndpoint,
  ReloadTlsCertificatesEndpoint,
] satisfies ReadonlyArray<EndpointClass>;

export function registerOcppRouterServices(container: AwilixContainer): void {
  container.register({
    adminEndpoints: asFunction((cradle: EndpointResolverCradle): BuiltEndpoint[] =>
      buildEndpoints(cradle.moduleScope, ADMIN_ENDPOINTS),
    ).scoped(),
    messagesExchangeSink: asClass(MessagesExchangeSink).singleton(),
    messagesEventPublisher: asClass(MessagesEventPublisher).singleton(),
    callbackUrlNotifier: asClass(CallbackUrlNotifier).singleton(),
  });
}
