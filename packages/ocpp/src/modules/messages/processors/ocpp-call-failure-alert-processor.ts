// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { UNKNOWN_ACTION } from '@/transport/metrics.js';
import {
  type FrameEvent,
  type IFrameEventProcessor,
  type MessagesEventContext,
  MessageTypeId,
} from '@citrineos/types';
import type { NetworkAlertService } from '@services/network-alerts/index.js';

export class OcppCallFailureAlertProcessor implements IFrameEventProcessor {
  readonly name = 'ocpp-call-failure-alert';

  readonly critical = false;

  private readonly _networkAlertService: Pick<NetworkAlertService, 'recordCallFailure'>;

  constructor({
    networkAlertService,
  }: {
    networkAlertService: Pick<NetworkAlertService, 'recordCallFailure'>;
  }) {
    this._networkAlertService = networkAlertService;
  }

  async process(event: FrameEvent, context: MessagesEventContext): Promise<void> {
    const { stationId } = context;
    if (stationId === undefined || !event.parsed || event.type !== MessageTypeId.CallError) {
      return;
    }
    await this._networkAlertService.recordCallFailure({
      tenantId: event.tenantId,
      stationId,
      reason: 'CallError',
      origin: event.origin,
      action: context.persistedAction ?? UNKNOWN_ACTION,
      correlationId: event.correlationId,
      errorCode: event.payload?.errorCode ?? null,
      occurredAt: event.timestamp,
      ocppMessageId: context.persistedId,
    });
  }
}
