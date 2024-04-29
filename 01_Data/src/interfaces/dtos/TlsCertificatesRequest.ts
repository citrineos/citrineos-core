// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export const enum ContentType {
  EncodedRawContent = 'EncodedRawContent', // Base64 encoded raw content Of certificates and keys
  FileId = 'FileId', // Pem file id of certificates in the File Storage
}

export class TlsCertificatesRequest {
  contentType: ContentType;
  certificateChain: string; // certificate chain consisting of the leaf certificate followed by the intermediate certificates
  privateKey: string; // private key corresponding to the leaf certificate in the certificate chain
  rootCA?: string; // root CA to override the default root CAs which are allowed by Mozilla
  subCAKey?: string; // private key of sub CA for signing charging station certificate

  constructor(contentType: ContentType, certificateChain: string, privateKey: string, rootCA?: string, subCAKey?: string) {
    this.contentType = contentType;
    this.certificateChain = certificateChain;
    this.privateKey = privateKey;
    this.rootCA = rootCA;
    this.subCAKey = subCAKey;
  }
}
