// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type IWebsocketLifecycleEventProcessor,
  type MessagesEventContext,
  type WebsocketLifecycleEvent,
} from '@citrineos/types';
import { childLogger } from '@citrineos/base';
import type { IWebsocketEventRepository } from '@citrineos/dal';
import type { ILogObj, Logger } from 'tslog';

/**
 * WebsocketEventPersistProcessor is responsible for persisting websocket lifecycle events into
 * the WebsocketEvents table.
 */
export class WebsocketEventPersistProcessor implements IWebsocketLifecycleEventProcessor {
  readonly name = 'websocket-event-persist';
  readonly critical = true;

  private readonly _websocketEventRepository: IWebsocketEventRepository;
  private readonly _logger: Logger<ILogObj>;

  constructor({
    websocketEventRepository,
    logger,
  }: {
    websocketEventRepository: IWebsocketEventRepository;
    logger?: Logger<ILogObj>;
  }) {
    this._websocketEventRepository = websocketEventRepository;
    this._logger = childLogger(logger, this.constructor.name);
  }

  async process(event: WebsocketLifecycleEvent, context: MessagesEventContext): Promise<void> {
    const record = await this._websocketEventRepository.createWebsocketEvent(
      event.tenantId,
      event.ocppConnectionName,
      {
        serverId: event.serverId,
        host: event.host,
        remoteAddress: event.remoteAddress,
        uri: event.uri,
        type: event.type,
        timestamp: event.timestamp,
        subprotocol: event.subprotocol,
        httpStatus: event.httpStatus,
        wsCloseCode: event.wsCloseCode,
        sentCode: event.sentCode,
        closeReason: event.closeReason,
        initiator: event.initiator,
        source: event.source,
        details: event.details,
      },
    );
    context.persistedId = record.id;

    this._logger.debug(
      `Persisted websocket ${event.type} event for ${event.ocppConnectionName ?? 'unknown station'}` +
        ` (source: ${event.source ?? 'none'})`,
    );
  }
}
