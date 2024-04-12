// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export class CsmsCertificateRequest {
    certificateChain: string;
    privateKey: string;
    caCertificate?: string;

    constructor(certificateChain: string, privateKey: string, caCertificate?: string) {
        this.certificateChain = certificateChain;
        this.privateKey = privateKey;
        this.caCertificate = caCertificate;
    }
}