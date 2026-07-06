// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-request';

export const GET_LOCATIONS_QUERY = gql`
  query GetLocations($limit: Int, $offset: Int, $where: Locations_bool_exp!) {
    Locations(offset: $offset, limit: $limit, order_by: { createdAt: asc }, where: $where) {
      id
      name
      address
      city
      coordinates
      country
      createdAt
      facilities
      openingHours
      parkingType
      postalCode
      publishUpstream
      state
      timeZone
      updatedAt
      tenant: Tenant {
        partyId
        countryCode
        name
        isUserTenant
      }
      chargingPool: ChargingStations {
        id
        ocppConnectionName
        isOnline
        protocol
        capabilities
        chargePointVendor
        chargePointModel
        chargePointSerialNumber
        chargeBoxSerialNumber
        coordinates
        firmwareVersion
        floorLevel
        iccid
        imsi
        meterType
        meterSerialNumber
        parkingRestrictions
        locationId
        createdAt
        updatedAt
        evses: Evses {
          id
          ocppConnectionName
          evseTypeId
          evseId
          physicalReference
          removed
          createdAt
          updatedAt
          connectors: Connectors {
            id
            ocppConnectionName
            evseId
            connectorId
            evseTypeConnectorId
            format
            maximumAmperage
            maximumPowerWatts
            maximumVoltage
            powerType
            termsAndConditionsUrl
            type
            status
            errorCode
            timestamp
            info
            vendorId
            vendorErrorCode
            createdAt
            updatedAt
          }
        }
      }
    }
  }
`;

export const GET_LOCATION_BY_ID_QUERY = gql`
  query GetLocationById($id: Int!) {
    Locations(where: { id: { _eq: $id } }) {
      id
      name
      address
      city
      coordinates
      country
      createdAt
      facilities
      openingHours
      parkingType
      postalCode
      publishUpstream
      state
      timeZone
      updatedAt
      tenant: Tenant {
        partyId
        countryCode
        name
        isUserTenant
      }
      chargingPool: ChargingStations {
        id
        ocppConnectionName
        isOnline
        protocol
        capabilities
        chargePointVendor
        chargePointModel
        chargePointSerialNumber
        chargeBoxSerialNumber
        coordinates
        firmwareVersion
        floorLevel
        iccid
        imsi
        meterType
        meterSerialNumber
        parkingRestrictions
        locationId
        createdAt
        updatedAt
        evses: Evses {
          id
          ocppConnectionName
          evseTypeId
          evseId
          physicalReference
          removed
          createdAt
          updatedAt
          connectors: Connectors {
            id
            ocppConnectionName
            evseId
            connectorId
            evseTypeConnectorId
            format
            maximumAmperage
            maximumPowerWatts
            maximumVoltage
            powerType
            termsAndConditionsUrl
            type
            status
            errorCode
            timestamp
            info
            vendorId
            vendorErrorCode
            createdAt
            updatedAt
          }
        }
      }
    }
  }
`;

export const GET_EVSE_BY_ID_QUERY = gql`
  query GetEvseById($locationId: Int!, $stationId: String!, $evseId: Int!) {
    Locations(where: { id: { _eq: $locationId } }) {
      chargingPool: ChargingStations(where: { ocppConnectionName: { _eq: $stationId } }) {
        id
        ocppConnectionName
        isOnline
        protocol
        capabilities
        chargePointVendor
        chargePointModel
        chargePointSerialNumber
        chargeBoxSerialNumber
        coordinates
        firmwareVersion
        floorLevel
        iccid
        imsi
        meterType
        meterSerialNumber
        parkingRestrictions
        locationId
        createdAt
        updatedAt
        evses: Evses(where: { id: { _eq: $evseId } }) {
          id
          ocppConnectionName
          evseTypeId
          evseId
          physicalReference
          removed
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const GET_CONNECTOR_BY_ID_QUERY = gql`
  query GetConnectorById(
    $locationId: Int!
    $stationId: String!
    $evseId: Int!
    $connectorId: Int!
  ) {
    Locations(where: { id: { _eq: $locationId } }) {
      chargingPool: ChargingStations(where: { ocppConnectionName: { _eq: $stationId } }) {
        evses: Evses(where: { id: { _eq: $evseId } }) {
          connectors: Connectors(where: { connectorId: { _eq: $connectorId } }) {
            id
            ocppConnectionName
            evseId
            connectorId
            evseTypeConnectorId
            format
            maximumAmperage
            maximumPowerWatts
            maximumVoltage
            powerType
            termsAndConditionsUrl
            type
            status
            errorCode
            timestamp
            info
            vendorId
            vendorErrorCode
            createdAt
            updatedAt
          }
        }
      }
    }
  }
`;
