// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@ocpp/call-action';
import { OcppHandler } from '@ocpp/ocpp-handler.decorator';
import { OcppMessage, OcppRequestHandler } from '@ocpp/ocpp-request-handler';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { DiagnosticsStatusNotificationRequest } from '@dto/reporting/diagnostics-status-notification.request';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * DiagnosticsStatusNotification (OCPP 1.6 only).
 *
 * Reports progress of a diagnostics file upload triggered by a CSMS
 * GetDiagnostics CALL. We ack `{}` and emit `diagnostics.status` so
 * the operator dashboard can surface "Uploading 47%" / "Failed".
 */
@OcppHandler(
  OCPP_CallAction.DiagnosticsStatusNotification,
  [OCPPVersion.OCPP1_6],
  DiagnosticsStatusNotificationRequest,
)
export class DiagnosticsStatusNotificationHandler extends OcppRequestHandler<DiagnosticsStatusNotificationRequest> {
  constructor(private readonly webhooks: WebhookService) {
    super();
  }

  async handle(
    msg: OcppMessage<DiagnosticsStatusNotificationRequest>,
  ): Promise<Record<string, unknown>> {
    const { stationId, tenantId } = msg.context;
    this.logger.debug(
      `DiagnosticsStatusNotification from ${stationId}: status=${msg.payload.status}`,
    );

    this.webhooks.emit(WebhookEvent.DiagnosticsStatus, { ...msg.payload }, { stationId, tenantId });

    return {};
  }
}
