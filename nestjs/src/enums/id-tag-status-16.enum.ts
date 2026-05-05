// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP 1.6 idTagInfo status — the wire values an Authorize / StartTransaction
 * response carries back to the charger.
 */
export enum IdTagInfoStatusEnum16 {
  Accepted = 'Accepted',
  Blocked = 'Blocked',
  Expired = 'Expired',
  Invalid = 'Invalid',
  ConcurrentTx = 'ConcurrentTx',
}
