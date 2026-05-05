// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject } from '@nestjs/common';
import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { DataTransferRequest } from '@dto/provisioning/data-transfer.request';
import { DataTransferStatusEnumType } from '@enums/data-transfer-status.enum';
import { CONFIGURATION_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { ConfigurationModuleConfig } from '@modules/config/config.schema';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * DataTransfer (OCPP 2.0.1 / 2.1) — vendor-specific message channel.
 *
 * Mirrors `core/src/modules/Configuration/src/module/module.ts:DataTransfer`:
 *   - If `modules.configuration.dataTransfer.allowedVendorIds` is non-empty
 *     and the request's `vendorId` isn't in it → `UnknownVendorId`.
 *   - Otherwise → `Accepted`.
 *
 * The legacy server has additional plugin hooks for specific vendorIds to
 * actually *do* something with the data; until those plugins land we
 * accept and rely on `OcppMessageAuditService` to capture the payload.
 */
@OcppHandler(
  OCPP_CallAction.DataTransfer,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  DataTransferRequest,
)
export class DataTransferHandler extends OcppRequestHandler<DataTransferRequest> {
  constructor(
    @Inject(CONFIGURATION_MODULE_CONFIG) private readonly cfg: ConfigurationModuleConfig,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<DataTransferRequest>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { vendorId, messageId } = msg.payload;
    this.logger.debug(
      `DataTransfer from ${stationId}: vendorId=${vendorId}, messageId=${messageId ?? '(none)'}`,
    );

    const allowed = this.cfg.dataTransfer?.allowedVendorIds ?? [];
    const status =
      allowed.length > 0 && !allowed.includes(vendorId)
        ? DataTransferStatusEnumType.UnknownVendorId
        : DataTransferStatusEnumType.Accepted;

    this.webhooks.emit(
      WebhookEvent.DataTransfer,
      { request: msg.payload, response: { status } },
      { stationId, tenantId },
    );

    return { status };
  }
}
