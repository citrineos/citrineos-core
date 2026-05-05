// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP 2.0.1 / 2.1 CertificateSigningUseEnumType — used by SignCertificate
 * to disambiguate ChargingStation TLS certs (ACME) from V2G certs (Hubject).
 */
export enum CertificateSigningUseEnumType {
  ChargingStationCertificate = 'ChargingStationCertificate',
  V2GCertificate = 'V2GCertificate',
}
