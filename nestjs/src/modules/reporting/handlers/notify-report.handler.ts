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
import { NotifyReportRequest } from '@dto/reporting/notify-report.request';
import { NotifyReportService } from '@modules/reporting/services/notify-report.service';
import { BootPendingService } from '@modules/provisioning/services/boot-pending.service';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * NotifyReport (OCPP 2.0.1 / 2.1).
 *
 * Acks the charger immediately, then persists the reported components,
 * variables, and variable attributes into the device-model tables in the
 * background. Mirrors `core/src/modules/Reporting/src/module/module.ts`.
 *
 * On the last chunk (`tbc=false`) we also tell `BootPendingService` to
 * advance the Pending sub-state — clearing `getBaseReportOnPending` so
 * the next BootNotification can promote to Accepted.
 */
@OcppHandler(
  OCPP_CallAction.NotifyReport,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  NotifyReportRequest,
)
export class NotifyReportHandler extends OcppRequestHandler<NotifyReportRequest> {
  constructor(
    private readonly notifyReportService: NotifyReportService,
    private readonly bootPendingService: BootPendingService,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<NotifyReportRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { seqNo, tbc, reportData, generatedAt } = msg.payload;

    this.logger.debug(
      `NotifyReport from ${stationId}: seqNo=${seqNo}, tbc=${tbc}, ${reportData?.length ?? 0} entries`,
    );

    await msg.respond({});

    this.webhooks.emit(
      WebhookEvent.NotifyReport,
      { seqNo, tbc, reportData, generatedAt },
      { stationId, tenantId },
    );

    if (reportData && reportData.length > 0) {
      void this.notifyReportService
        .ingest(tenantId, stationId, generatedAt, reportData)
        .then(() => {
          if (!tbc) {
            return this.bootPendingService.onNotifyReportIngested(tenantId, stationId);
          }
          return undefined;
        })
        .catch((err) =>
          this.logger.error(
            `Failed to ingest NotifyReport for ${stationId}: ${(err as Error).message}`,
          ),
        );
    }

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }
}
