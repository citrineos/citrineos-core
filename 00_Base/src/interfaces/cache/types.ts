// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { DEFAULT_TENANT_ID } from '../../config/defineConfig';

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

/*
 * Helper methods to create a unique identifier used in the cache and queues.
 * This is usually a combination between the tenantId and the stationId.
 */
export const IDENTIFIER_DELIMITER = ':';
export const createIdentifier = (tenantId: number, ...args: any[]): string =>
  [tenantId, ...(args ?? [])].join(IDENTIFIER_DELIMITER);
export const getTenantIdFromIdentifier = (identifier: string): number => {
  const identifierSplit = identifier.split(IDENTIFIER_DELIMITER);
  return identifierSplit?.[0] ? Number(identifierSplit?.[0]) : DEFAULT_TENANT_ID;
};
export const getStationIdFromIdentifier = (identifier: string): string => {
  const identifierSplit = identifier.split(IDENTIFIER_DELIMITER);
  return identifierSplit?.[1] ?? identifier;
};

/**
 * Used in the Connections Namespace as the value, to represent a websocket connection
 * Is stringified from JSON when stored in the cache
 */
export interface IWebsocketConnection {
  id: string;
  protocol: string;
}
