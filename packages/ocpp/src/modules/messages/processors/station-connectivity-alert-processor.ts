// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { WsEventSource } from '@/transport/network-connection/types.js';
import type {
  IWebsocketLifecycleEventProcessor,
  MessagesEventContext,
  WebsocketLifecycleEvent,
} from '@citrineos/types';
import type { NetworkAlertService } from '@services/network-alerts/index.js';

/**
 * Closes that are not the station's connectivity failing: it opened a newer connection, an
 * administrator disconnected it, or the instance holding it shut down.
 */
const EXPECTED_CLOSE_SOURCES: ReadonlySet<string> = new Set([
  WsEventSource.ReplacedByNewConnection,
  WsEventSource.AdminDisconnect,
  WsEventSource.ServerShutdown,
]);

/**
 * Records each unexpected close of a station's socket as a StationConnectivity occurrence, and
 * each open as the end of the disconnect before it. Runs after the websocket event is persisted,
 * whose row supplies the station and the occurrence's websocketEventId.
 */
export class StationConnectivityAlertProcessor implements IWebsocketLifecycleEventProcessor {
  readonly name = 'station-connectivity-alert';

  readonly critical = false;

  private readonly _networkAlertService: NetworkAlertService;

  constructor({ networkAlertService }: { networkAlertService: NetworkAlertService }) {
    this._networkAlertService = networkAlertService;
  }

  async process(event: WebsocketLifecycleEvent, context: MessagesEventContext): Promise<void> {
    const { stationId } = context;
    if (stationId === undefined) {
      return;
    }
    if (event.type === 'Close' && !EXPECTED_CLOSE_SOURCES.has(event.source ?? '')) {
      await this._networkAlertService.recordDisconnect({
        tenantId: event.tenantId,
        stationId,
        occurredAt: event.timestamp,
        websocketEventId: context.persistedId,
      });
    } else if (event.type === 'Open') {
      await this._networkAlertService.recordReconnect({
        tenantId: event.tenantId,
        stationId,
        occurredAt: event.timestamp,
      });
    }
  }
}
