// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingStationDto,
  ConnectorDto,
  EvseDto,
  NetworkAlertDto,
  NetworkAlertResolvedBy,
  NetworkAlertSeverity,
  NetworkAlertStatus,
  NetworkAlertType,
} from '@citrineos/types';

export type NetworkAlertWithRelationsDto = NetworkAlertDto & {
  station?: ChargingStationDto | null;
  evse?: EvseDto | null;
  connector?: ConnectorDto | null;
};

export class NetworkAlertClass implements Partial<Omit<NetworkAlertDto, 'details'>> {
  id?: number;
  type?: NetworkAlertType;
  severity?: NetworkAlertSeverity;
  status?: NetworkAlertStatus;
  stationId?: number | null;
  evseId?: number | null;
  connectorId?: number | null;
  firstSeenAt?: string;
  lastSeenAt?: string;
  occurrenceCount?: number;
  resolvedAt?: string | null;
  resolvedBy?: NetworkAlertResolvedBy | null;
  statusNote?: string | null;
  details?: NetworkAlertDto['details'];
  station?: ChargingStationDto | null;
  evse?: EvseDto | null;
  connector?: ConnectorDto | null;
  createdAt?: Date;
  updatedAt?: Date;
}
