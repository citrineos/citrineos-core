// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import forge from 'node-forge';

export interface ICertificateAuthorityClient {
  getSignedCertificate(csrString: string, stationId?: string): Promise<string>;
  getCACertificates(stationId?: string): Promise<string>;
}
