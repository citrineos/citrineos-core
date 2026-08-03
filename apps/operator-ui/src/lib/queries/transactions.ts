// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { LOCATION_CORE_FIELDS } from '@lib/queries/fields/location.fields';

export const TRANSACTION_LIST_QUERY = gql`
  query TransactionList(
    $offset: Int!
    $limit: Int!
    $order_by: [Transactions_order_by!]
    $where: Transactions_bool_exp
  ) {
    Transactions(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
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
      startTime
      endTime
      createdAt
      updatedAt
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      evse: Evse {
        id
        createdAt
        updatedAt
      }
      connector: Connector {
        id
        connectorId
        type
        createdAt
        updatedAt
      }
      authorization: Authorization {
        id
        idToken
        idTokenType
        status
        groupAuthorizationId
        additionalInfo
        concurrentTransaction
        chargingPriority
        language1
        language2
        personalMessage
        cacheExpiryDateTime
        createdAt
        updatedAt
      }
      chargingStation: ChargingStation {
        id
        ocppConnectionName
        isOnline
        protocol
        locationId
        createdAt
        updatedAt
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
      startTime
      endTime
      createdAt
      updatedAt
      chargingStation: ChargingStation {
        id
        ocppConnectionName
        isOnline
        protocol
        locationId
        createdAt
        updatedAt
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
      id
      timeSpentCharging
      isActive
      chargingState
      ocppConnectionName
      stationId
      stoppedReason
      transactionId
      evseId
      remoteStartId
      totalKwh
      startTime
      endTime
      createdAt
      updatedAt
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
        id
        isOnline
        locationId
        createdAt
        updatedAt
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
      id
      timeSpentCharging
      isActive
      chargingState
      stationId
      locationId
      ocppConnectionName
      stoppedReason
      transactionId
      evseId
      remoteStartId
      authorizationId
      totalKwh
      startTime
      endTime
      createdAt
      updatedAt
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      evse: Evse {
        id
        evseTypeId
        evseId
        createdAt
        updatedAt
      }
      connector: Connector {
        id
        connectorId
        type
        createdAt
        updatedAt
        tariff: Tariff {
          id
          currency
          pricePerKwh
        }
      }
      authorization: Authorization {
        id
        idToken
        idTokenType
        status
        groupAuthorizationId
        additionalInfo
        concurrentTransaction
        chargingPriority
        language1
        language2
        personalMessage
        cacheExpiryDateTime
        createdAt
        updatedAt
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
