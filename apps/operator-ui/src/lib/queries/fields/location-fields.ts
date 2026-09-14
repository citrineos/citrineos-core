// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

export const LOCATION_CORE_FIELDS = fieldSet([
  'id',
  'name',
  'address',
  'city',
  'postalCode',
  'state',
  'country',
  'coordinates',
  'createdAt',
  'updatedAt',
]);

/** Detail-only fields, added on top of {@link LOCATION_CORE_FIELDS} on the Locations pages. */
export const LOCATION_DETAIL_FIELDS = fieldSet([
  'facilities',
  'timeZone',
  'parkingType',
  'openingHours',
]);
