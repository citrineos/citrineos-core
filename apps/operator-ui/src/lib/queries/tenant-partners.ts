// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import gql from 'graphql-tag';
import { PARTNER_FIELDS } from '@lib/queries/fields/partner-fields';

export const PARTNERS_LIST_QUERY = gql`
  query TenantPartners(
    $limit: Int
    $offset: Int
    $order_by: [TenantPartners_order_by!]
    $where: TenantPartners_bool_exp
  ) {
    TenantPartners(limit: $limit, offset: $offset, order_by: $order_by, where: $where) {
      ${PARTNER_FIELDS}
    }
    TenantPartners_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const PARTNER_DETAIL_QUERY = gql`
  query TenantPartner($id: Int!) {
    TenantPartners_by_pk(id: $id) {
      ${PARTNER_FIELDS}
    }
  }
`;

export const PARTNER_CREATE_MUTATION = gql`
  mutation CreatePartner($object: TenantPartners_insert_input!) {
    insert_TenantPartners_one(object: $object) {
      id
    }
  }
`;

export const PARTNER_UPDATE_MUTATION = gql`
  mutation UpdatePartner($id: Int!, $object: TenantPartners_set_input!) {
    update_TenantPartners_by_pk(pk_columns: { id: $id }, _set: $object) {
      id
    }
  }
`;
