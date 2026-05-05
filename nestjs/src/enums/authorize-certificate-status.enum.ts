// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum AuthorizeCertificateStatusEnumType {
  Accepted = 'Accepted',
  SignatureError = 'SignatureError',
  CertificateExpired = 'CertificateExpired',
  CertificateRevoked = 'CertificateRevoked',
  NoCertificateAvailable = 'NoCertificateAvailable',
  CertChainError = 'CertChainError',
  ContractCancelled = 'ContractCancelled',
}
