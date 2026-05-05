// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum AuthorizationStatusEnumType {
  Accepted = 'Accepted',
  Blocked = 'Blocked',
  ConcurrentTx = 'ConcurrentTx',
  Expired = 'Expired',
  Invalid = 'Invalid',
  NoCredit = 'NoCredit',
  NotAllowedTypeEVSE = 'NotAllowedTypeEVSE',
  NotAtThisLocation = 'NotAtThisLocation',
  NotAtThisTime = 'NotAtThisTime',
  Unknown = 'Unknown',
}
