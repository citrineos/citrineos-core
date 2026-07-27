// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';

export const VARIABLE_ATTRIBUTE_LIST_QUERY = gql`
  query VariableAttributeList(
    $offset: Int!
    $limit: Int!
    $order_by: [VariableAttributes_order_by!]
    $where: VariableAttributes_bool_exp
  ) {
    VariableAttributes(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      id
      ocppConnectionName
      type
      dataType
      value
      mutability
      persistent
      constant
      variableId
      componentId
      evseDatabaseId
      createdAt
      updatedAt
      Variable {
        id
        instance
        name
        createdAt
        updatedAt
      }
      Component {
        id
        instance
        name
        evseDatabaseId
        createdAt
        updatedAt
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
    VariableAttributes(
      where: { stationId: { _eq: $stationId } }
      order_by: { createdAt: desc }
    ) {
      id
      ocppConnectionName
      type
      dataType
      value
      mutability
      persistent
      constant
      variableId
      componentId
      evseDatabaseId
      createdAt
      updatedAt
      Variable {
        id
        instance
        name
        createdAt
        updatedAt
      }
      Component {
        id
        instance
        name
        evseDatabaseId
        createdAt
        updatedAt
      }
    }
    VariableAttributes_aggregate(where: { stationId: { _eq: $stationId } }) {
      aggregate {
        count
      }
    }
  }
`;
