// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

export const STATUS_NOTIFICATION_FIELDS = fieldSet([
  'id',
  'connectorId',
  'connectorStatus',
  'evseId',
  'ocppConnectionName',
  'timestamp',
  'createdAt',
  'updatedAt',
]);
