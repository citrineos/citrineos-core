// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

/**
 * The top-level transaction-detail selection (list/detail pages). Queries that also carry
 * `stationId` / `locationId` / `authorizationId` add them inline; tariffs omits `ocppConnectionName`.
 */
export const TRANSACTION_DETAIL_FIELDS = fieldSet([
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
  'startTime',
  'endTime',
  'createdAt',
  'updatedAt',
]);

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
