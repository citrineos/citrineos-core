// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

/**
 * A variable-attribute's own scalar fields. The nested `Variable` / `Component` relations are composed
 * at the query level from VARIABLE_FIELDS / COMPONENT_FIELDS.
 */
export const VARIABLE_ATTRIBUTE_FIELDS = fieldSet([
  'id',
  'ocppConnectionName',
  'type',
  'dataType',
  'value',
  'mutability',
  'persistent',
  'constant',
  'variableId',
  'componentId',
  'evseDatabaseId',
  'createdAt',
  'updatedAt',
]);
