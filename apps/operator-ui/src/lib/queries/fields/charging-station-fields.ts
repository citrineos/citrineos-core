// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

export const CHARGING_STATION_CORE_FIELDS = fieldSet([
  'id',
  'ocppConnectionName',
  'isOnline',
  'protocol',
  'locationId',
  'createdAt',
  'updatedAt',
]);

/** Device + physical detail fields, added on top of {@link CHARGING_STATION_CORE_FIELDS}. */
export const CHARGING_STATION_DETAIL_FIELDS = fieldSet([
  'chargePointVendor',
  'chargePointModel',
  'firmwareVersion',
  'floorLevel',
  'parkingRestrictions',
  'capabilities',
]);
