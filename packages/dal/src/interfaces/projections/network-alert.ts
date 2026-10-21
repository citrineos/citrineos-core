// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { MessageOrigin, NetworkAlertDto, NetworkAlertType } from '@citrineos/types';

/** The station, or one of its connectors, that an alert episode is about. */
export interface NetworkAlertSubject {
  tenantId: number;
  type: NetworkAlertType;
  stationId: number;
  connectorId?: number | null;
}

export interface NetworkAlertStationState {
  isOnline: boolean;
  latestOcppMessageTimestamp: string | null;
  lastConnectedAt: string | null;
  /** From the station's Boot record; null when it has none, or none set. */
  heartbeatInterval: number | null;
}

export interface OpenNetworkAlert {
  alert: NetworkAlertDto;
  station: NetworkAlertStationState | null;
}

export interface SilentStation {
  tenantId: number;
  stationId: number;
  /** The later of its latest OCPP message and its latest connect. */
  lastHeardAt: string;
}

/** The average latency of a station's latest responses, sent by one side of the connection. */
export interface ResponseLatencySample {
  stationId: number;
  /** Sender of the responses: the side that was slow. */
  origin: MessageOrigin;
  sampleSize: number;
  averageMs: number;
  earliestTimestamp: string;
  /** The newest response in the sample. */
  latestMessageId: number;
  latestCorrelationId: string;
  latestAction: string | null;
  latestTimestamp: string;
}
