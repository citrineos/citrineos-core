// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export const enum ContentType {
    EncodedRawContent = "EncodedRawContent", // Base64 Encoded Raw Content Of Certificates
    FileId = "FileId" // File Id Of Certificates in the File Storage
}

export class CsmsCertificateRequest {
    contentType: ContentType;
    certificateChain: string;
    privateKeys: string;
    caCertificateRoots?: string;

    constructor(contentType: ContentType, certificateChain: string, privateKey: string, caCertificate?: string) {
        this.contentType = contentType;
        this.certificateChain = certificateChain;
        this.privateKeys = privateKey;
        this.caCertificateRoots = caCertificate;
    }
}