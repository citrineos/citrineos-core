// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

export const NETWORK_ALERT_OCCURRENCE_FIELDS = fieldSet([
  'id',
  'alertId',
  'type',
  'occurredAt',
  'severity',
  'websocketEventId',
  'statusNotificationId',
  'ocppMessageId',
  'details',
  'createdAt',
  'updatedAt',
]);
