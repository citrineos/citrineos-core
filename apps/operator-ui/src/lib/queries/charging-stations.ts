// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { LOCATION_CORE_FIELDS } from '@lib/queries/fields/location-fields';
import {
  CONNECTOR_FULL_FIELDS,
  CONNECTOR_SPEC_FIELDS,
  CONNECTOR_STATUS_FIELDS,
} from '@lib/queries/fields/connector-fields';
import { STATUS_NOTIFICATION_FIELDS } from '@lib/queries/fields/status-notification-fields';
import { ACTIVE_TRANSACTION_FIELDS } from '@lib/queries/fields/transaction-fields';
import { EVSE_CORE_FIELDS, EVSE_DETAIL_FIELDS } from '@lib/queries/fields/evse-fields';
import {
  CHARGING_STATION_CORE_FIELDS,
  CHARGING_STATION_DETAIL_FIELDS,
} from '@lib/queries/fields/charging-station-fields';
import { SERVER_NETWORK_PROFILE_BASIC_FIELDS } from '@lib/queries/fields/server-network-profile-fields';
import { ConnectorStatusEnum, OCPPVersion } from '@citrineos/types';

// Where a connector's status is read from depends on the station's protocol:
//   - 2.1: the connector's own status.
//   - 1.6 & 2.0.1: the connector's latest status notification.
//   - Stations with no protocol behave like 1.6 and 2.0.1
const FAULTED_CHARGING_STATION_FILTER = `
  {
    _or: [
      {
        _or: [{ protocol: { _is_null: true } }, { protocol: { _neq: "${OCPPVersion.OCPP2_1}" } }]
        Connectors: {
          LatestStatusNotification: { connectorStatus: { _eq: "${ConnectorStatusEnum.Faulted}" } }
        }
      }
      {
        protocol: { _eq: "${OCPPVersion.OCPP2_1}" }
        Connectors: { status: { _eq: "${ConnectorStatusEnum.Faulted}" } }
      }
    ]
  }
`;

export const CHARGING_STATIONS_LIST_QUERY = gql`
  query ChargingStationsList(
    $offset: Int
    $limit: Int
    $order_by: [ChargingStations_order_by!]
    $where: ChargingStations_bool_exp
  ) {
    ChargingStations(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${CHARGING_STATION_CORE_FIELDS}
      ${CHARGING_STATION_DETAIL_FIELDS}
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      evses: Evses {
        ${EVSE_CORE_FIELDS.omit('createdAt', 'updatedAt')}
        ${EVSE_DETAIL_FIELDS.pick('physicalReference')}
        connectors: Connectors {
          id
          status
          latestStatusNotification: LatestStatusNotification {
            ${STATUS_NOTIFICATION_FIELDS}
          }
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
          ${FAULTED_CHARGING_STATION_FILTER}
          $where
        ]
      }
    ) {
      ${CHARGING_STATION_CORE_FIELDS}
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
    }
    ChargingStations_aggregate(
      where: {
        _and: [
          ${FAULTED_CHARGING_STATION_FILTER}
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
      ${CHARGING_STATION_DETAIL_FIELDS}
      coordinates
      use16StatusNotification0
      latestOcppMessageTimestamp
      connectedWebsocketServerConfigId
      ocppMessages: OCPPMessages(limit: 1) {
        id
      }
      ConnectedServerNetworkProfile {
        ${SERVER_NETWORK_PROFILE_BASIC_FIELDS.omit('pingInterval', 'messageTimeout')}
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
        connectors: Connectors {
          ${CONNECTOR_FULL_FIELDS}
          status
          latestStatusNotification: LatestStatusNotification {
            ${STATUS_NOTIFICATION_FIELDS}
          }
        }
      }
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        ${ACTIVE_TRANSACTION_FIELDS}
        stationId
      }
      connectors: Connectors {
        id
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
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        ${ACTIVE_TRANSACTION_FIELDS}
      }
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      evses: Evses {
        ${EVSE_CORE_FIELDS.omit('evseId')}
        connectors: Connectors {
          id
          status
          latestStatusNotification: LatestStatusNotification {
            ${STATUS_NOTIFICATION_FIELDS}
          }
        }
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
      ${CHARGING_STATION_DETAIL_FIELDS.pick('floorLevel', 'parkingRestrictions', 'capabilities')}
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
