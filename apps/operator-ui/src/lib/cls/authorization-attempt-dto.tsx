// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  AuthorizationAttemptDto,
  AuthorizationAttemptReason,
  AuthorizationDto,
  AuthorizationStatusEnumType,
  ChargingStationDto,
} from '@citrineos/types';

export class AuthorizationAttemptClass implements Partial<AuthorizationAttemptDto> {
  id?: number;
  stationId?: number | null;
  ocppVersion?: string;
  action?: string;
  correlationId?: string;
  timestamp?: string;
  idToken?: string;
  idTokenType?: string | null;
  authorizationId?: number | null;
  storedStatus?: AuthorizationStatusEnumType | null;
  responseStatus?: string | null;
  reason?: AuthorizationAttemptReason;
  details?: Record<string, unknown> | null;
  evseId?: number | null;
  connectorId?: number | null;
  transactionDatabaseId?: number | null;
  transactionCreatedAt?: Date | null;
  transactionId?: string | null;
  remoteStartId?: number | null;
  station?: Pick<ChargingStationDto, 'id' | 'ocppConnectionName'> | null;
  authorization?: Pick<AuthorizationDto, 'id' | 'idToken' | 'idTokenType'> | null;
  createdAt?: Date;
}
