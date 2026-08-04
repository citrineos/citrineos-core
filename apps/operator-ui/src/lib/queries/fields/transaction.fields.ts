// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

export const ACTIVE_TRANSACTION_FIELDS = fieldSet([
  'id',
  'timeSpentCharging',
  'isActive',
  'chargingState',
  'ocppConnectionName',
  'stoppedReason',
  'transactionId',
  'evseId',
  'remoteStartId',
  'totalKwh',
  'createdAt',
  'updatedAt',
]);
