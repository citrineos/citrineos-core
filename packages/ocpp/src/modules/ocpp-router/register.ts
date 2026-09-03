// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, type AwilixContainer } from 'awilix';
import { MessagesEventPublisher, MessagesExchangeSink } from '@/transport/index.js';
import { CallbackUrlNotifier } from '@modules/ocpp-router/callback-url-notifier.js';

export function registerOcppRouterServices(container: AwilixContainer): void {
  container.register({
    messagesExchangeSink: asClass(MessagesExchangeSink).singleton(),
    messagesEventPublisher: asClass(MessagesEventPublisher).singleton(),
    callbackUrlNotifier: asClass(CallbackUrlNotifier).singleton(),
  });
}
