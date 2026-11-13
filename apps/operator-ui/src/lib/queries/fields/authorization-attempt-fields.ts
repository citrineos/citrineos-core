// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

export const AUTHORIZATION_ATTEMPT_FIELDS = fieldSet([
  'id',
  'stationId',
  'ocppVersion',
  'action',
  'correlationId',
  'timestamp',
  'idToken',
  'idTokenType',
  'authorizationId',
  'storedStatus',
  'responseStatus',
  'reason',
  'details',
  'evseId',
  'connectorId',
  'transactionDatabaseId',
  'transactionCreatedAt',
  'transactionId',
  'remoteStartId',
  'createdAt',
]);
