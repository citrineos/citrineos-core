// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { FirmwareStatusNotificationRequest } from '@dto/provisioning/firmware-status-notification.request';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * Firmware Status Notification Handler.
 */
@OcppHandler(
  OCPP_CallAction.FirmwareStatusNotification,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  FirmwareStatusNotificationRequest,
)
export class FirmwareStatusNotificationHandler extends OcppRequestHandler<FirmwareStatusNotificationRequest> {
  constructor(private readonly webhooks: WebhookService) {
    super();
  }

  async handle(
    msg: OcppMessage<FirmwareStatusNotificationRequest>,
  ): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    this.logger.debug(
      `FirmwareStatusNotification from ${stationId}: status=${msg.payload.status}, requestId=${msg.payload.requestId}`,
    );

    this.webhooks.emit(WebhookEvent.FirmwareStatus, { ...msg.payload }, { stationId, tenantId });

    return {};
  }
}
