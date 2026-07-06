// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-request';

export const READ_AUTHORIZATION = gql`
  query ReadAuthorizations(
    $idToken: citext
    $type: String
    $countryCode: String
    $partyId: String
  ) {
    Authorizations(
      where: {
        idToken: { _eq: $idToken }
        idTokenType: { _eq: $type }
        TenantPartner: { countryCode: { _eq: $countryCode }, partyId: { _eq: $partyId } }
      }
    ) {
      id
      createdAt
      updatedAt
      tenantId
      tenantPartner: TenantPartner {
        id
        countryCode
        partyId
      }
      groupAuthorization: GroupAuthorization {
        idToken
      }
      idToken
      idTokenType
      additionalInfo
      status
      realTimeAuth
      language1
      groupAuthorizationId
    }
  }
`;

export const UPDATE_TOKEN_MUTATION = gql`
  mutation UpdateAuthorization(
    $idToken: citext!
    $type: String!
    $tenantPartnerId: Int!
    $set: Authorizations_set_input
  ) {
    update_Authorizations(
      where: {
        idToken: { _eq: $idToken }
        idTokenType: { _eq: $type }
        tenantPartnerId: { _eq: $tenantPartnerId }
      }
      _set: $set
    ) {
      returning {
        id
        createdAt
        updatedAt
        tenantId
        tenantPartner: TenantPartner {
          id
          countryCode
          partyId
        }
        groupAuthorization: GroupAuthorization {
          idToken
        }
        idToken
        idTokenType
        additionalInfo
        status
        realTimeAuth
        language1
        groupAuthorizationId
      }
    }
  }
`;

export const GET_AUTHORIZATION_BY_TOKEN = gql`
  query GetAuthorizationByToken($idToken: citext!, $idTokenType: String!, $tenantPartnerId: Int!) {
    Authorizations(
      where: {
        idToken: { _eq: $idToken }
        idTokenType: { _eq: $idTokenType }
        tenantPartnerId: { _eq: $tenantPartnerId }
      }
    ) {
      id
      idToken
      idTokenType
      tenantId
      tenantPartner: TenantPartner {
        id
        countryCode
        partyId
      }
      groupAuthorization: GroupAuthorization {
        idToken
      }
      additionalInfo
      groupAuthorizationId
      status
      realTimeAuth
      language1
      createdAt
      updatedAt
    }
  }
`;

export const GET_AUTHORIZATION_BY_ID = gql`
  query GetAuthorizationById($id: Int!) {
    Authorizations_by_pk(id: $id) {
      id
      idToken
      idTokenType
      tenantId
      tenantPartner: TenantPartner {
        id
        countryCode
        partyId
      }
      groupAuthorization: GroupAuthorization {
        idToken
      }
      additionalInfo
      groupAuthorizationId
      status
      realTimeAuth
      language1
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_AUTHORIZATION_MUTATION = gql`
  mutation CreateAuthorization(
    $tenantId: Int!
    $tenantPartnerId: Int!
    $idToken: citext!
    $idTokenType: String!
    $additionalInfo: jsonb
    $status: String!
    $language1: String
    $groupAuthorizationId: Int
    $realTimeAuth: String
    $createdAt: timestamptz!
    $updatedAt: timestamptz!
  ) {
    insert_Authorizations_one(
      object: {
        tenantId: $tenantId
        tenantPartnerId: $tenantPartnerId
        idToken: $idToken
        idTokenType: $idTokenType
        additionalInfo: $additionalInfo
        status: $status
        language1: $language1
        groupAuthorizationId: $groupAuthorizationId
        realTimeAuth: $realTimeAuth
        createdAt: $createdAt
        updatedAt: $updatedAt
      }
    ) {
      id
      createdAt
      updatedAt
      tenantId
      tenantPartner: TenantPartner {
        id
        countryCode
        partyId
      }
      groupAuthorization: GroupAuthorization {
        idToken
      }
      idToken
      idTokenType
      additionalInfo
      status
      realTimeAuth
      language1
      groupAuthorizationId
    }
  }
`;

export const GET_GROUP_AUTHORIZATION = gql`
  query GetGroupAuthorization($groupId: String!, $tenantPartnerId: Int!) {
    Authorizations(
      where: {
        idToken: { _eq: $groupId }
        idTokenType: { _eq: "Central" }
        tenantPartnerId: { _eq: $tenantPartnerId }
      }
    ) {
      id
      idToken
      idTokenType
    }
  }
`;
