// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { LOCATION_CORE_FIELDS } from '@lib/queries/fields/location.fields';
import { AUTHORIZATION_FIELDS } from '@lib/queries/fields/authorization.fields';
import { CHARGING_STATION_CORE_FIELDS } from '@lib/queries/fields/charging.station.fields';
import { EVSE_CORE_FIELDS } from '@lib/queries/fields/evse.fields';
import { TRANSACTION_DETAIL_FIELDS } from '@lib/queries/fields/transaction.fields';
import { CONNECTOR_CORE_FIELDS } from '@lib/queries/fields/connector.fields';
import { TARIFF_FIELDS } from '@lib/queries/fields/tariff.fields';

export const TRANSACTION_LIST_QUERY = gql`
  query TransactionList(
    $offset: Int!
    $limit: Int!
    $order_by: [Transactions_order_by!]
    $where: Transactions_bool_exp
  ) {
    Transactions(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${TRANSACTION_DETAIL_FIELDS}
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      evse: Evse {
        ${EVSE_CORE_FIELDS.omit('evseTypeId', 'evseId')}
      }
      connector: Connector {
        ${CONNECTOR_CORE_FIELDS}
      }
      authorization: Authorization {
        ${AUTHORIZATION_FIELDS.omit('allowedConnectorTypes', 'disallowedEvseIdPrefixes', 'realTimeAuth', 'realTimeAuthUrl')}
      }
      chargingStation: ChargingStation {
        ${CHARGING_STATION_CORE_FIELDS}
        location: Location {
          ${LOCATION_CORE_FIELDS}
        }
      }
    }
    Transactions_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_TRANSACTIONS_FOR_AUTHORIZATION = gql`
  query TransactionsList(
    $id: Int!
    $limit: Int!
    $offset: Int!
    $order_by: [Transactions_order_by!]
    $where: Transactions_bool_exp = {}
  ) {
    Transactions(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: { _and: [{ authorizationId: { _eq: $id } }, $where] }
    ) {
      ${TRANSACTION_DETAIL_FIELDS}
      chargingStation: ChargingStation {
        ${CHARGING_STATION_CORE_FIELDS}
        location: Location {
          ${LOCATION_CORE_FIELDS}
        }
      }
      TransactionEvents(where: { eventType: { _eq: "Started" } }) {
        eventType
        idTokenValue
        idTokenType
      }
      StartTransaction {
        idTokenDatabaseId
      }
    }
    Transactions_aggregate(where: { _and: [{ authorizationId: { _eq: $id } }, $where] }) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_TRANSACTION_LIST_FOR_STATION = gql`
  query GetTransactionListForStation(
    $stationId: Int!
    $where: [Transactions_bool_exp!] = []
    $order_by: [Transactions_order_by!] = {}
    $offset: Int
    $limit: Int
  ) {
    Transactions(
      where: { stationId: { _eq: $stationId }, _and: $where }
      order_by: $order_by
      offset: $offset
      limit: $limit
    ) {
      ${TRANSACTION_DETAIL_FIELDS}
      stationId
      TransactionEvents(where: { eventType: { _eq: "Started" } }) {
        eventType
        idTokenValue
        idTokenType
      }
      StartTransaction {
        idTokenDatabaseId
      }
      authorization: Authorization {
        id
        idToken
      }
      chargingStation: ChargingStation {
        ${CHARGING_STATION_CORE_FIELDS.omit('ocppConnectionName', 'protocol')}
        location: Location {
          ${LOCATION_CORE_FIELDS}
        }
      }
    }
    Transactions_aggregate(where: { stationId: { _eq: $stationId }, _and: $where }) {
      aggregate {
        count
      }
    }
  }
`;

// TODO when possible, include the total time as well
export const TRANSACTION_SUCCESS_RATE_QUERY = gql`
  query TransactionsSuccessRate {
    success: Transactions_aggregate(where: { totalKwh: { _gt: 0 } }) {
      aggregate {
        count
      }
    }
    total: Transactions_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export const TRANSACTION_GET_QUERY = gql`
  query GetTransactionById($id: Int!) {
    Transactions_by_pk(id: $id) {
      ${TRANSACTION_DETAIL_FIELDS}
      stationId
      locationId
      authorizationId
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      evse: Evse {
        ${EVSE_CORE_FIELDS}
      }
      connector: Connector {
        ${CONNECTOR_CORE_FIELDS}
        tariff: Tariff {
          ${TARIFF_FIELDS.pick('id', 'currency', 'pricePerKwh')}
        }
      }
      authorization: Authorization {
        ${AUTHORIZATION_FIELDS.omit('allowedConnectorTypes', 'disallowedEvseIdPrefixes', 'realTimeAuth', 'realTimeAuthUrl')}
      }
    }
  }
`;

export const TRANSACTION_EDIT_MUTATION = gql`
  mutation TransactionEdit($id: Int!, $object: Transactions_set_input!) {
    update_Transactions_by_pk(pk_columns: { id: $id }, _set: $object) {
      id
      isActive
      updatedAt
    }
  }
`;
