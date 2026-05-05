// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsString } from 'class-validator';
import { InstallCertificateUseEnumType } from '@enums/install-certificate-use.enum';

/** OCPP 2.0.1 / 2.1 InstallCertificate request. */

export class InstallCertificateRequest {
  @IsEnum(InstallCertificateUseEnumType)
  certificateType: InstallCertificateUseEnumType;

  @IsString()
  certificate: string;
}
