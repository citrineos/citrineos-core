// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AuthorizationAttemptReasonEnum,
  type CallEvent,
  CallEventOutcome,
  type ICallEventProcessor,
  type MessagesEventContext,
} from '@citrineos/types';
import {
  type AuthorizationAttemptService,
  REMOTE_START_ACTIONS,
} from '@services/authorization-attempts/index.js';

const REASON_BY_OUTCOME = {
  [CallEventOutcome.Timeout]: AuthorizationAttemptReasonEnum.Timeout,
  [CallEventOutcome.SendFailed]: AuthorizationAttemptReasonEnum.SendFailed,
} as const;

export class RemoteStartCallOutcomeProcessor implements ICallEventProcessor {
  readonly name = 'remote-start-call-outcome';
  readonly critical = false;

  private readonly _authorizationAttemptService: Pick<
    AuthorizationAttemptService,
    'recordRemoteStart'
  >;

  constructor({
    authorizationAttemptService,
  }: {
    authorizationAttemptService: Pick<AuthorizationAttemptService, 'recordRemoteStart'>;
  }) {
    this._authorizationAttemptService = authorizationAttemptService;
  }

  async process(event: CallEvent, _context: MessagesEventContext): Promise<void> {
    if (!REMOTE_START_ACTIONS.has(event.action)) {
      return;
    }
    await this._authorizationAttemptService.recordRemoteStart(
      {
        tenantId: event.tenantId,
        ocppConnectionName: event.ocppConnectionName,
        correlationId: event.correlationId,
        timestamp: event.timestamp,
      },
      event.protocol,
      event.action,
      event.request,
      { reason: REASON_BY_OUTCOME[event.outcome] },
    );
  }
}
