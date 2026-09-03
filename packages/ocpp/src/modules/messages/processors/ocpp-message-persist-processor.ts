// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type FrameEvent,
  type IFrameEventProcessor,
  type MessagesEventContext,
  MessageState,
  MessageTypeId,
} from '@citrineos/types';
import type { IOCPPMessageRepository } from '@citrineos/dal';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';

/**
 * OcppMessagePersistProcessor is responsible for persisting OCPPMessages into the database.
 */
export class OcppMessagePersistProcessor implements IFrameEventProcessor {
  readonly name = 'ocpp-message-persist';
  readonly critical = true;

  private readonly _ocppMessageRepository: IOCPPMessageRepository;
  private readonly _logger: Logger<ILogObj>;

  constructor({
    ocppMessageRepository,
    logger,
  }: {
    ocppMessageRepository: IOCPPMessageRepository;
    logger?: Logger<ILogObj>;
  }) {
    this._ocppMessageRepository = ocppMessageRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async process(event: FrameEvent, context: MessagesEventContext): Promise<void> {
    const record = await this._ocppMessageRepository.createOCPPMessage(event.tenantId, {
      tenantId: event.tenantId,
      ocppConnectionName: event.ocppConnectionName,
      correlationId: event.correlationId,
      origin: event.origin,
      type: event.type,
      action: event.action,
      protocol: event.protocol,
      raw: event.raw,
      // An unparsed frame never produced an RPC frame, so `payload` and the deprecated `message`
      // mirror stay undefined — `raw` is the only faithful record of what arrived.
      payload: event.payload,
      message: event.frame,
      timestamp: event.timestamp,
      state: OcppMessagePersistProcessor.messageStateFromType(event.type),
    });

    // The action a CALLRESULT/CALLERROR belongs to is resolved by the DB trigger during insert.
    // Handing it back is how the webhook `info` map keeps carrying a real action.
    context.persistedAction = record.action;
    context.persistedId = record.id;

    this._logger.debug(
      `Persisted ${event.direction} frame for ${event.ocppConnectionName} ` +
        `correlationId ${event.correlationId} (action: ${record.action ?? 'unresolved'})`,
    );
  }

  /**
   * @deprecated Maps an RPC messageTypeId onto the deprecated `state` column so rows stay readable
   * by consumers written before `type` existed. Moved here unchanged from `WebhookDispatcher`.
   */
  static messageStateFromType(type?: MessageTypeId): MessageState {
    switch (type) {
      case MessageTypeId.Call:
        return MessageState.Request;
      case MessageTypeId.CallResult:
      case MessageTypeId.CallError:
        return MessageState.Response;
      default:
        return MessageState.Unknown;
    }
  }
}
