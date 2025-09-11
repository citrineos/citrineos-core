// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { AdditionalInfo, IBaseDto, ITenantPartnerDto } from '../..';
import { AuthorizationStatusType, IdTokenType, AuthorizationWhitelistType } from './enum';

export interface IAuthorizationDto extends IBaseDto {
  id?: number;
  allowedConnectorTypes?: string[];
  disallowedEvseIdPrefixes?: string[];
  idToken: string;
  idTokenType?: IdTokenType | null;
  additionalInfo?: [AdditionalInfo, ...AdditionalInfo[]] | null;
  status: AuthorizationStatusType;
  cacheExpiryDateTime?: string | null;
  chargingPriority?: number | null;
  language1?: string | null;
  language2?: string | null;
  personalMessage?: any | null;
  groupAuthorizationId?: number | null;
  groupAuthorization?: IAuthorizationDto;
  concurrentTransaction?: boolean;
  realTimeAuth?: AuthorizationWhitelistType | null;
  realTimeAuthUrl?: string;
  tenantPartnerId?: number | null;
  tenantPartner?: ITenantPartnerDto | null;
}

export enum AuthorizationDtoProps {
  id = 'id',
  allowedConnectorTypes = 'allowedConnectorTypes',
  disallowedEvseIdPrefixes = 'disallowedEvseIdPrefixes',
  idToken = 'idToken',
  idTokenType = 'idTokenType',
  additionalInfo = 'additionalInfo',
  status = 'status',
  cacheExpiryDateTime = 'cacheExpiryDateTime',
  chargingPriority = 'chargingPriority',
  language1 = 'language1',
  language2 = 'language2',
  personalMessage = 'personalMessage',
  groupAuthorizationId = 'groupAuthorizationId',
  groupAuthorization = 'groupAuthorization',
  concurrentTransaction = 'concurrentTransaction',
  realTimeAuth = 'realTimeAuth',
  realTimeAuthUrl = 'realTimeAuthUrl',
}
