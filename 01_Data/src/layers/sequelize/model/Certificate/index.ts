// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

export { Certificate } from './Certificate';
export { InstalledCertificate } from './InstalledCertificate';

export const enum SignatureAlgorithmEnumType {
  RSA = 'SHA256withRSA',
  ECDSA = 'SHA256withECDSA',
}

export const enum CountryNameEnumType {
  US = 'US',
}
