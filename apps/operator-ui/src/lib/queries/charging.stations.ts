// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { LOCATION_CORE_FIELDS } from '@lib/queries/fields/location.fields';
import {
  CONNECTOR_SPEC_FIELDS,
  CONNECTOR_STATUS_FIELDS,
} from '@lib/queries/fields/connector.fields';
import { STATUS_NOTIFICATION_FIELDS } from '@lib/queries/fields/status.notification.fields';
import { ACTIVE_TRANSACTION_FIELDS } from '@lib/queries/fields/transaction.fields';
import { EVSE_CORE_FIELDS, EVSE_DETAIL_FIELDS } from '@lib/queries/fields/evse.fields';
import { CHARGING_STATION_CORE_FIELDS } from '@lib/queries/fields/charging.station.fields';

export const CHARGING_STATIONS_LIST_QUERY = gql`
  query ChargingStationsList(
    $offset: Int
    $limit: Int
    $order_by: [ChargingStations_order_by!]
    $where: ChargingStations_bool_exp
  ) {
    ChargingStations(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${CHARGING_STATION_CORE_FIELDS}
      chargePointVendor
      chargePointModel
      firmwareVersion
      floorLevel
      parkingRestrictions
      capabilities
      location: Location {
        ${LOCATION_CORE_FIELDS}
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
          ${STATUS_NOTIFICATION_FIELDS}
          stationId
        }
      }
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        ${ACTIVE_TRANSACTION_FIELDS}
        stationId
      }
      connectors: Connectors {
        connectorId
        ${CONNECTOR_STATUS_FIELDS}
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
      ${CHARGING_STATION_CORE_FIELDS}
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      LatestStatusNotifications {
        id
        ocppConnectionName
        statusNotificationId
        updatedAt
        createdAt
        StatusNotification {
          ${STATUS_NOTIFICATION_FIELDS}
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
      ${CHARGING_STATION_CORE_FIELDS}
      tenantId
      chargePointVendor
      chargePointModel
      firmwareVersion
      floorLevel
      parkingRestrictions
      capabilities
      coordinates
      use16StatusNotification0
      connectedWebsocketServerConfigId
      ConnectedServerNetworkProfile {
        id
        host
        port
        protocols
        securityProfile
        allowUnknownChargingStations
      }
      SetNetworkProfiles(order_by: { updatedAt: desc }) {
        websocketServerConfigId
        securityProfile
      }
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      evses: Evses {
        ${EVSE_CORE_FIELDS}
        ${EVSE_DETAIL_FIELDS}
        stationId
        connectors: Connectors {
          id
          ocppConnectionName
          evseId
          evseTypeConnectorId
          connectorId
          ${CONNECTOR_STATUS_FIELDS}
          ${CONNECTOR_SPEC_FIELDS}
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
          ${STATUS_NOTIFICATION_FIELDS}
          stationId
        }
      }
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        ${ACTIVE_TRANSACTION_FIELDS}
        stationId
      }
      connectors: Connectors {
        id
        ocppConnectionName
        stationId
        evseId
        connectorId
        ${CONNECTOR_STATUS_FIELDS}
        ${CONNECTOR_SPEC_FIELDS}
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_CHARGING_STATIONS_WITH_LOCATION_AND_LATEST_STATUS_NOTIFICATIONS_AND_TRANSACTIONS = gql`
  query GetChargingStationsWithLocationAndLatestStatusNotificationsAndTransactions {
    ChargingStations {
      ${CHARGING_STATION_CORE_FIELDS}
      latestStatusNotifications: LatestStatusNotifications {
        statusNotification: StatusNotification {
          ${STATUS_NOTIFICATION_FIELDS}
        }
      }
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        ${ACTIVE_TRANSACTION_FIELDS}
      }
      location: Location {
        ${LOCATION_CORE_FIELDS}
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
      ${CHARGING_STATION_CORE_FIELDS}
      floorLevel
      parkingRestrictions
      capabilities
    }
  }
`;

export const CHARGING_STATIONS_EDIT_MUTATION = gql`
  mutation ChargingStationsEdit($id: Int!, $object: ChargingStations_set_input!) {
    update_ChargingStations_by_pk(pk_columns: { id: $id }, _set: $object) {
      ${CHARGING_STATION_CORE_FIELDS}
    }
  }
`;

export const CHARGING_STATIONS_DELETE_MUTATION = gql`
  mutation ChargingStationsDelete($id: Int!) {
    delete_ChargingStations_by_pk(id: $id) {
      ${CHARGING_STATION_CORE_FIELDS}
    }
  }
`;
