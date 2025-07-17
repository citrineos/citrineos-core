// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum IdTokenType {
  Central = 'Central',
  eMAID = 'eMAID',
  ISO14443 = 'ISO14443',
  ISO15693 = 'ISO15693',
  KeyCode = 'KeyCode',
  Local = 'Local',
  MacAddress = 'MacAddress',
  NoAuthorization = 'NoAuthorization',
  Other = 'Other',
}

export enum RealTimeAuthEnumType {
  Never = 'Never',
  Allowed = 'Allowed',
  AllowedOffline = 'AllowedOffline',
}

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
