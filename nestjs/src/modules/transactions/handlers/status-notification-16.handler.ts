// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { StatusNotification16Request } from '@dto/transactions/status-notification-16.request';
import { StatusNotificationService } from '@modules/transactions/services/status-notification.service';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * Status Notification16Handler.
 */
@OcppHandler(OCPP_CallAction.StatusNotification, [OCPPVersion.OCPP1_6], StatusNotification16Request)
export class StatusNotification16Handler extends OcppRequestHandler<StatusNotification16Request> {
  constructor(
    private readonly statusNotificationService: StatusNotificationService,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<StatusNotification16Request>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { connectorId, status } = msg.payload;

    this.logger.debug(
      `StatusNotification (1.6) from ${stationId}: connectorId=${connectorId}, status=${status}`,
    );

    void this.statusNotificationService.record16(tenantId, stationId, msg.payload);

    this.webhooks.emit(WebhookEvent.ConnectorStatus, { ...msg.payload }, { stationId, tenantId });

    return {};
  }
}
