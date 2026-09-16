// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-request';

export const GET_CHARGING_STATION_BY_PK_QUERY = gql`
  query GetChargingStationByPk($id: Int!) {
    ChargingStations(where: { id: { _eq: $id } }) {
      id
      ocppConnectionName
      tenantId
      isOnline
      protocol
      chargePointVendor
      chargePointModel
      chargePointSerialNumber
      chargeBoxSerialNumber
      firmwareVersion
      iccid
      imsi
      meterType
      meterSerialNumber
      locationId
      createdAt
      updatedAt
      evses: Evses {
        id
        tenantId
        ocppConnectionName
        evseTypeId
        evseId
        physicalReference
        removed
        createdAt
        updatedAt
      }
      connectors: Connectors {
        id
        tenantId
        ocppConnectionName
        evseId
        connectorId
        evseTypeConnectorId
        status
        errorCode
        timestamp
        info
        vendorId
        vendorErrorCode
        createdAt
        updatedAt
      }
      tenant: Tenant {
        partyId
        countryCode
        name
        isUserTenant
      }
    }
  }
`;

export const GET_CHARGING_STATION_BY_ID_QUERY = gql`
  query GetChargingStationById($id: String!) {
    ChargingStations(where: { ocppConnectionName: { _eq: $id } }) {
      id
      ocppConnectionName
      tenantId
      isOnline
      protocol
      chargePointVendor
      chargePointModel
      chargePointSerialNumber
      chargeBoxSerialNumber
      firmwareVersion
      iccid
      imsi
      meterType
      meterSerialNumber
      locationId
      createdAt
      updatedAt
      evses: Evses {
        id
        tenantId
        ocppConnectionName
        evseTypeId
        evseId
        physicalReference
        removed
        createdAt
        updatedAt
      }
      connectors: Connectors {
        id
        tenantId
        ocppConnectionName
        evseId
        connectorId
        evseTypeConnectorId
        status
        errorCode
        timestamp
        info
        vendorId
        vendorErrorCode
        createdAt
        updatedAt
      }
      tenant: Tenant {
        partyId
        countryCode
        name
        isUserTenant
      }
    }
  }
`;
