// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject } from '@nestjs/common';
import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { DataTransfer16Request } from '@dto/provisioning/data-transfer-16.request';
import { CONFIGURATION_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { ConfigurationModuleConfig } from '@modules/config/config.schema';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * OCPP 1.6 DataTransfer handler.
 *
 * 1.6 spec status enum: `Accepted | Rejected | UnknownMessageId | UnknownVendorId`.
 *
 * Mirrors legacy `_handleOcpp16DataTransfer`. Legacy default is `Rejected`
 * for everything — vendor plugins override to do something meaningful.
 * We additionally consult `modules.configuration.dataTransfer.allowedVendorIds`
 * (same allowlist as 2.0.1) for parity with the operator config; if the
 * vendorId IS in the allowlist we Accept, else Rejected.
 */
@OcppHandler(OCPP_CallAction.DataTransfer, [OCPPVersion.OCPP1_6], DataTransfer16Request)
export class DataTransfer16Handler extends OcppRequestHandler<DataTransfer16Request> {
  constructor(
    @Inject(CONFIGURATION_MODULE_CONFIG) private readonly cfg: ConfigurationModuleConfig,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<DataTransfer16Request>): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    const { vendorId, messageId } = msg.payload;
    this.logger.debug(
      `DataTransfer (1.6) from ${stationId}: vendorId=${vendorId}, messageId=${messageId ?? '(none)'}`,
    );

    const allowed = this.cfg.dataTransfer?.allowedVendorIds ?? [];
    const status = allowed.length > 0 && allowed.includes(vendorId) ? 'Accepted' : 'Rejected';

    this.webhooks.emit(
      WebhookEvent.DataTransfer,
      { request: msg.payload, response: { status } },
      { stationId, tenantId },
    );

    return { status };
  }
}
