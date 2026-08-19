// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { LOCATION_CORE_FIELDS, LOCATION_DETAIL_FIELDS } from '@lib/queries/fields/location.fields';
import { CONNECTOR_STATUS_FIELDS } from '@lib/queries/fields/connector.fields';
import { STATUS_NOTIFICATION_FIELDS } from '@lib/queries/fields/status.notification.fields';
import { ACTIVE_TRANSACTION_FIELDS } from '@lib/queries/fields/transaction.fields';
import { EVSE_CORE_FIELDS } from '@lib/queries/fields/evse.fields';
import {
  CHARGING_STATION_CORE_FIELDS,
  CHARGING_STATION_DETAIL_FIELDS,
} from '@lib/queries/fields/charging.station.fields';

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
      ${LOCATION_DETAIL_FIELDS}
      chargingPool: ChargingStations(where: $chargingStationsWhere) {
        ${CHARGING_STATION_CORE_FIELDS.omit('locationId')}
        evses: Evses {
          ${EVSE_CORE_FIELDS}
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
        transactions: Transactions(where: { isActive: { _eq: true } }) {
          ${ACTIVE_TRANSACTION_FIELDS}
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
        ${CHARGING_STATION_CORE_FIELDS.omit('locationId')}
        ${CHARGING_STATION_DETAIL_FIELDS}
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
            ${STATUS_NOTIFICATION_FIELDS}
          }
        }
        Transactions(where: { isActive: { _eq: true } }) {
          ${ACTIVE_TRANSACTION_FIELDS}
        }
      }
    }
  }
`;

export const LOCATIONS_CREATE_MUTATION = gql`
  mutation LocationsCreate($object: Locations_insert_input!) {
    insert_Locations_one(object: $object) {
      ${LOCATION_CORE_FIELDS}
      ${LOCATION_DETAIL_FIELDS.omit('openingHours')}
    }
  }
`;

export const LOCATIONS_DELETE_MUTATION = gql`
  mutation LocationsDelete($id: Int!) {
    delete_Locations_by_pk(id: $id) {
      ${LOCATION_CORE_FIELDS}
      ${LOCATION_DETAIL_FIELDS.omit('openingHours')}
    }
  }
`;

export const LOCATIONS_EDIT_MUTATION = gql`
  mutation LocationsEdit($id: Int!, $object: Locations_set_input!) {
    update_Locations_by_pk(pk_columns: { id: $id }, _set: $object) {
      ${LOCATION_CORE_FIELDS}
      ${LOCATION_DETAIL_FIELDS.omit('openingHours')}
    }
  }
`;
