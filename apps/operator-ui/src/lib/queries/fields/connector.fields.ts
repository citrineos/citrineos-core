// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Reusable GraphQL selection-set snippets for the `Connectors` type, as plain strings interpolated
 * directly into a `gql` selection. Field lists only (no nested relations), so they carry no imports
 * from other entities and cannot form a circular dependency.
 *
 * Connector selections vary a lot by query, so these are the two field groups that actually repeat.
 * Identity fields (id, ocppConnectionName, connectorId, evseId, evseTypeConnectorId, stationId) and
 * createdAt/updatedAt differ per query and stay inline; compose the groups a query needs, e.g.
 *   Connectors { id connectorId ${CONNECTOR_STATUS_FIELDS} ${CONNECTOR_SPEC_FIELDS} createdAt updatedAt }
 */

/** Live status / error reporting fields. */
export const CONNECTOR_STATUS_FIELDS = `
  status
  errorCode
  timestamp
  info
  vendorId
  vendorErrorCode
`;

/** Physical/spec + tariff fields. */
export const CONNECTOR_SPEC_FIELDS = `
  type
  format
  powerType
  maximumAmperage
  maximumVoltage
  maximumPowerWatts
  termsAndConditionsUrl
  tariffId
`;
