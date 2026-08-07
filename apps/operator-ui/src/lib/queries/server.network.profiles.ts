// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { SERVER_NETWORK_PROFILE_FULL_FIELDS } from '@lib/queries/fields/server.network.profile.fields';

export const SERVER_NETWORK_PROFILE_LIST_QUERY = gql`
  query ServerNetworkProfileList(
    $offset: Int!
    $limit: Int!
    $order_by: [ServerNetworkProfiles_order_by!]
    $where: ServerNetworkProfiles_bool_exp
  ) {
    ServerNetworkProfiles(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${SERVER_NETWORK_PROFILE_FULL_FIELDS}
    }
    ServerNetworkProfiles_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const SERVER_NETWORK_PROFILE_GET_QUERY = gql`
  query GetServerNetworkProfileById($id: String!) {
    ServerNetworkProfiles_by_pk(id: $id) {
      ${SERVER_NETWORK_PROFILE_FULL_FIELDS}
    }
  }
`;
