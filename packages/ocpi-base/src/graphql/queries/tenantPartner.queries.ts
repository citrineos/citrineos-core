// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-request';

export const GET_TENANT_PARTNER_BY_SERVER_TOKEN = gql`
  query GetTenantPartnerByServerToken($serverToken: String!) {
    TenantPartners(
      where: { partnerProfileOCPI: { _contains: { serverCredentials: { token: $serverToken } } } }
    ) {
      id
      countryCode
      partyId
      partnerProfileOCPI
      tenantId
      tenant: Tenant {
        id
        countryCode
        partyId
        serverProfileOCPI
      }
    }
  }
`;

export const GET_TENANT_PARTNER_BY_ID = gql`
  query GetTenantPartnerById($id: Int!) {
    TenantPartners_by_pk(id: $id) {
      id
      countryCode
      partyId
      partnerProfileOCPI
      tenantId
      tenant: Tenant {
        id
        countryCode
        partyId
        serverProfileOCPI
      }
    }
  }
`;

export const DELETE_TENANT_PARTNER_BY_SERVER_TOKEN = gql`
  mutation DeleteTenantPartnerByServerToken($serverToken: String!) {
    delete_TenantPartners(
      where: { partnerProfileOCPI: { _contains: { serverCredentials: { token: $serverToken } } } }
    ) {
      affected_rows
    }
  }
`;

export const GET_TENANT_PARTNER_BY_CPO_AND_AND_CLIENT = gql`
  query GetTenantPartnerByCpoClientAndModuleId(
    $cpoCountryCode: String!
    $cpoPartyId: String!
    $clientCountryCode: String
    $clientPartyId: String
  ) {
    TenantPartners(
      where: {
        Tenant: { countryCode: { _eq: $cpoCountryCode }, partyId: { _eq: $cpoPartyId } }
        countryCode: { _eq: $clientCountryCode }
        partyId: { _eq: $clientPartyId }
      }
    ) {
      id
      countryCode
      partyId
      partnerProfileOCPI
      tenantId
      tenant: Tenant {
        id
        countryCode
        partyId
        serverProfileOCPI
      }
    }
  }
`;

export const LIST_TENANT_PARTNERS_BY_CPO = gql`
  query TenantPartnersList(
    $cpoCountryCode: String!
    $cpoPartyId: String!
    $endpointIdentifier: String!
  ) {
    TenantPartners(
      where: {
        Tenant: { countryCode: { _eq: $cpoCountryCode }, partyId: { _eq: $cpoPartyId } }
        partnerProfileOCPI: { _contains: { endpoints: [{ identifier: $endpointIdentifier }] } }
      }
    ) {
      id
      countryCode
      partyId
      partnerProfileOCPI
      tenantId
      tenant: Tenant {
        id
        countryCode
        partyId
        serverProfileOCPI
      }
    }
  }
`;
