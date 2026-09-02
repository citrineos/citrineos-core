// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export enum OcpiHttpHeader {
  XRequestId = 'X-Request-ID',
  XCorrelationId = 'X-Correlation-ID',
  OcpiFromCountryCode = 'OCPI-from-country-code',
  OcpiFromPartyId = 'OCPI-from-party-id',
  OcpiToCountryCode = 'OCPI-to-country-code',
  OcpiToPartyId = 'OCPI-to-party-id',
  Link = 'Link',
  XTotalCount = 'X-Total-Count',
  XLimit = 'X-Limit',
}
