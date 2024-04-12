// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export class CsmsCertificateRequest {
    certificateChain: string;
    privateKeys: string;
    caCertificateRoots?: string;

    constructor(certificateChain: string, privateKey: string, caCertificate?: string) {
        this.certificateChain = certificateChain;
        this.privateKeys = privateKey;
        this.caCertificateRoots = caCertificate;
    }
}