// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { CertificateHashDataType } from '@dto/shared/certificate-hash-data.dto';

/** OCPP 2.0.1 / 2.1 DeleteCertificate request. */

export class DeleteCertificateRequest {
  @ValidateNested()
  @Type(() => CertificateHashDataType)
  certificateHashData: CertificateHashDataType;
}
