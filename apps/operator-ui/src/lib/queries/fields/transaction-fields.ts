// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field-set';

/**
 * The top-level transaction-detail selection (list/detail pages). Queries that also carry
 * `locationId` / `authorizationId` add them inline. The station's connection name is not a
 * transaction column — reach it through the `ChargingStation` relation.
 */
export const TRANSACTION_DETAIL_FIELDS = fieldSet([
  'id',
  'timeSpentCharging',
  'isActive',
  'chargingState',
  'stationId',
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
  'stationId',
  'stoppedReason',
  'transactionId',
  'evseId',
  'remoteStartId',
  'totalKwh',
  'createdAt',
  'updatedAt',
]);
