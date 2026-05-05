// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { GetCertificateIdUseEnumType } from '@enums/get-certificate-id-use.enum';

/** OCPP 2.0.1 / 2.1 GetInstalledCertificateIds request. */

export class GetInstalledCertificateIdsRequest {
  @IsOptional()
  @IsArray()
  @IsEnum(GetCertificateIdUseEnumType, { each: true })
  certificateType?: GetCertificateIdUseEnumType[];
}
