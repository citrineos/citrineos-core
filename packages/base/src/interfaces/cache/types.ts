// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Cache namespace, used for grouping cache entries
 */
export enum CacheNamespace {
  CentralSystem = 'csms',
  ChargingStation = 'cs',
  TenantPathMapping = 'tpm',
  Transactions = 'tx',
  Connections = 'conn',
  Protocol = 'prtcl',
  /**
   * Cache boot status is used to keep track of the overall boot process for Rejected or Pending.
   * When Accepting a boot, blacklist needs to be cleared if and only if there was a previously
   * Rejected or Pending boot. When starting to configure charger, i.e. sending GetBaseReport or
   * SetVariables, this should only be done if configuring is not still ongoing from a previous
   * BootNotificationRequest. Cache boot status mediates this behavior.
   */
  BootStatus = 'boot_status',
  Other = 'other',
}

/**
 * Used in the Connections Namespace as the value, to represent a websocket connection
 * Is stringified from JSON when stored in the cache
 */
export interface IWebsocketConnection {
  id: string;
  /**
   * Stored as ISO string in the cache, converted to Date when retrieved
   */
  timeConnected: string;
  protocol: string;
  allowUnknownChargingStations: boolean;
}
