// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsString } from 'class-validator';
import { HashAlgorithmEnumType } from '@enums/hash-algorithm.enum';

/**
 * `CertificateHashDataType` — used by DeleteCertificate and the
 * `GetInstalledCertificateIds` response. The four fields together
 * uniquely identify a certificate without sending the full PEM.
 */
export class CertificateHashDataType {
  @IsEnum(HashAlgorithmEnumType)
  hashAlgorithm: HashAlgorithmEnumType;

  @IsString()
  issuerNameHash: string;

  @IsString()
  issuerKeyHash: string;

  @IsString()
  serialNumber: string;
}
