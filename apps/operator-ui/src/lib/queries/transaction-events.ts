// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { TRANSACTION_EVENT_FIELDS } from '@lib/queries/fields/transaction-event-fields';
import { METER_VALUE_FIELDS } from '@lib/queries/fields/meter-value-fields';

export const TRANSACTION_EVENT_LIST_QUERY = gql`
  query TransactionEventList(
    $offset: Int!
    $limit: Int!
    $order_by: [TransactionEvents_order_by!]
    $where: TransactionEvents_bool_exp
  ) {
    TransactionEvents(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${TRANSACTION_EVENT_FIELDS}
      MeterValues {
        ${METER_VALUE_FIELDS}
      }
    }
    TransactionEvents_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_TRANSACTION_EVENTS_FOR_TRANSACTION_LIST_QUERY = gql`
  query TransactionEventForTransactionList(
    $transactionDatabaseId: Int!
    $offset: Int!
    $limit: Int!
    $order_by: [TransactionEvents_order_by!]
    $where: TransactionEvents_bool_exp! = {}
  ) {
    TransactionEvents(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: { transactionDatabaseId: { _eq: $transactionDatabaseId }, _and: [$where] }
    ) {
      ${TRANSACTION_EVENT_FIELDS}
    }
    TransactionEvents_aggregate(
      where: { transactionDatabaseId: { _eq: $transactionDatabaseId }, _and: [$where] }
    ) {
      aggregate {
        count
      }
    }
  }
`;
