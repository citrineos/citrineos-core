// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export class GenerateRootCertificatesRequest {
  // Fields for generating a certificate
  // Refer to 1.4.1. Certificate Properties in OCPP 2.0.1 Part 2
  selfSigned: boolean;
  organizationName: string;
  commonName: string;
  serialNumber?: string;
  keyLength?: number;
  validBefore?: string;
  // The file path to store the generated certificate.
  // If we use directus files as storage, filePath is the folder id
  filePath?: string;

  constructor(selfSigned: boolean, organizationName: string, commonName: string, serialNumber?: string, keyLength?: number, validBefore?: string, filePath?: string) {
    this.selfSigned = selfSigned;
    this.organizationName = organizationName;
    this.commonName = commonName;
    this.serialNumber = serialNumber;
    this.keyLength = keyLength;
    this.validBefore = validBefore;
    this.filePath = filePath;
  }
}
