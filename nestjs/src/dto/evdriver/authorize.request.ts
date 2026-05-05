// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { IdTokenType } from '@dto/shared/id-token.dto';

/** OCPP 2.0.1 / 2.1 Authorize request. */

export class AuthorizeRequest {
  @ValidateNested()
  @Type(() => IdTokenType)
  idToken: IdTokenType;

  @IsOptional()
  @IsString()
  certificate?: string;

  @IsOptional()
  iso15118CertificateHashData?: unknown[];
}
