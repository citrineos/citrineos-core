// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { NETWORK_ALERT_OCCURRENCE_FIELDS } from '@lib/queries/fields/network-alert-occurrence-fields';

export const NETWORK_ALERT_OCCURRENCES_LIST_QUERY = gql`
  query NetworkAlertOccurrencesList(
    $offset: Int!
    $limit: Int!
    $order_by: [NetworkAlertOccurrences_order_by!]
    $where: NetworkAlertOccurrences_bool_exp
  ) {
    NetworkAlertOccurrences(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${NETWORK_ALERT_OCCURRENCE_FIELDS}
    }
    NetworkAlertOccurrences_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;
