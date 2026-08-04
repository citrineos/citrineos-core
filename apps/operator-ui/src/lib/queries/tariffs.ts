// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { LOCATION_CORE_FIELDS } from '@lib/queries/fields/location.fields';
import { CHARGING_STATION_CORE_FIELDS } from '@lib/queries/fields/charging.station.fields';

export const TARIFF_LIST_QUERY = gql`
  query TariffList(
    $offset: Int!
    $limit: Int!
    $order_by: [Tariffs_order_by!]
    $where: Tariffs_bool_exp
  ) {
    Tariffs(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      id
      currency
      pricePerKwh
      pricePerMin
      pricePerSession
      authorizationAmount
      paymentFee
      taxRate
      tariffAltText
      createdAt
      updatedAt
    }
    Tariffs_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const TARIFF_GET_QUERY = gql`
  query GetTariffById($id: Int!) {
    Tariffs_by_pk(id: $id) {
      id
      currency
      pricePerKwh
      pricePerMin
      pricePerSession
      authorizationAmount
      paymentFee
      taxRate
      tariffAltText
      createdAt
      updatedAt
    }
  }
`;

export const GET_CHARGING_STATIONS_FOR_TARIFF = gql`
  query GetChargingStationsForTariff(
    $tariffId: Int!
    $offset: Int
    $limit: Int
    $order_by: [ChargingStations_order_by!]
    $where: [ChargingStations_bool_exp!]
  ) {
    ChargingStations(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: { Connectors: { tariffId: { _eq: $tariffId } }, _and: $where }
    ) {
      ${CHARGING_STATION_CORE_FIELDS}
      location: Location {
        ${LOCATION_CORE_FIELDS}
      }
      transactions: Transactions(where: { isActive: { _eq: true } }) {
        id
      }
    }
    ChargingStations_aggregate(
      where: { Connectors: { tariffId: { _eq: $tariffId } }, _and: $where }
    ) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_TRANSACTIONS_FOR_TARIFF = gql`
  query GetTransactionsForTariff(
    $tariffId: Int!
    $offset: Int
    $limit: Int
    $order_by: [Transactions_order_by!]
    $where: [Transactions_bool_exp!]
  ) {
    Transactions(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: { tariffId: { _eq: $tariffId }, _and: $where }
    ) {
      id
      timeSpentCharging
      isActive
      chargingState
      stoppedReason
      transactionId
      evseId
      remoteStartId
      totalKwh
      startTime
      endTime
      createdAt
      updatedAt
      chargingStation: ChargingStation {
        ${CHARGING_STATION_CORE_FIELDS}
        location: Location {
          ${LOCATION_CORE_FIELDS}
        }
      }
      authorization: Authorization {
        id
        idToken
        idTokenType
      }
    }
    Transactions_aggregate(where: { tariffId: { _eq: $tariffId }, _and: $where }) {
      aggregate {
        count
      }
    }
  }
`;

export const TARIFF_CREATE_MUTATION = gql`
  mutation CreateTariff($object: Tariffs_insert_input!) {
    insert_Tariffs_one(object: $object) {
      id
      createdAt
      updatedAt
    }
  }
`;

export const TARIFF_EDIT_MUTATION = gql`
  mutation TariffEdit($id: Int!, $object: Tariffs_set_input!) {
    update_Tariffs_by_pk(pk_columns: { id: $id }, _set: $object) {
      id
      updatedAt
    }
  }
`;

export const TARIFF_DELETE_MUTATION = gql`
  mutation TariffDelete($id: Int!) {
    delete_Tariffs_by_pk(id: $id) {
      id
    }
  }
`;
