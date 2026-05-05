// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CertificateSigningUseEnumType } from '@enums/sign-certificate-use.enum';

/** OCPP 2.0.1 / 2.1 SignCertificate request. */

export class SignCertificateRequest {
  @IsString()
  csr: string;

  @IsOptional()
  @IsEnum(CertificateSigningUseEnumType)
  certificateType?: CertificateSigningUseEnumType;
}
