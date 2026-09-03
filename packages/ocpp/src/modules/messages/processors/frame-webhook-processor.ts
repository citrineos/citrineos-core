// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { FrameEvent, IFrameEventProcessor, MessagesEventContext } from '@citrineos/types';
import type { WebhookDispatcher } from '../webhook-dispatcher.js';

/**
 * FrameWebhookProcessor is responsible for fanning a frame out to the station's onMessage /
 * sentMessage subscribers.
 */
export class FrameWebhookProcessor implements IFrameEventProcessor {
  readonly name = 'frame-webhook';
  readonly critical = false;

  private readonly _dispatcher: WebhookDispatcher;

  constructor({ webhookDispatcher }: { webhookDispatcher: WebhookDispatcher }) {
    this._dispatcher = webhookDispatcher;
  }

  async process(event: FrameEvent, context: MessagesEventContext): Promise<void> {
    // `context.persistedAction` comes from the row the persistence processor just wrote, which is
    // the only place a CALLRESULT's action can be known — hence the ordering in the frame pipeline.
    await this._dispatcher.dispatchFrame(event, context.persistedAction);
  }
}
