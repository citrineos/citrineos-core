// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IBaseDto } from './base.dto';
import { IIdTokenDto } from './id.token.dto';
import { IIdTokenInfoDto } from './id.token.info.dto';
import { RealTimeAuthEnumType } from '../../util/enums';

export interface IAuthorizationDto extends IBaseDto {
  id: number;
  allowedConnectorTypes: any[];
  disallowedEvseIdPrefixes: any[];
  idTokenId: number;
  idToken?: IIdTokenDto;
  idTokenInfoId: number;
  idTokenInfo?: IIdTokenInfoDto;
  concurrentTransaction?: boolean;
  realTimeAuth: RealTimeAuthEnumType;
}

export enum AuthorizationDtoProps {
  id = 'id',
  allowedConnectorTypes = 'allowedConnectorTypes',
  disallowedEvseIdPrefixes = 'disallowedEvseIdPrefixes',
  idTokenId = 'idTokenId',
  idToken = 'idToken',
  idTokenInfoId = 'idTokenInfoId',
  idTokenInfo = 'idTokenInfo',
  concurrentTransaction = 'concurrentTransaction',
  realTimeAuth = 'realTimeAuth',
}
