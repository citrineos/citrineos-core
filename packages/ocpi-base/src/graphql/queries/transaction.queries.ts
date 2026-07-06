// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-request';

export const GET_TRANSACTIONS_QUERY = gql`
  query GetTransactions($offset: Int, $limit: Int, $where: Transactions_bool_exp!) {
    Transactions(offset: $offset, limit: $limit, order_by: { createdAt: asc }, where: $where) {
      id
      stationId
      ocppConnectionName
      transactionId
      isActive
      chargingState
      timeSpentCharging
      totalKwh
      stoppedReason
      remoteStartId
      totalCost
      startTime
      endTime
      createdAt
      updatedAt
      evseId
      connectorId
      locationId
      authorizationId
      tariffId
      tenant: Tenant {
        countryCode
        partyId
        name
        isUserTenant
      }
      station: ChargingStation {
        ocppConnectionName
        isOnline
      }
      transactionEvents: TransactionEvents {
        id
        eventType
        EvseType {
          id
        }
        transactionInfo
      }
      startTransaction: StartTransaction {
        timestamp
      }
      stopTransaction: StopTransaction {
        timestamp
      }
      meterValues: MeterValues {
        timestamp
        sampledValue
      }
    }
  }
`;

export const GET_TRANSACTION_BY_TRANSACTION_ID_QUERY = gql`
  query GetTransactionByTransactionId($transactionId: String!) {
    Transactions(where: { transactionId: { _eq: $transactionId } }) {
      tenant: Tenant {
        countryCode
        partyId
        name
        isUserTenant
      }
      id
      stationId
      ocppConnectionName
      transactionId
      isActive
      chargingState
      timeSpentCharging
      totalKwh
      stoppedReason
      remoteStartId
      totalCost
      startTime
      endTime
      createdAt
      updatedAt
      evseId
      connectorId
      locationId
      authorizationId
      tariffId
      authorization: Authorization {
        tenantPartner: TenantPartner {
          id
          countryCode
          partyId
          partnerProfileOCPI
          tenant: Tenant {
            id
            countryCode
            partyId
          }
        }
      }
      station: ChargingStation {
        id
        ocppConnectionName
        isOnline
      }
      transactionEvents: TransactionEvents {
        id
        eventType
        EvseType {
          id
        }
        transactionInfo
      }
      startTransaction: StartTransaction {
        timestamp
      }
      stopTransaction: StopTransaction {
        timestamp
      }
      meterValues: MeterValues {
        timestamp
        sampledValue
      }
    }
  }
`;
