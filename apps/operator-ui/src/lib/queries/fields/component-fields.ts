// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

/** A component's own scalar fields; also nested under variable-attribute queries. */
export const COMPONENT_FIELDS = fieldSet([
  'id',
  'instance',
  'name',
  'evseDatabaseId',
  'createdAt',
  'updatedAt',
]);
