// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

/** An installed certificate's own scalar fields (list/detail share the same selection). */
export const INSTALLED_CERTIFICATE_FIELDS = fieldSet([
  'id',
  'ocppConnectionName',
  'hashAlgorithm',
  'issuerNameHash',
  'issuerKeyHash',
  'serialNumber',
  'certificateType',
]);
