// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

export const EVSE_TYPE_FIELDS = fieldSet([
  'databaseId',
  'id',
  'connectorId',
  'createdAt',
  'updatedAt',
]);
