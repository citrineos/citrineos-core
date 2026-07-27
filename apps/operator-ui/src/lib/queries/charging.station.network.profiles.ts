// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';

/**
 * Network profiles pushed to a single charging station.
 *
 * Returns every SetNetworkProfiles row for the station (the full set of pushed profiles across
 * all configuration slots, newest first within each slot), each joined to its ServerNetworkProfile
 * (websocket server config).
 *
 * NOTE: only fields that are safe to expose in the operator UI are selected. The
 * ServerNetworkProfile's TLS/mTLS file-path fields (tlsKeyFilePath,
 * tlsCertificateChainFilePath, mtlsCertificateAuthorityKeyFilePath, rootCACertificateFilePath)
 * are deliberately omitted.
 */
export const CHARGING_STATION_NETWORK_PROFILES_QUERY = gql`
  query GetChargingStationNetworkProfiles($ocppConnectionName: String!) {
    SetNetworkProfiles(
      where: { ocppConnectionName: { _eq: $ocppConnectionName } }
      order_by: [{ configurationSlot: asc }, { updatedAt: desc }]
    ) {
      id
      configurationSlot
      ocppVersion
      ocppTransport
      ocppCsmsUrl
      messageTimeout
      securityProfile
      websocketServerConfigId
      updatedAt
      ServerNetworkProfile {
        id
        host
        port
        protocols
        pingInterval
        messageTimeout
        securityProfile
        allowUnknownChargingStations
      }
    }
  }
`;

/**
 * A single websocket server config, safe fields only (for the "server id → details" link
 * from the detail card / network profiles tab). TLS/mTLS file paths are intentionally omitted.
 */
export const SERVER_NETWORK_PROFILE_SAFE_GET_QUERY = gql`
  query GetServerNetworkProfileSafeById($id: String!) {
    ServerNetworkProfiles_by_pk(id: $id) {
      id
      host
      port
      protocols
      pingInterval
      messageTimeout
      securityProfile
      allowUnknownChargingStations
    }
  }
`;
