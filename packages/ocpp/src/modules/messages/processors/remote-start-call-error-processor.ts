// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IOCPPMessageRepository } from '@citrineos/dal';
import {
  AuthorizationAttemptReasonEnum,
  FrameDirection,
  type FrameEvent,
  type IFrameEventProcessor,
  type MessagesEventContext,
  MessageTypeId,
} from '@citrineos/types';
import {
  type AuthorizationAttemptService,
  REMOTE_START_ACTIONS,
} from '@services/authorization-attempts/index.js';

export class RemoteStartCallErrorProcessor implements IFrameEventProcessor {
  readonly name = 'remote-start-call-error';
  readonly critical = false;

  private readonly _authorizationAttemptService: Pick<
    AuthorizationAttemptService,
    'recordRemoteStart'
  >;
  private readonly _ocppMessageRepository: Pick<
    IOCPPMessageRepository,
    'getRequestByCorrelationId'
  >;

  constructor({
    authorizationAttemptService,
    ocppMessageRepository,
  }: {
    authorizationAttemptService: Pick<AuthorizationAttemptService, 'recordRemoteStart'>;
    ocppMessageRepository: Pick<IOCPPMessageRepository, 'getRequestByCorrelationId'>;
  }) {
    this._authorizationAttemptService = authorizationAttemptService;
    this._ocppMessageRepository = ocppMessageRepository;
  }

  async process(event: FrameEvent, context: MessagesEventContext): Promise<void> {
    const action = context.persistedAction;
    if (
      !event.parsed ||
      event.type !== MessageTypeId.CallError ||
      event.direction !== FrameDirection.Inbound ||
      !action ||
      !REMOTE_START_ACTIONS.has(action)
    ) {
      return;
    }
    const call = await this._ocppMessageRepository.getRequestByCorrelationId(
      event.tenantId,
      event.correlationId,
    );
    await this._authorizationAttemptService.recordRemoteStart(
      {
        tenantId: event.tenantId,
        ocppConnectionName: event.ocppConnectionName,
        correlationId: event.correlationId,
        timestamp: event.timestamp,
      },
      event.protocol,
      action,
      call?.payload,
      {
        reason: AuthorizationAttemptReasonEnum.CallError,
        details: {
          errorCode: event.payload?.errorCode,
          errorDescription: event.payload?.errorDescription,
        },
      },
    );
  }
}
