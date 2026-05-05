// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { FirmwareStatusNotification16Request } from '@dto/provisioning/firmware-status-notification-16.request';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * OCPP 1.6 FirmwareStatusNotification handler. Differs from 2.0.1's
 * version (no requestId), so it lives behind a separate DTO and is
 * routed by version on `OcppRequestHandler.versions`.
 */
@OcppHandler(
  OCPP_CallAction.FirmwareStatusNotification,
  [OCPPVersion.OCPP1_6],
  FirmwareStatusNotification16Request,
)
export class FirmwareStatusNotification16Handler extends OcppRequestHandler<FirmwareStatusNotification16Request> {
  constructor(private readonly webhooks: WebhookService) {
    super();
  }

  async handle(
    msg: OcppMessage<FirmwareStatusNotification16Request>,
  ): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    this.logger.debug(
      `FirmwareStatusNotification (1.6) from ${stationId}: status=${msg.payload.status}`,
    );

    this.webhooks.emit(WebhookEvent.FirmwareStatus, { ...msg.payload }, { stationId, tenantId });

    return {};
  }
}
