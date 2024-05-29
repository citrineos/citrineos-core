// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { InstallCertificateUseEnumType } from '@citrineos/base';

export class InstallRootCertificateRequest {
  // Fields for InstallCertificate message request
  stationId: string;
  certificateType: InstallCertificateUseEnumType;
  tenantId: string;
  callbackUrl?: string;
  // The file id of the root CA certificate. If not provided, it uses one from the external CA Server
  // according to the certificate type, e.g., lets encrypt, hubject.
  fileId?: string;

  constructor(stationId: string, tenantId: string, certificateType: InstallCertificateUseEnumType, callbackUrl?: string, fileId?: string) {
    this.stationId = stationId;
    this.tenantId = tenantId;
    this.certificateType = certificateType;
    this.callbackUrl = callbackUrl;
    this.fileId = fileId;
  }
}
