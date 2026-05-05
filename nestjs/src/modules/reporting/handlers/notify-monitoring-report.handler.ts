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
import { NotifyMonitoringReportRequest } from '@dto/reporting/notify-monitoring-report.request';
import { NotifyMonitoringReportService } from '@modules/reporting/services/notify-monitoring-report.service';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * NotifyMonitoringReport (OCPP 2.0.1 / 2.1).
 *
 * Acks the charger immediately, then persists the reported monitoring
 * configuration into VariableMonitorings in the background. Mirrors
 * `core/src/modules/Reporting/src/module/module.ts`.
 */
@OcppHandler(
  OCPP_CallAction.NotifyMonitoringReport,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  NotifyMonitoringReportRequest,
)
export class NotifyMonitoringReportHandler extends OcppRequestHandler<NotifyMonitoringReportRequest> {
  constructor(
    private readonly notifyMonitoringReportService: NotifyMonitoringReportService,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<NotifyMonitoringReportRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { seqNo, tbc, monitor } = msg.payload;

    this.logger.debug(
      `NotifyMonitoringReport from ${stationId}: seqNo=${seqNo}, tbc=${tbc}, ${monitor?.length ?? 0} entries`,
    );

    await msg.respond({});

    this.webhooks.emit(
      WebhookEvent.NotifyMonitoringReport,
      { seqNo, tbc, monitor },
      { stationId, tenantId },
    );

    if (monitor && monitor.length > 0) {
      void this.notifyMonitoringReportService
        .ingest(tenantId, stationId, monitor)
        .catch((err) =>
          this.logger.error(
            `Failed to ingest NotifyMonitoringReport for ${stationId}: ${(err as Error).message}`,
          ),
        );
    }

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }
}
