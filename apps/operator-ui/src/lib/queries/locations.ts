// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { LOCATION_CORE_FIELDS, LOCATION_DETAIL_FIELDS } from '@lib/queries/fields/location.fields';
import { CONNECTOR_STATUS_FIELDS } from '@lib/queries/fields/connector.fields';

export const LOCATIONS_LIST_QUERY = gql`
  query LocationsList(
    $offset: Int!
    $limit: Int!
    $order_by: [Locations_order_by!]
    $where: Locations_bool_exp
    $chargingStationsWhere: ChargingStations_bool_exp
  ) {
    Locations(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${LOCATION_CORE_FIELDS}
      timeZone
      parkingType
      chargingPool: ChargingStations(where: $chargingStationsWhere) {
        id
        ocppConnectionName
        isOnline
        protocol
        createdAt
        updatedAt
        evses: Evses {
          id
          evseTypeId
          evseId
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
        connectors: Connectors {
          connectorId
          ${CONNECTOR_STATUS_FIELDS}
          createdAt
          updatedAt
        }
      }
    }
    Locations_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const LOCATIONS_GET_QUERY = gql`
  query GetLocationById($id: Int!) {
    Locations_by_pk(id: $id) {
      ${LOCATION_CORE_FIELDS}
      ${LOCATION_DETAIL_FIELDS}
      chargingPool: ChargingStations {
        id
        ocppConnectionName
        isOnline
        protocol
        createdAt
        updatedAt
        Evses: VariableAttributes(
          distinct_on: evseDatabaseId
          where: { evseDatabaseId: { _is_null: false } }
        ) {
          id
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
        Transactions(where: { isActive: { _eq: true } }) {
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
      }
    }
  }
`;

export const LOCATIONS_CREATE_MUTATION = gql`
  mutation LocationsCreate($object: Locations_insert_input!) {
    insert_Locations_one(object: $object) {
      ${LOCATION_CORE_FIELDS}
      facilities
      timeZone
      parkingType
    }
  }
`;

export const LOCATIONS_DELETE_MUTATION = gql`
  mutation LocationsDelete($id: Int!) {
    delete_Locations_by_pk(id: $id) {
      ${LOCATION_CORE_FIELDS}
      facilities
      timeZone
      parkingType
    }
  }
`;

export const LOCATIONS_EDIT_MUTATION = gql`
  mutation LocationsEdit($id: Int!, $object: Locations_set_input!) {
    update_Locations_by_pk(pk_columns: { id: $id }, _set: $object) {
      ${LOCATION_CORE_FIELDS}
      facilities
      timeZone
      parkingType
    }
  }
`;
