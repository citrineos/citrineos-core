// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

/** Minimal connector reference (id + connectorId + type + timestamps) used by the transaction views. */
export const CONNECTOR_CORE_FIELDS = fieldSet([
  'id',
  'connectorId',
  'type',
  'createdAt',
  'updatedAt',
]);

export const CONNECTOR_STATUS_FIELDS = fieldSet([
  'status',
  'errorCode',
  'timestamp',
  'info',
  'vendorId',
  'vendorErrorCode',
]);

export const CONNECTOR_SPEC_FIELDS = fieldSet([
  'type',
  'format',
  'powerType',
  'maximumAmperage',
  'maximumVoltage',
  'maximumPowerWatts',
  'termsAndConditionsUrl',
  'tariffId',
]);

/**
 * The full connector selection (identity + status + spec + timestamps) shared by the connector
 * create/edit mutations and the station-detail EVSE connectors. Built from CONNECTOR_STATUS_FIELDS /
 * CONNECTOR_SPEC_FIELDS so field changes propagate.
 */
export const CONNECTOR_FULL_FIELDS = fieldSet([
  'id',
  'ocppConnectionName',
  'evseId',
  'evseTypeConnectorId',
  'connectorId',
  ...CONNECTOR_STATUS_FIELDS.fields,
  ...CONNECTOR_SPEC_FIELDS.fields,
  'createdAt',
  'updatedAt',
]);
