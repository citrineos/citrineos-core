// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CertificateSigningUseEnumType } from '@enums/sign-certificate-use.enum';

/**
 * OCPP 2.0.1 / 2.1 CertificateSigned request — CSMS-initiated. Delivers
 * a freshly-signed cert chain back to the charger after a SignCertificate
 * round-trip completes against an external CA.
 *
 * Mostly fired internally by `CertificateSignedDispatcher`; the REST
 * endpoint exists for operator override (e.g. delivering a cert from a
 * manual CA flow).
 */
export class CertificateSignedRequest {
  @IsString()
  certificateChain: string;

  @IsOptional()
  @IsEnum(CertificateSigningUseEnumType)
  certificateType?: CertificateSigningUseEnumType;
}
