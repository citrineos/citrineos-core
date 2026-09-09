// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import {
  CONNECTOR_FULL_FIELDS,
  CONNECTOR_SPEC_FIELDS,
  CONNECTOR_STATUS_FIELDS,
} from '@lib/queries/fields/connector-fields';

export const CONNECTOR_LIST_FOR_STATION_QUERY = gql`
  query GetPaginatedConnectorListForStation(
    $stationId: Int!
    $offset: Int!
    $limit: Int!
    $order_by: [Connectors_order_by!]
    $where: Connectors_bool_exp = {}
  ) {
    Connectors(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: { stationId: { _eq: $stationId } }
    ) {
      id
      ocppConnectionName
      connectorId
      ${CONNECTOR_STATUS_FIELDS}
      createdAt
      updatedAt
    }
    Connectors_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const CONNECTORS_FOR_STATION_QUERY = gql`
  query GetConnectorListForStation($stationId: Int!) {
    Connectors(where: { stationId: { _eq: $stationId } }) {
      id
      ocppConnectionName
      connectorId
      ${CONNECTOR_STATUS_FIELDS}
      createdAt
      updatedAt
    }
  }
`;

export const GET_CONNECTOR_LIST_FOR_STATION_EVSE = gql`
  query GetConnectorListForStationEvse(
    $stationId: Int!
    $where: Connectors_bool_exp = {}
    $order_by: [Connectors_order_by!] = {}
    $offset: Int
    $limit: Int
  ) {
    Connectors(
      where: { stationId: { _eq: $stationId }, _and: [$where] }
      order_by: $order_by
      offset: $offset
      limit: $limit
    ) {
      id
      ocppConnectionName
      evseId
      connectorId
      evseTypeConnectorId
      status
      ${CONNECTOR_SPEC_FIELDS}
      createdAt
      updatedAt
    }
    Connectors_aggregate(where: { stationId: { _eq: $stationId }, _and: [$where] }) {
      aggregate {
        count
      }
    }
  }
`;

export const CONNECTOR_CREATE_MUTATION = gql`
  mutation ConnectorCreate($object: Connectors_insert_input!) {
    insert_Connectors_one(object: $object) {
      ${CONNECTOR_FULL_FIELDS}
    }
  }
`;

export const CONNECTOR_EDIT_MUTATION = gql`
  mutation ConnectorEdit($id: Int!, $object: Connectors_set_input!) {
    update_Connectors_by_pk(pk_columns: { id: $id }, _set: $object) {
      ${CONNECTOR_FULL_FIELDS}
    }
  }
`;
