// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
export const TableName = {
  SecurityEvents: 'SecurityEvents',
  Subscriptions: 'Subscriptions',
  ServerNetworkProfiles: 'ServerNetworkProfiles',
  ChargingStationSecurityInfos: 'ChargingStationSecurityInfos',
  MessageInfos: 'MessageInfos',
  Tenants: 'Tenants',
  ChargingStations: 'ChargingStations',
} as const;

export type TableName = (typeof TableName)[keyof typeof TableName];
