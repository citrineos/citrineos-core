// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IMessagesEventSink, MessagesEvent, MessagesRecordResult } from '@citrineos/types';
import type { MessagesEventPublisher } from '@/util/index.js';

/**
 * Publishes to the messages exchange and returns immediately.
 */
export class MessagesExchangeSink implements IMessagesEventSink {
  private readonly _publisher: MessagesEventPublisher;

  constructor({ messagesEventPublisher }: { messagesEventPublisher: MessagesEventPublisher }) {
    this._publisher = messagesEventPublisher;
  }

  async record(event: MessagesEvent): Promise<MessagesRecordResult> {
    const delivered = await this._publisher.publish(event);
    return { delivered };
  }
}
