// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export interface ICertificateAuthorityClient {
  getSignedCertificate(csr: string): Promise<string>;
  getCACertificates(): Promise<string>;
}
