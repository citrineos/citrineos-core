// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';

export const CHARGING_STATIONS_LIST_QUERY = gql`
  query ChargingStationsList(
    $offset: Int
    $limit: Int
    $order_by: [ChargingStations_order_by!]
    $where: ChargingStations_bool_exp
  ) {
    ChargingStations(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      id
      ocppConnectionName
      isOnline
      protocol
      locationId
      chargePointVendor
      chargePointModel
      firmwareVersion
      createdAt
      updatedAt
      floorLevel
      parkingRestrictions
      capabilities
      location: Location {
        id
        name
        address
        city
        postalCode
        state
        country
        coordinates
        createdAt
        updatedAt
      }
      evses: Evses {
        id
        evseTypeId
        evseId
        physicalReference
      }
      LatestStatusNotifications {
        id
        stationId
        ocppConnectionName
        statusNotificationId
        updatedAt
        createdAt
        StatusNotification {
          connectorId
          connectorStatus
          createdAt
          evseId
          stationId
          ocppConnectionName
          id
          timestamp
          updatedAt
        }
      }
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        id
        timeSpentCharging
        isActive
        chargingState
        stationId
        ocppConnectionName
        stoppedReason
        transactionId
        evseId
        remoteStartId
        totalKwh
        createdAt
        updatedAt
      }
      connectors: Connectors {
        connectorId
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
    ChargingStations_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const FAULTED_CHARGING_STATIONS_LIST_QUERY = gql`
  query ChargingStationsFaultedList(
    $offset: Int!
    $limit: Int!
    $order_by: [ChargingStations_order_by!]
    $where: ChargingStations_bool_exp = {}
  ) {
    ChargingStations(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: {
        _and: [
          {
            LatestStatusNotifications: {
              StatusNotification: { connectorStatus: { _eq: "Faulted" } }
            }
          }
          $where
        ]
      }
    ) {
      id
      ocppConnectionName
      isOnline
      protocol
      locationId
      createdAt
      updatedAt
      location: Location {
        id
        name
        address
        city
        postalCode
        state
        country
        coordinates
        createdAt
        updatedAt
      }
      LatestStatusNotifications {
        id
        ocppConnectionName
        statusNotificationId
        updatedAt
        createdAt
        StatusNotification {
          connectorId
          connectorStatus
          createdAt
          evseId
          ocppConnectionName
          id
          timestamp
          updatedAt
        }
      }
    }
    ChargingStations_aggregate(
      where: {
        _and: [
          {
            LatestStatusNotifications: {
              StatusNotification: { connectorStatus: { _eq: "Faulted" } }
            }
          }
          $where
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const CHARGING_STATIONS_STATUS_COUNT_QUERY = gql`
  query ChargingStationsCount {
    online: ChargingStations_aggregate(where: { isOnline: { _eq: true } }) {
      aggregate {
        count
      }
    }
    offline: ChargingStations_aggregate(
      where: { _or: [{ isOnline: { _eq: false } }, { isOnline: { _is_null: true } }] }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const CHARGING_STATIONS_GET_QUERY = gql`
  query GetChargingStationById($id: Int!) {
    ChargingStations_by_pk(id: $id) {
      id
      tenantId
      ocppConnectionName
      isOnline
      protocol
      locationId
      chargePointVendor
      chargePointModel
      firmwareVersion
      createdAt
      updatedAt
      floorLevel
      parkingRestrictions
      capabilities
      coordinates
      use16StatusNotification0
      location: Location {
        id
        name
        address
        city
        postalCode
        state
        country
        coordinates
        createdAt
        updatedAt
      }
      evses: Evses {
        id
        ocppConnectionName
        stationId
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
          evseTypeConnectorId
          connectorId
          status
          type
          maximumPowerWatts
          maximumAmperage
          maximumVoltage
          format
          powerType
          termsAndConditionsUrl
          tariffId
          errorCode
          timestamp
          info
          vendorId
          vendorErrorCode
          createdAt
          updatedAt
        }
      }
      LatestStatusNotifications {
        id
        ocppConnectionName
        stationId
        statusNotificationId
        updatedAt
        createdAt
        statusNotification: StatusNotification {
          connectorId
          connectorStatus
          createdAt
          evseId
          ocppConnectionName
          id
          stationId
          timestamp
          updatedAt
        }
      }
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        id
        stationId
        ocppConnectionName
        timeSpentCharging
        isActive
        chargingState
        ocppConnectionName
        stoppedReason
        transactionId
        evseId
        remoteStartId
        totalKwh
        createdAt
        updatedAt
      }
      connectors: Connectors {
        id
        ocppConnectionName
        stationId
        evseId
        connectorId
        status
        type
        maximumPowerWatts
        maximumAmperage
        maximumVoltage
        format
        powerType
        termsAndConditionsUrl
        tariffId
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
`;

export const GET_CHARGING_STATIONS_WITH_LOCATION_AND_LATEST_STATUS_NOTIFICATIONS_AND_TRANSACTIONS = gql`
  query GetChargingStationsWithLocationAndLatestStatusNotificationsAndTransactions {
    ChargingStations {
      id
      ocppConnectionName
      isOnline
      protocol
      locationId
      createdAt
      updatedAt
      latestStatusNotifications: LatestStatusNotifications {
        statusNotification: StatusNotification {
          id
          ocppConnectionName
          evseId
          connectorId
          timestamp
          connectorStatus
          createdAt
          updatedAt
        }
      }
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        id
        timeSpentCharging
        isActive
        chargingState
        ocppConnectionName
        stoppedReason
        transactionId
        evseId
        remoteStartId
        totalKwh
        createdAt
        updatedAt
      }
      location: Location {
        id
        name
        address
        city
        postalCode
        state
        country
        coordinates
        createdAt
        updatedAt
      }
      evses: Evses {
        id
        evseTypeId
        createdAt
        updatedAt
      }
    }
  }
`;

export const CHARGING_STATION_ONLINE_STATUS_QUERY = gql`
  query ChargingStationOnlineStatus($id: Int!) {
    ChargingStations_by_pk(id: $id) {
      id
      ocppConnectionName
      isOnline
      protocol
    }
  }
`;

export const CHARGING_STATIONS_CREATE_MUTATION = gql`
  mutation ChargingStationsCreate($object: ChargingStations_insert_input!) {
    insert_ChargingStations_one(object: $object) {
      id
      ocppConnectionName
      isOnline
      protocol
      locationId
      createdAt
      updatedAt
      floorLevel
      parkingRestrictions
      capabilities
    }
  }
`;

export const CHARGING_STATIONS_EDIT_MUTATION = gql`
  mutation ChargingStationsEdit($id: Int!, $object: ChargingStations_set_input!) {
    update_ChargingStations_by_pk(pk_columns: { id: $id }, _set: $object) {
      id
      ocppConnectionName
      isOnline
      protocol
      locationId
      createdAt
      updatedAt
    }
  }
`;

export const CHARGING_STATIONS_DELETE_MUTATION = gql`
  mutation ChargingStationsDelete($id: Int!) {
    delete_ChargingStations_by_pk(id: $id) {
      id
      ocppConnectionName
      isOnline
      protocol
      locationId
      createdAt
      updatedAt
    }
  }
`;
