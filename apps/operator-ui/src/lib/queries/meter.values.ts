// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { METER_VALUE_FIELDS } from '@lib/queries/fields/meter.value.fields';

export const METER_VALUE_LIST_QUERY = gql`
  query MeterValueList(
    $offset: Int!
    $limit: Int!
    $order_by: [MeterValues_order_by!]
    $where: MeterValues_bool_exp! = {}
  ) {
    MeterValues(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${METER_VALUE_FIELDS}
    }
    MeterValues_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_METER_VALUES_FOR_STATION = gql`
  query GetMeterValuesForStation(
    $transactionDatabaseIds: [Int!]!
    $where: MeterValues_bool_exp! = {}
    $order_by: [MeterValues_order_by!] = { timestamp: asc }
    $offset: Int
    $limit: Int
  ) {
    MeterValues(
      where: { _and: [{ transactionDatabaseId: { _in: $transactionDatabaseIds } }, $where] }
      order_by: $order_by
      offset: $offset
      limit: $limit
    ) {
      ${METER_VALUE_FIELDS.omit('transactionEventId', 'createdAt', 'updatedAt')}
    }
    MeterValues_aggregate(
      where: { _and: [{ transactionDatabaseId: { _in: $transactionDatabaseIds } }, $where] }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_METER_VALUES_FOR_TRANSACTION = gql`
  query MeterValueForTransactionList(
    $transactionDatabaseId: Int!
    $offset: Int!
    $limit: Int!
    $order_by: [MeterValues_order_by!]
    $where: MeterValues_bool_exp! = {}
  ) {
    MeterValues(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: { transactionDatabaseId: { _eq: $transactionDatabaseId }, _and: [$where] }
    ) {
      ${METER_VALUE_FIELDS}
    }
    MeterValues_aggregate(
      where: { transactionDatabaseId: { _eq: $transactionDatabaseId }, _and: [$where] }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_METER_VALUES_FOR_TRANSACTION_EVENT = gql`
  query MeterValueForTransactionEventList(
    $transactionEventId: Int!
    $offset: Int!
    $limit: Int!
    $order_by: [MeterValues_order_by!]
    $where: MeterValues_bool_exp! = {}
  ) {
    MeterValues(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: { transactionEventId: { _eq: $transactionEventId }, _and: [$where] }
    ) {
      ${METER_VALUE_FIELDS}
    }
    MeterValues_aggregate(
      where: { transactionEventId: { _eq: $transactionEventId }, _and: [$where] }
    ) {
      aggregate {
        count
      }
    }
  }
`;
