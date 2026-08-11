// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fieldSet } from '@lib/queries/fields/field.set';

/**
 * The basic server-network-profile selection used when a profile is referenced from another entity
 * (nested `ServerNetworkProfile`, the safe-get, and the charging-station `ConnectedServerNetworkProfile`
 * subset via `omit`).
 */
export const SERVER_NETWORK_PROFILE_BASIC_FIELDS = fieldSet([
  'id',
  'host',
  'port',
  'protocols',
  'pingInterval',
  'messageTimeout',
  'securityProfile',
  'allowUnknownChargingStations',
]);

/**
 * The full server-network-profile selection (list/detail pages), including TLS paths and tenant
 * resolution. Field order differs from the basic set, so it is its own list rather than a superset.
 */
export const SERVER_NETWORK_PROFILE_FULL_FIELDS = fieldSet([
  'id',
  'host',
  'port',
  'pingInterval',
  'protocols',
  'messageTimeout',
  'securityProfile',
  'allowUnknownChargingStations',
  'tlsKeyFilePath',
  'tlsCertificateChainFilePath',
  'mtlsCertificateAuthorityKeyFilePath',
  'rootCACertificateFilePath',
  'dynamicTenantResolution',
]);
