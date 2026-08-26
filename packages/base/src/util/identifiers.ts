// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Tenant assumed when a value carries no tenant of its own.
 *
 * Declared here rather than in the package barrel: the barrel's `export *`
 * statements run before its own `const` initializers, so a submodule reading this
 * from the barrel at module-evaluation time hits it in the temporal dead zone. The
 * barrel re-exports it, so `@citrineos/base` consumers are unaffected.
 */
export const DEFAULT_TENANT_ID = 1;

/*
 * Helper methods to create a unique identifier used in the cache and queues.
 * This is usually a combination between the tenantId and the ocppConnectionName.
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
