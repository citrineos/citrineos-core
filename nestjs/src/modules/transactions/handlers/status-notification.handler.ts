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
import { StatusNotificationRequest } from '@dto/transactions/status-notification.request';
import { StatusNotificationService } from '@modules/transactions/services/status-notification.service';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * StatusNotification (OCPP 2.0.1 / 2.1).
 *
 * Mirrors legacy `core/src/modules/Transactions/src/module/module.ts:503-524`:
 *   1. Respond `{}` to the charger immediately.
 *   2. Persist history + Connector + LatestStatusNotification in the background.
 */
@OcppHandler(
  OCPP_CallAction.StatusNotification,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  StatusNotificationRequest,
)
export class StatusNotificationHandler extends OcppRequestHandler<StatusNotificationRequest> {
  constructor(
    private readonly statusNotificationService: StatusNotificationService,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<StatusNotificationRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { evseId, connectorId, connectorStatus } = msg.payload;

    this.logger.debug(
      `StatusNotification from ${stationId}: evseId=${evseId}, connectorId=${connectorId}, status=${connectorStatus}`,
    );

    await msg.respond({});

    this.webhooks.emit(
      WebhookEvent.StatusNotification,
      { ...msg.payload },
      { stationId, tenantId },
    );

    void this.statusNotificationService.record201(tenantId, stationId, msg.payload);

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }
}
