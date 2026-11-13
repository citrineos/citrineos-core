// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  IOcppDeadLetterProcessor,
  OcppDeadLetterReport,
} from '@/transport/queue/rabbit-mq/messages/ocpp-dead-letter-consumer.js';
import { fromAmqpContent } from '@/transport/queue/rabbit-mq/util.js';
import { AuthorizationAttemptReasonEnum, MessageOrigin } from '@citrineos/types';
import {
  type AuthorizationAttemptService,
  REMOTE_START_ACTIONS,
} from '@services/authorization-attempts/index.js';
import { UNDELIVERED_REASONS } from './ocpp-dead-letter-alert-processor.js';

export class RemoteStartDeadLetterProcessor implements IOcppDeadLetterProcessor {
  readonly name = 'remote-start-dead-letter';

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

  async process(report: OcppDeadLetterReport): Promise<void> {
    if (
      !UNDELIVERED_REASONS.has(report.reason) ||
      report.origin !== MessageOrigin.ChargingStationManagementSystem ||
      !REMOTE_START_ACTIONS.has(report.action)
    ) {
      return;
    }
    const tenantId = report.tenantId ? Number(report.tenantId) : NaN;
    const { ocppConnectionName, correlationId } = report;
    if (!Number.isInteger(tenantId) || !ocppConnectionName || !correlationId) {
      return;
    }
    const message = fromAmqpContent(Buffer.from(report.body, 'utf-8'));

    await this._authorizationAttemptService.recordRemoteStart(
      { tenantId, ocppConnectionName, correlationId, timestamp: new Date().toISOString() },
      message.protocol,
      report.action,
      message.payload,
      {
        reason: AuthorizationAttemptReasonEnum.NotDelivered,
        details: { deadLetterReason: report.reason },
      },
    );
  }
}
