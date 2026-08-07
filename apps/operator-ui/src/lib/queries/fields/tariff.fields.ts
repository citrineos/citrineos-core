// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

/** A tariff's own scalar fields (tariff list/detail). Transactions nest a `pick`ed subset. */
export const TARIFF_FIELDS = fieldSet([
  'id',
  'currency',
  'pricePerKwh',
  'pricePerMin',
  'pricePerSession',
  'authorizationAmount',
  'paymentFee',
  'taxRate',
  'tariffAltText',
  'createdAt',
  'updatedAt',
]);
