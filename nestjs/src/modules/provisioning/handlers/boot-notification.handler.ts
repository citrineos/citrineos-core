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
import { BootNotificationRequest } from '@dto/provisioning/boot-notification.request';
import { RegistrationStatusEnumType } from '@enums/registration-status.enum';
import { BootService } from '@modules/provisioning/services/boot.service';
import { BootPendingService } from '@modules/provisioning/services/boot-pending.service';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * Handles BootNotification (OCPP 2.0.1 / 2.1).
 *
 * Mirrors legacy `core/src/modules/Configuration/src/module/module.ts:230-309`:
 *   1. Build the response (status, interval, optional statusInfo).
 *   2. Read the cached BOOT_STATUS so we can decide what to do with the action blacklist.
 *   3. Toggle the blacklist (whitelist on Accepted-after-Pending, blacklist on first non-Accepted).
 *   4. **Send the response back to the charger NOW** — the charger should see
 *      its boot ack before any DB persistence completes (matches legacy
 *      `sendCallResultWithMessage` ordering).
 *   5. Async-persist ChargingStation metadata + Boot row in the background.
 *   6. If the new status is non-Accepted (and different from cached) cache it.
 *
 * Pending-state follow-up (GetBaseReport, SetVariables, autoAccept transition,
 * Reset on RebootRequired) is not yet ported — captured in the parity roadmap §3.1.
 */
@OcppHandler(
  OCPP_CallAction.BootNotification,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  BootNotificationRequest,
)
export class BootNotificationHandler extends OcppRequestHandler<BootNotificationRequest> {
  constructor(
    private readonly bootService: BootService,
    private readonly bootPendingService: BootPendingService,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(
    msg: OcppMessage<BootNotificationRequest>,
  ): Promise<Record<string, unknown> | HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { chargingStation, reason } = msg.payload;
    const protocol = msg.protocol as OCPPVersion.OCPP2_0_1 | OCPPVersion.OCPP2_1;

    this.logger.debug(
      `BootNotification from ${stationId}: model=${chargingStation.model}, vendor=${chargingStation.vendorName}, reason=${reason}`,
    );

    const response = await this.bootService.createBootNotificationResponse(
      tenantId,
      stationId,
      protocol,
    );
    const cachedBootStatus = await this.bootService.getCachedBootStatus(stationId);

    // 1) Response goes out NOW — charger should not wait for DB persistence.
    await msg.respond(response as Record<string, unknown>);

    // Semantic webhook event — operators can subscribe to "boot.notification"
    // specifically to react to charger boots without scanning the AMQP frame stream.
    this.webhooks.emit(
      WebhookEvent.BootNotification,
      { request: msg.payload, response, reason },
      { stationId, tenantId },
    );

    // 2) Background: blacklist toggle + ChargingStation/Boot persistence + BOOT_STATUS cache.
    void this.persistBootSideEffects(
      stationId,
      tenantId,
      cachedBootStatus,
      response,
      chargingStation,
    ).catch((err) =>
      this.logger.error(
        `Background boot persistence for ${stationId} failed: ${(err as Error).message}`,
      ),
    );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }

  private async persistBootSideEffects(
    stationId: string,
    tenantId: number,
    cachedBootStatus: RegistrationStatusEnumType | null,
    response: { status: RegistrationStatusEnumType; currentTime: string; interval: number },
    chargingStation: BootNotificationRequest['chargingStation'],
  ): Promise<void> {
    await this.bootService.cacheChargerActionsPermissions(
      stationId,
      cachedBootStatus,
      response.status,
    );

    if (
      response.status !== RegistrationStatusEnumType.Accepted &&
      (!cachedBootStatus || response.status !== cachedBootStatus)
    ) {
      await this.bootService.cacheBootStatus(stationId, response.status);
    }

    await this.bootService.updateBootRecord(
      tenantId,
      stationId,
      response as never, // BootNotificationResponse — typed in BootService
      chargingStation,
    );

    // Pending → Accepted handshake: dispatch GetBaseReport / SetVariables when
    // the response left the charger in Pending and the Boot row asks for it.
    await this.bootPendingService.onBootResponse(tenantId, stationId, response.status);
  }
}
