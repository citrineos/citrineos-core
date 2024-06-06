// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CountryNameEnumType, SignatureAlgorithmEnumType } from '../../layers/sequelize';

export class GenerateCertificateChainRequest {
  // Fields for generating a certificate
  // Refer to 1.4.1. Certificate Properties in OCPP 2.0.1 Part 2
  selfSigned: boolean;
  organizationName: string;
  commonName: string;
  keyLength?: number;
  validBefore?: string;
  countryName?: CountryNameEnumType;
  signatureAlgorithm?: SignatureAlgorithmEnumType;
  pathLen?: number;
  // The file path to store the generated certificate.
  // If we use directus files as storage, filePath is the folder id
  filePath?: string;

  constructor(
    selfSigned: boolean,
    organizationName: string,
    commonName: string,
    keyLength?: number,
    validBefore?: string,
    countryName?: CountryNameEnumType,
    signatureAlgorithm?: SignatureAlgorithmEnumType,
    pathLen?: number,
    filePath?: string,
  ) {
    this.selfSigned = selfSigned;
    this.organizationName = organizationName;
    this.commonName = commonName;
    this.keyLength = keyLength;
    this.validBefore = validBefore;
    this.countryName = countryName;
    this.signatureAlgorithm = signatureAlgorithm;
    this.pathLen = pathLen;
    this.filePath = filePath;
  }
}
