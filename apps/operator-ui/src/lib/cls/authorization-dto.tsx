// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  AdditionalInfo,
  AuthorizationDto,
  AuthorizationStatusEnumType,
  AuthorizationWhitelistEnumType,
  GroupAuthorizationDto,
  IdTokenEnumType,
  TenantPartnerDto,
} from '@citrineos/types';

export class AuthorizationClass implements Partial<AuthorizationDto> {
  id?: number;
  allowedConnectorTypes?: string[];
  disallowedEvseIdPrefixes?: string[];
  idToken!: string;
  idTokenType?: IdTokenEnumType | null;
  additionalInfo?: [AdditionalInfo, ...AdditionalInfo[]] | null;
  status!: AuthorizationStatusEnumType;
  cacheExpiryDateTime?: string | null;
  chargingPriority?: number | null;
  language1?: string | null;
  language2?: string | null;
  personalMessage?: any | null;
  groupAuthorizationId?: number | null;
  groupAuthorization?: GroupAuthorizationDto;
  concurrentTransaction?: boolean;
  realTimeAuth?: AuthorizationWhitelistEnumType;
  realTimeAuthUrl?: string;
  tenantPartner?: TenantPartnerDto;
}
