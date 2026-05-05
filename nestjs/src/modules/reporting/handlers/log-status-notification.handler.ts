// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import {
  HANDLER_HANDLED_RESPONSE,
  type HandlerHandledResponse,
  OcppMessage,
  OcppRequestHandler,
} from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { OcppErrorCode } from '@ocpp/ocpp-error-code';
import { LogStatusNotificationRequest } from '@dto/reporting/log-status-notification.request';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * Log Status Notification Handler.
 */
@OcppHandler(
  OCPP_CallAction.LogStatusNotification,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  LogStatusNotificationRequest,
)
export class LogStatusNotificationHandler extends OcppRequestHandler<LogStatusNotificationRequest> {
  constructor(private readonly webhooks: WebhookService) {
    super();
  }

  async handle(
    msg: OcppMessage<LogStatusNotificationRequest>,
  ): Promise<HandlerHandledResponse | Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    this.logger.debug(
      `LogStatusNotification from ${stationId}: status=${msg.payload.status}, requestId=${msg.payload.requestId}`,
    );

    // Legacy parity: requestId is mandatory at the handler level (the JSON
    // schema marks it optional for the trigger-message-without-upload case
    // only). Mirrors `_handleLogStatusNotification`.
    if (msg.payload.requestId === undefined || msg.payload.requestId === null) {
      await msg.respondError(OcppErrorCode.OccurrenceConstraintViolation, 'RequestId is required.');
      return { [HANDLER_HANDLED_RESPONSE]: true };
    }

    this.webhooks.emit(WebhookEvent.LogStatus, { ...msg.payload }, { stationId, tenantId });

    return {};
  }
}
