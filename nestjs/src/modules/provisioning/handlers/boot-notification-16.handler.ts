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
import { BootNotification16Request } from '@dto/provisioning/boot-notification-16.request';
import { BootService } from '@modules/provisioning/services/boot.service';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * OCPP 1.6 BootNotification handler. Pure protocol layer — defers all
 * business logic (status determination, ChargingStation upsert) to
 * BootService. Emits a `boot.notification` webhook so external systems
 * can react to charger boot events without scanning the raw frame stream.
 */
@OcppHandler(OCPP_CallAction.BootNotification, [OCPPVersion.OCPP1_6], BootNotification16Request)
export class BootNotification16Handler extends OcppRequestHandler<BootNotification16Request> {
  constructor(
    private readonly bootService: BootService,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<BootNotification16Request>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;

    this.logger.debug(
      `BootNotification (1.6) from ${stationId}: model=${msg.payload.chargePointModel}, vendor=${msg.payload.chargePointVendor}`,
    );

    const response = await this.bootService.createBootNotification16Response(
      tenantId,
      stationId,
      msg.payload,
    );

    await msg.respond(response as Record<string, unknown>);

    this.webhooks.emit(
      WebhookEvent.BootNotification,
      { request: msg.payload, response },
      { stationId, tenantId },
    );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }
}
