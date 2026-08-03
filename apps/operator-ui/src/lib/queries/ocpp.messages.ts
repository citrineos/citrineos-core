// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';

export const GET_OCPP_MESSAGES_LIST_FOR_STATION = gql`
  query GetOCPPMessagesListForStation(
    $stationId: Int
    $where: [OCPPMessages_bool_exp!] = []
    $order_by: [OCPPMessages_order_by!] = {}
    $offset: Int
    $limit: Int
  ) {
    OCPPMessages(
      where: { stationId: { _eq: $stationId }, _and: $where }
      order_by: $order_by
      offset: $offset
      limit: $limit
    ) {
      id
      ocppConnectionName
      correlationId
      origin
      type
      protocol
      action
      payload
      raw
      timestamp
      createdAt
      updatedAt
    }
    OCPPMessages_aggregate(where: { stationId: { _eq: $stationId }, _and: $where }) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_OCPP_MESSAGES_FOR_TRANSACTION_LIST_QUERY = gql`
  query OCPPMessageList(
    $ocppTransactionId: Int
    $ocppConnectionName: String
    $offset: Int!
    $limit: Int!
    $order_by: [OCPPMessages_order_by!]
    $where: OCPPMessages_bool_exp! = {}
  ) {
    OCPPMessages(
      offset: $offset
      limit: $limit
      order_by: $order_by
      where: {
        _and: [
          { payload: { _contains: { transactionId: $ocppTransactionId } } }
          { ocppConnectionName: { _eq: $ocppConnectionName } }
          {
            _or: [
              {
                _and: [
                  { protocol: { _eq: "ocpp1.6" } }
                  {
                    action: {
                      _in: [
                        "StartTransaction"
                        "StopTransaction"
                        "MeterValues"
                        "RemoteStopTransaction"
                      ]
                    }
                  }
                ]
              }
              {
                _and: [
                  { protocol: { _eq: "ocpp2.0.1" } }
                  { action: { _eq: "GetTransactionStatus" } }
                ]
              }
            ]
          }
          $where
        ]
      }
    ) {
      id
      ocppConnectionName
      action
      protocol
      type
      payload
      raw
      timestamp
    }

    OCPPMessages_aggregate(
      where: {
        _and: [
          { payload: { _contains: { transactionId: $ocppTransactionId } } }
          { ocppConnectionName: { _eq: $ocppConnectionName } }
          {
            _or: [
              {
                _and: [
                  { protocol: { _eq: "ocpp1.6" } }
                  {
                    action: {
                      _in: [
                        "StartTransaction"
                        "StopTransaction"
                        "MeterValues"
                        "RemoteStopTransaction"
                      ]
                    }
                  }
                ]
              }
              {
                _and: [
                  { protocol: { _eq: "ocpp2.0.1" } }
                  { action: { _eq: "GetTransactionStatus" } }
                ]
              }
            ]
          }
          $where
        ]
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;
