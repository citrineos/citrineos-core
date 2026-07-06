// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-request';

export const GET_TARIFF_BY_KEY_QUERY = gql`
  query GetTariffByKey($id: Int!, $countryCode: String!, $partyId: String!) {
    Tariffs(
      where: {
        id: { _eq: $id }
        Tenant: { countryCode: { _eq: $countryCode }, partyId: { _eq: $partyId } }
      }
    ) {
      authorizationAmount
      createdAt
      currency
      id
      paymentFee
      pricePerKwh
      pricePerMin
      pricePerSession
      taxRate
      tariffAltText
      updatedAt
      tenant: Tenant {
        countryCode
        partyId
      }
    }
  }
`;

export const GET_TARIFFS_QUERY = gql`
  query GetTariffs($limit: Int, $offset: Int, $where: Tariffs_bool_exp!) {
    Tariffs(limit: $limit, offset: $offset, order_by: { createdAt: asc }, where: $where) {
      authorizationAmount
      createdAt
      currency
      id
      paymentFee
      pricePerKwh
      pricePerMin
      pricePerSession
      taxRate
      tariffAltText
      updatedAt
      tenant: Tenant {
        countryCode
        partyId
      }
    }
  }
`;

// export const CREATE_OR_UPDATE_TARIFF_MUTATION = gql`
//   mutation CreateOrUpdateTariff($object: Tariffs_insert_input!) {
//     insert_Tariffs_one(
//       object: $object
//       on_conflict: {
//         constraint: Tariffs_pkey
//         update_columns: [
//           authorizationAmount
//           createdAt
//           currency
//           paymentFee
//           pricePerKwh
//           pricePerMin
//           pricePerSession
//           stationId
//           taxRate
//           updatedAt
//         ]
//       }
//     ) {
//       id
//       authorizationAmount
//       createdAt
//       currency
//       paymentFee
//       pricePerKwh
//       pricePerMin
//       pricePerSession
//       stationId
//       taxRate
//       updatedAt
//       Tenant {
//         countryCode
//         partyId
//       }
//     }
//   }
// `;

// export const DELETE_TARIFF_MUTATION = gql`
//   mutation DeleteTariff($id: Int!) {
//     delete_Tariffs_by_pk(id: $id) {
//       id
//     }
//   }
// `;

// export const GET_TARIFF_BY_ID_QUERY = gql`
//   query GetTariffById($stationId: String!) {
//     Tariffs(where: { stationId: { _eq: $stationId } }) {
//       id
//       currency
//       pricePerKwh
//       stationId
//     }
//   }
// `;

// export const GET_TARIFF_BY_CORE_KEY_QUERY = gql`
//   query GetTariffByCoreKey(
//     $id: Int!
//     $countryCode: String!
//     $partyId: String!
//   ) {
//     Tariffs(
//       where: {
//         id: { _eq: $id }
//         Tenant: {
//           countryCode: { _eq: $countryCode }
//           partyId: { _eq: $partyId }
//         }
//       }
//     ) {
//       id
//       currency
//       pricePerKwh
//       stationId
//     }
//   }
// `;
