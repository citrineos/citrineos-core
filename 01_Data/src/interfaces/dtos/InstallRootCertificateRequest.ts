// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { OCPP2_0_1 } from '@citrineos/base';

export class InstallRootCertificateRequest {
  // Fields for InstallCertificate message request
  stationId: string;
  certificateType: OCPP2_0_1.InstallCertificateUseEnumType;
  tenantId: number;
  callbackUrl?: string;
  // The file id of the root CA certificate. If not provided, it uses one from the external CA Server
  // according to the certificate type, e.g., lets encrypt, hubject.
  fileId?: string;

  constructor(
    stationId: string,
    tenantId: number,
    certificateType: OCPP2_0_1.InstallCertificateUseEnumType,
    callbackUrl?: string,
    fileId?: string,
  ) {
    this.stationId = stationId;
    this.tenantId = tenantId;
    this.certificateType = certificateType;
    this.callbackUrl = callbackUrl;
    this.fileId = fileId;
  }
}
