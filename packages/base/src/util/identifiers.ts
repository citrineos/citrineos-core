// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@config/defineConfig.js';

/*
 * Helper methods to create a unique identifier used in the cache and queues.
 * This is usually a combination between the tenantId and the ocppConnectionName.
 */
export const IDENTIFIER_DELIMITER = ':';
export const createIdentifier = (tenantId: number, ...args: any[]): string =>
  [tenantId, ...(args ?? [])].join(IDENTIFIER_DELIMITER);
export const getTenantIdFromIdentifier = (identifier: string): number => {
  const segment = identifier.split(IDENTIFIER_DELIMITER, 1)[0];
  if (!segment) {
    return DEFAULT_TENANT_ID;
  }
  const tenantId = Number(segment);
  return Number.isInteger(tenantId) ? tenantId : DEFAULT_TENANT_ID;
};
export const getStationIdFromIdentifier = (identifier: string): string => {
  const delimiterIndex = identifier.indexOf(IDENTIFIER_DELIMITER);
  return delimiterIndex === -1 ? identifier : identifier.slice(delimiterIndex + 1);
};
