// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

export const AUTHORIZATION_FIELDS = fieldSet([
  'id',
  'idToken',
  'idTokenType',
  'status',
  'groupAuthorizationId',
  'additionalInfo',
  'concurrentTransaction',
  'chargingPriority',
  'language1',
  'language2',
  'personalMessage',
  'cacheExpiryDateTime',
  'allowedConnectorTypes',
  'disallowedEvseIdPrefixes',
  'realTimeAuth',
  'realTimeAuthUrl',
  'createdAt',
  'updatedAt',
]);
