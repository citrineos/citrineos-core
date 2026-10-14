// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

export const NETWORK_ALERT_FIELDS = fieldSet([
  'id',
  'type',
  'severity',
  'status',
  'stationId',
  'evseId',
  'connectorId',
  'firstSeenAt',
  'lastSeenAt',
  'occurrenceCount',
  'resolvedAt',
  'resolvedBy',
  'statusNote',
  'details',
  'createdAt',
  'updatedAt',
]);
