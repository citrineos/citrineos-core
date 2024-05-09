// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export interface IV2GCertificateAuthorityClient {
  getSignedCertificate(csrString: string): Promise<string>;
  getCACertificates(): Promise<string>;
  getSignedContractData(
    certificateInstallationReq: string,
    xsdMsgDefNamespace: string,
  ): Promise<string>;
}

export interface IChargingStationCertificateAuthorityClient {
  getRootCACertificate(): Promise<string>;
  getCertificateChain(csrString: string, stationId: string): Promise<string>;
  signCertificateByExternalCA(csrString: string): Promise<string>;
}
