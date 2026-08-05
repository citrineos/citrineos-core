// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { CHANGE_CONFIGURATION_FIELDS } from '@lib/queries/fields/change.configuration.fields';

export const CHANGE_CONFIGURATION_LIST_QUERY = gql`
  query ChangeConfigurationList(
    $offset: Int!
    $limit: Int!
    $order_by: [ChangeConfigurations_order_by!]
    $where: ChangeConfigurations_bool_exp
  ) {
    ChangeConfigurations(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${CHANGE_CONFIGURATION_FIELDS}
      readonly
    }
    ChangeConfigurations_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const CHANGE_CONFIGURATION_DOWNLOAD_QUERY = gql`
  query DownloadChangeConfigurations($ocppConnectionName: String!) {
    ChangeConfigurations(
      where: { ocppConnectionName: { _eq: $ocppConnectionName } }
      order_by: { key: asc }
    ) {
      ${CHANGE_CONFIGURATION_FIELDS}
    }
    ChangeConfigurations_aggregate(where: { ocppConnectionName: { _eq: $ocppConnectionName } }) {
      aggregate {
        count
      }
    }
  }
`;
