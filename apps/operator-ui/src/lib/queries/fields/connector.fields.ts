// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';


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
