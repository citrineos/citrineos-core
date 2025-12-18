// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export { Certificate } from './Certificate.js';
export { InstalledCertificate } from './InstalledCertificate.js';

export const enum SignatureAlgorithmEnumType {
  RSA = 'SHA256withRSA',
  ECDSA = 'SHA256withECDSA',
}

export const enum CountryNameEnumType {
  US = 'US',
}
