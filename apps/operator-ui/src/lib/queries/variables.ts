// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { VARIABLE_FIELDS } from '@lib/queries/fields/variable-fields';

export const VARIABLE_LIST_QUERY = gql`
  query VariableList(
    $offset: Int!
    $limit: Int!
    $order_by: [Variables_order_by!]
    $where: Variables_bool_exp
  ) {
    Variables(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${VARIABLE_FIELDS}
    }
    Variables_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const VARIABLE_LIST_BY_COMPONENT_QUERY = gql`
  query VariableListByComponent(
    $componentId: Int!
    $offset: Int!
    $limit: Int!
    $mutability: String!
    $order_by: [Variables_order_by!]
    $where: Variables_bool_exp = {}
  ) {
    Variables(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: {
        _and: [
          { ComponentVariables: { componentId: { _eq: $componentId } } }
          $where
          { VariableAttributes: { mutability: { _neq: $mutability } } }
        ]
      }
    ) {
      ${VARIABLE_FIELDS}
    }
    Variables_aggregate(
      where: { _and: [{ ComponentVariables: { componentId: { _eq: $componentId } } }, $where] }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const VARIABLE_GET_QUERY = gql`
  query GetVariableById($id: Int!) {
    Variables_by_pk(id: $id) {
      ${VARIABLE_FIELDS}
    }
  }
`;
