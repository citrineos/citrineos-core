// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export class TlsCertificatesRequest {
  certificateChain: string[]; // file ids for the certificate chain,
  // order is leaf certificate followed by the intermediate certificates
  privateKey: string; // file id for the private key corresponding to the leaf certificate in the certificate chain
  rootCA?: string; // file id for the root CA to override the default root CAs which are allowed by Mozilla
  subCAKey?: string; // file id for the private key of sub CA for signing charging station certificate

  constructor(certificateChain: string[], privateKey: string, rootCA?: string, subCAKey?: string) {
    this.certificateChain = certificateChain;
    this.privateKey = privateKey;
    this.rootCA = rootCA;
    this.subCAKey = subCAKey;
  }
}
