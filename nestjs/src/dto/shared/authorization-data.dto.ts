// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AuthorizationStatusEnumType } from '@enums/authorization-status.enum';
import { IdTokenType } from '@dto/shared/id-token.dto';

/** OCPP 2.0.1 / 2.1 IdTokenInfoType — payload of the SendLocalList wire DTO. */

export class IdTokenInfoType {
  @IsEnum(AuthorizationStatusEnumType)
  status: AuthorizationStatusEnumType;

  @IsOptional()
  @IsString()
  cacheExpiryDateTime?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => IdTokenType)
  groupIdToken?: IdTokenType;

  @IsOptional()
  @IsString()
  language1?: string;

  @IsOptional()
  @IsString()
  language2?: string;
}

/** Single entry of a `localAuthorizationList` array. */

export class AuthorizationData {
  @ValidateNested()
  @Type(() => IdTokenType)
  idToken: IdTokenType;

  @IsOptional()
  @ValidateNested()
  @Type(() => IdTokenInfoType)
  idTokenInfo?: IdTokenInfoType;
}
