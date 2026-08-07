// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { VARIABLE_ATTRIBUTE_FIELDS } from '@lib/queries/fields/variable.attribute.fields';
import { VARIABLE_FIELDS } from '@lib/queries/fields/variable.fields';
import { COMPONENT_FIELDS } from '@lib/queries/fields/component.fields';

export const VARIABLE_ATTRIBUTE_LIST_QUERY = gql`
  query VariableAttributeList(
    $offset: Int!
    $limit: Int!
    $order_by: [VariableAttributes_order_by!]
    $where: VariableAttributes_bool_exp
  ) {
    VariableAttributes(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${VARIABLE_ATTRIBUTE_FIELDS}
      Variable {
        ${VARIABLE_FIELDS}
      }
      Component {
        ${COMPONENT_FIELDS}
      }
    }
    VariableAttributes_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const VARIABLE_ATTRIBUTE_DOWNLOAD_QUERY = gql`
  query DownloadVariableAttributes($stationId: Int!) {
    VariableAttributes(where: { stationId: { _eq: $stationId } }, order_by: { createdAt: desc }) {
      ${VARIABLE_ATTRIBUTE_FIELDS}
      Variable {
        ${VARIABLE_FIELDS}
      }
      Component {
        ${COMPONENT_FIELDS}
      }
    }
    VariableAttributes_aggregate(where: { stationId: { _eq: $stationId } }) {
      aggregate {
        count
      }
    }
  }
`;
