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
    Transactions_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_TRANSACTION_BY_ID_QUERY = gql`
  query GetTransactionById($id: Int!) {
    Transactions_by_pk(id: $id) {
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

// Scoped lookup for the OCPI StopSession command: the eMSP only knows the
// (non-unique) transactionId, so we additionally scope to the calling partner
// (countryCode/partyId) and to active sessions. The caller must treat a result
// with more than one row as ambiguous and reject it rather than pick one.
export const GET_ACTIVE_TRANSACTION_FOR_STOP_SESSION_QUERY = gql`
  query GetActiveTransactionForStopSession(
    $transactionId: String!
    $countryCode: String!
    $partyId: String!
  ) {
    Transactions(
      where: {
        transactionId: { _eq: $transactionId }
        isActive: { _eq: true }
        Authorization: {
          TenantPartner: { countryCode: { _eq: $countryCode }, partyId: { _eq: $partyId } }
        }
      }
      order_by: { createdAt: desc }
    ) {
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
