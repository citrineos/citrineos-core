// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {InstallCertificateUseEnumType} from "@citrineos/base";

export class ChargerCertificateRequest {
    // Fields for InstallCertificate message request
    stationId: string;
    certificateType: InstallCertificateUseEnumType;
    tenantId: string;
    callbackUrl?: string;
    // Fields for generating a certificate
    // Refer to 1.4.1. Certificate Properties in OCPP 2.0.1 Part 2
    organizationName?: string;
    commonName?: string;
    serialNumber?: string;
    keyLength?: number;
    validBefore?: string;
    // If use directus files as storage, filePath is the folder id
    filePath?: string;

    constructor(stationId: string, tenantId: string, certificateType: InstallCertificateUseEnumType,
                callbackUrl?: string, organizationName?: string, fileId?: string, commonName?: string,
                serialNumber?: string, keyLength?: number, validBefore?: string, filePath?: string) {
        this.stationId = stationId;
        this.tenantId = tenantId;
        this.certificateType = certificateType;
        this.organizationName = organizationName;
        this.commonName = commonName;
        this.serialNumber = serialNumber;
        this.keyLength = keyLength;
        this.validBefore = validBefore;
        this.filePath = filePath;
    }
}