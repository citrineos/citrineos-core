// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { InstallCertificateUseEnumType } from '@citrineos/base';

export class RootCertificateRequest {
  // Fields for InstallCertificate message request
  stationId: string;
  certificateType: InstallCertificateUseEnumType;
  tenantId: string;
  callbackUrl?: string;
  // Fields for generating a certificate
  // Refer to 1.4.1. Certificate Properties in OCPP 2.0.1 Part 2
  selfSigned?: boolean;
  organizationName?: string;
  commonName?: string;
  serialNumber?: string;
  keyLength?: number;
  validBefore?: string;
  // Fields for reading and uploading certificate from file storage
  // If we use directus files as storage, filePath is the folder id
  filePath?: string;
  certificateFileId?: string;
  privateKeyFileId?: string;

  constructor(
    stationId: string,
    tenantId: string,
    certificateType: InstallCertificateUseEnumType,
    callbackUrl?: string,
    selfSigned?: boolean,
    organizationName?: string,
    commonName?: string,
    serialNumber?: string,
    keyLength?: number,
    validBefore?: string,
    filePath?: string,
    certificateFileId?: string,
    privateKeyFileId?: string,
  ) {
    this.stationId = stationId;
    this.tenantId = tenantId;
    this.certificateType = certificateType;
    this.selfSigned = selfSigned;
    this.organizationName = organizationName;
    this.commonName = commonName;
    this.serialNumber = serialNumber;
    this.keyLength = keyLength;
    this.validBefore = validBefore;
    this.filePath = filePath;
    this.callbackUrl = callbackUrl;
    this.certificateFileId = certificateFileId;
    this.privateKeyFileId = privateKeyFileId;
  }
}
