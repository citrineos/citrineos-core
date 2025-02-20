// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

/**
 * Cache namespace, used for grouping cache entries
 */
export enum CacheNamespace {
  CentralSystem = 'csms',
  ChargingStation = 'cs',
  Transactions = 'tx',
  Connections = 'conn',
  Protocol = 'prtcl',
  Other = 'other',
}

/**
 * Used in the Connections Namespace as the value, to represent a websocket connection
 * Is stringified from JSON when stored in the cache
 */
export interface IWebsocketConnection {
  id: string;
  protocol: string;
}
