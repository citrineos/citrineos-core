// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';

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
