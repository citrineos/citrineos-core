// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-request';

export const GET_TENANT_BY_ID = gql`
  query GetTenantById($id: Int!) {
    Tenants(where: { id: { _eq: $id } }) {
      serverProfileOCPI
      countryCode
      partyId
    }
  }
`;
