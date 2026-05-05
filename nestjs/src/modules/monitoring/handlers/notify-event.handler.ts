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
import { NotifyEventRequest } from '@dto/monitoring/notify-event.request';
import { EventDataType } from '@dto/shared/event-data.dto';
import { EventDataMapper } from '@mappers/monitoring/event-data.mapper';
import { EventDataRepository } from '@repositories/event-data.repository';
import { DeviceModelRepository } from '@repositories/device-model.repository';
import { WebhookService } from '@webhooks/webhook.service';
import { WebhookEvent } from '@webhooks/webhook-events';

/**
 * NotifyEvent (OCPP 2.0.1 / 2.1) — charger reports one or more EventData
 * entries. Respond `{}` first, then resolve component/variable FKs and
 * persist each event in the background.
 */
@OcppHandler(
  OCPP_CallAction.NotifyEvent,
  [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1],
  NotifyEventRequest,
)
export class NotifyEventHandler extends OcppRequestHandler<NotifyEventRequest> {
  constructor(
    private readonly eventDataRepo: EventDataRepository,
    private readonly deviceModelRepo: DeviceModelRepository,
    private readonly webhooks: WebhookService,
  ) {
    super();
  }

  async handle(msg: OcppMessage<NotifyEventRequest>): Promise<HandlerHandledResponse> {
    const { stationId, tenantId } = msg.context;
    const { seqNo, eventData } = msg.payload;

    this.logger.debug(`NotifyEvent from ${stationId}: seqNo=${seqNo}, ${eventData.length} events`);

    await msg.respond({});

    this.webhooks.emit(WebhookEvent.NotifyEvent, { seqNo, eventData }, { stationId, tenantId });

    void this.persistEvents(tenantId, stationId, eventData).catch((err) =>
      this.logger.error(
        `Failed to persist NotifyEvent for ${stationId}: ${(err as Error).message}`,
      ),
    );

    return { [HANDLER_HANDLED_RESPONSE]: true };
  }

  /**
   * Resolve component / variable FK references by name (best-effort), then
   * batch-insert the EventData rows. Unknown components/variables are
   * persisted with `null` FKs — the data is still useful for forensics
   * even if the device-model row hasn't landed yet.
   */
  private async persistEvents(
    tenantId: number,
    stationId: string,
    events: EventDataType[],
  ): Promise<void> {
    const rows = await Promise.all(
      events.map(async (ev) => {
        const [componentId, variableId] = await Promise.all([
          ev.component
            ? this.deviceModelRepo.findComponentId(
                tenantId,
                ev.component.name,
                ev.component.instance,
              )
            : Promise.resolve(null),
          ev.variable
            ? this.deviceModelRepo.findVariableId(tenantId, ev.variable.name, ev.variable.instance)
            : Promise.resolve(null),
        ]);
        return EventDataMapper.fromEventDataType(stationId, tenantId, ev, {
          componentId,
          variableId,
        });
      }),
    );
    await Promise.all(rows.map((row) => this.eventDataRepo.insert(row)));
  }
}
