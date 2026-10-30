// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { AUTHORIZATION_ATTEMPT_FIELDS } from '@lib/queries/fields/authorization-attempt-fields';

const AUTHORIZATION_ATTEMPT_RELATIONS = `
  station: ChargingStation {
    id
    ocppConnectionName
  }
  authorization: Authorization {
    id
    idToken
    idTokenType
  }
`;

export const AUTHORIZATION_ATTEMPTS_LIST_QUERY = gql`
  query AuthorizationAttemptsList(
    $offset: Int!
    $limit: Int!
    $order_by: [AuthorizationAttempts_order_by!]
    $where: AuthorizationAttempts_bool_exp
  ) {
    AuthorizationAttempts(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${AUTHORIZATION_ATTEMPT_FIELDS}
      ${AUTHORIZATION_ATTEMPT_RELATIONS}
    }
    AuthorizationAttempts_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_AUTHORIZATION_ATTEMPTS_FOR_AUTHORIZATION = gql`
  query AuthorizationAttemptsForAuthorization(
    $id: Int!
    $offset: Int!
    $limit: Int!
    $order_by: [AuthorizationAttempts_order_by!]
    $where: AuthorizationAttempts_bool_exp = {}
  ) {
    AuthorizationAttempts(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: { _and: [{ authorizationId: { _eq: $id } }, $where] }
    ) {
      ${AUTHORIZATION_ATTEMPT_FIELDS}
      ${AUTHORIZATION_ATTEMPT_RELATIONS}
    }
    AuthorizationAttempts_aggregate(where: { _and: [{ authorizationId: { _eq: $id } }, $where] }) {
      aggregate {
        count
      }
    }
  }
`;
