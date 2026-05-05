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
import { SecurityEventNotificationRequest } from '@dto/reporting/security-event-notification.request';
import { SecurityEventRepository } from '@repositories/security-event.repository';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * SecurityEventNotification (OCPP 2.0.1 / 2.1).
 *
 * Mirrors legacy `core/src/modules/Reporting/src/module/module.ts:336-351`:
 *   1. Respond `{}` to the charger immediately.
 *   2. Persist the event in the background — the charger doesn't wait for DB.
 */
@OcppHandler(
  OCPP_CallAction.SecurityEventNotification,
  [OCPPVersion.OCPP2_0_1],
  SecurityEventNotificationRequest,
)
export class SecurityEventNotificationHandler extends OcppRequestHandler<SecurityEventNotificationRequest> {
  constructor(
    private readonly securityEventRepo: SecurityEventRepository,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(
    msg: OcppMessage<SecurityEventNotificationRequest>,
  ): Promise<HandlerHandledResponse> {
    await msg.respond({});

    this.webhooks.emit(
      WebhookEvent.SecurityEvent,
      { ...msg.payload },
      { stationId: msg.context.stationId, tenantId: msg.context.tenantId },
    );

    void this.securityEventRepo
      .create({
        stationId: msg.context.stationId,
        type: msg.payload.type,
        timestamp: msg.payload.timestamp,
        techInfo: msg.payload.techInfo ?? null,
        tenantId: msg.context.tenantId,
      })
      .catch((err) =>
        this.logger.error(
          `Failed to persist SecurityEvent for ${msg.context.stationId}: ${(err as Error).message}`,
        ),
      );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }
}
