// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-request';

// export const CREATE_TENANT = gql`
//   mutation CreateTenant($object: Tenants_insert_input!) {
//     insert_Tenants_one(object: $object) {
//       id
//     }
//   }
// `;

// export const UPDATE_TENANT = gql`
//   mutation UpdateTenant($id: Int!, $input: Tenants_set_input!) {
//     update_Tenants_by_pk(pk_columns: { id: $id }, _set: $input) {
//       id
//     }
//   }
// `;

// export const CREATE_TENANT_PARTNER = gql`
//   mutation CreateTenantPartner($object: TenantPartners_insert_input!) {
//     insert_TenantPartners_one(object: $object) {
//       id
//     }
//   }
// `;

export const UPDATE_TENANT_PARTNER_PROFILE = gql`
  mutation UpdateTenantPartnerProfile($partnerId: Int!, $input: jsonb!) {
    update_TenantPartners(
      where: { id: { _eq: $partnerId } }
      _set: { partnerProfileOCPI: $input }
    ) {
      affected_rows
    }
  }
`;

export const DELETE_TENANT_PARTNER_BY_ID = gql`
  mutation DeleteTenantPartnerById($id: Int!) {
    delete_TenantPartners(where: { id: { _eq: $id } }) {
      affected_rows
    }
  }
`;
