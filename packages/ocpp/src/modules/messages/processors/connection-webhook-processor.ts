// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ConnectionEvent,
  ConnectionEventState,
  type IConnectionEventProcessor,
  type MessagesEventContext,
} from '@citrineos/types';
import type { WebhookDispatcher } from '../webhook-dispatcher.js';

export class ConnectionWebhookProcessor implements IConnectionEventProcessor {
  readonly name = 'connection-webhook';
  readonly critical = false;

  private readonly _dispatcher: WebhookDispatcher;

  constructor({ webhookDispatcher }: { webhookDispatcher: WebhookDispatcher }) {
    this._dispatcher = webhookDispatcher;
  }

  async process(event: ConnectionEvent, _context: MessagesEventContext): Promise<void> {
    if (event.state === ConnectionEventState.Connected) {
      await this._dispatcher.register(event.tenantId, event.ocppConnectionName);
    } else {
      await this._dispatcher.deregister(event.tenantId, event.ocppConnectionName);
    }
  }
}
