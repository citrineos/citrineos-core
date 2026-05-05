// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Type } from 'class-transformer';
import { IsEnum, IsString, ValidateNested } from 'class-validator';
import { HashAlgorithmEnumType } from '@enums/hash-algorithm.enum';

/** OCPP 2.0.1 / 2.1 OCSPRequestDataType — describes the cert to query. */
class OCSPRequestDataType {
  @IsEnum(HashAlgorithmEnumType)
  hashAlgorithm: HashAlgorithmEnumType;

  @IsString()
  issuerNameHash: string;

  @IsString()
  issuerKeyHash: string;

  @IsString()
  serialNumber: string;

  @IsString()
  responderURL: string;
}

/**
 * OCPP 2.0.1 / 2.1 GetCertificateStatus request — the charger asks the
 * CSMS to validate a contract certificate via OCSP. We forward the
 * request to the configured OCSP responder and return the response.
 */
export class GetCertificateStatusRequest {
  @ValidateNested()
  @Type(() => OCSPRequestDataType)
  ocspRequestData: OCSPRequestDataType;
}
