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
import { NotifyDisplayMessagesRequest } from '@dto/provisioning/notify-display-messages.request';
import { MessageInfoType } from '@dto/shared/message-info.dto';
import { OcppMessageRepository } from '@repositories/ocpp-message.repository';
import { MessageInfoRepository } from '@repositories/message-info.repository';
import { validateMessageContentType } from '@modules/provisioning/services/message-content-validator';
import { DeviceModelRepository } from '@repositories/device-model.repository';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * NotifyDisplayMessages (OCPP 2.0.1 / 2.1).
 *
 * Mirrors legacy `_handleNotifyDisplayMessages` in
 * `core/src/modules/Configuration/src/module/module.ts`:
 *   1. Verify `requestId` corresponds to a prior GetDisplayMessages CALL
 *      (replay protection — the charger should only report messages we
 *      asked it to enumerate).
 *   2. For each `messageInfo`, upsert the corresponding `MessageInfos`
 *      row keyed on `(stationId, displayMessageId, tenantId)`.
 *   3. Respond `{}` and emit a webhook so dashboards can mirror the
 *      charger's current message catalog without polling.
 *
 * Format-content validation runs `validateMessageContentType` (ASCII /
 * HTML / URI / UTF8 + RFC-5646 language). When `messageInfo.display` is
 * set, the (Evse, Component) pair is find-or-created and the resulting
 * Component FK is persisted on the MessageInfo row.
 */
@OcppHandler(
  OCPP_CallAction.NotifyDisplayMessages,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  NotifyDisplayMessagesRequest,
)
export class NotifyDisplayMessagesHandler extends OcppRequestHandler<NotifyDisplayMessagesRequest> {
  constructor(
    private readonly webhooks: WebhookService,
    private readonly ocppMessageRepo: OcppMessageRepository,
    private readonly messageInfoRepo: MessageInfoRepository,
    private readonly deviceModel: DeviceModelRepository,
  ) {
    super();
  }

  async handle(msg: OcppMessage<NotifyDisplayMessagesRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { requestId, messageInfo, tbc } = msg.payload;

    this.logger.debug(
      `NotifyDisplayMessages from ${stationId}: requestId=${requestId}, messages=${messageInfo?.length ?? 0}, tbc=${tbc}`,
    );

    const previous = await this.findGetDisplayMessagesByRequestId(tenantId, stationId, requestId);
    if (!previous) {
      await msg.respondError(
        OcppErrorCode.PropertyConstraintViolation,
        'RequestId was not provided in a GetDisplayMessagesRequest.',
      );
      return { [HANDLER_HANDLED_RESPONSE]: true };
    }

    if (messageInfo && messageInfo.length > 0) {
      const validationErrors: string[] = [];
      for (const info of messageInfo) {
        if (!info.message) continue;
        const result = validateMessageContentType(info.message);
        if (!result.isValid) {
          validationErrors.push(`Message ID ${info.id}: ${result.errorMessage}`);
        }
      }
      if (validationErrors.length > 0) {
        await msg.respondError(
          OcppErrorCode.PropertyConstraintViolation,
          `Message content validation failed: ${validationErrors.join('; ')}`,
        );
        return { [HANDLER_HANDLED_RESPONSE]: true };
      }
      await Promise.all(
        messageInfo.map((info) => this.persistMessageInfo(tenantId, stationId, info)),
      );
    }

    await msg.respond({});

    this.webhooks.emit(
      WebhookEvent.NotifyDisplayMessages,
      { ...msg.payload },
      { stationId, tenantId },
    );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }

  private async findGetDisplayMessagesByRequestId(
    tenantId: number,
    stationId: string,
    requestId: number,
  ): Promise<unknown> {
    const recent = await this.ocppMessageRepo.findByStation(tenantId, stationId, {
      action: OCPP_CallAction.GetDisplayMessages,
      limit: 50,
    });
    return recent.find((row) => {
      const payload = row.message as { requestId?: number } | null;
      return payload?.requestId === requestId;
    });
  }

  private async persistMessageInfo(
    tenantId: number,
    stationId: string,
    info: MessageInfoType,
  ): Promise<void> {
    let displayComponentId: number | null = null;
    if (info.display) {
      const resolved = await this.deviceModel.findOrCreateEvseAndComponent(
        tenantId,
        stationId,
        info.display,
      );
      displayComponentId = resolved.componentId;
    }
    await this.messageInfoRepo.upsert({
      tenantId,
      stationId,
      id: info.id,
      priority: info.priority,
      state: info.state ?? null,
      startDateTime: info.startDateTime ? new Date(info.startDateTime) : null,
      endDateTime: info.endDateTime ? new Date(info.endDateTime) : null,
      transactionId: info.transactionId ?? null,
      displayComponentId,
      // Legacy stores the wire `MessageContentType` directly as jsonb.
      message: info.message ?? null,
      active: true,
    });
  }
}
