// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

/**
 * A meter value's own scalar fields. The station view takes a `pick`ed/`omit`ted subset; also nested
 * under transaction-event queries.
 */
export const METER_VALUE_FIELDS = fieldSet([
  'id',
  'transactionDatabaseId',
  'transactionEventId',
  'sampledValue',
  'timestamp',
  'createdAt',
  'updatedAt',
]);
