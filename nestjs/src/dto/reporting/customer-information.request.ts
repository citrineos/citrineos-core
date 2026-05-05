// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { IdTokenType } from '@dto/shared/id-token.dto';

/**
 * OCPP 2.0.1 / 2.1 CustomerInformation request.
 *
 * `customerCertificate` is an opaque PEM/DER blob — handled by the
 * Certificate Authority subsystem when present.
 */
export class CustomerInformationRequest {
  @IsNumber()
  requestId: number;

  @IsBoolean()
  report: boolean;

  @IsBoolean()
  clear: boolean;

  @IsOptional()
  @IsString()
  customerIdentifier?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => IdTokenType)
  idToken?: IdTokenType;

  @IsOptional()
  customerCertificate?: Record<string, unknown>;
}
