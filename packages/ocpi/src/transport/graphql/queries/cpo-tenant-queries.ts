// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// import { gql } from 'graphql-request';

// export const GET_CPO_TENANT_BY_SERVER_COUNTRY_AND_PARTY_ID = gql`
//   query GetCpoTenantByServer($countryCode: String!, $partyId: String!) {
//     Tenants(
//       where: {
//         countryCode: { _eq: $countryCode }
//         partyId: { _eq: $partyId }
//       }
//     ) {
//       id
//     }
//   }
// `;

// export const GET_TENANT_BY_ID = gql`
//   query GetTenantById($id: Int!) {
//     Tenants_by_pk(id: $id) {
//       id
//       countryCode
//       partyId
//       TenantPartners {
//         id
//         countryCode
//         partyId
//         partnerProfile
//         Tenant {
//           id
//           serverCredential
//           serverVersions
//         }
//       }
//     }
//   }
// `;

// export const DELETE_CPO_TENANT_BY_ID = gql`
//   mutation DeleteCpoTenant($id: Int!) {
//     delete_Tenants(where: { id: { _eq: $id } }) {
//       affected_rows
//     }
//   }
// `;
