// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

/** A transaction event's own scalar fields (list + per-transaction list share the same selection). */
export const TRANSACTION_EVENT_FIELDS = fieldSet([
  'id',
  'offline',
  'eventType',
  'ocppConnectionName',
  'triggerReason',
  'evseId',
  'numberOfPhasesUsed',
  'reservationId',
  'seqNo',
  'transactionDatabaseId',
  'transactionInfo',
  'cableMaxCurrent',
  'createdAt',
  'timestamp',
  'updatedAt',
]);
