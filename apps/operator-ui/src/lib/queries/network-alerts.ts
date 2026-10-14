// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { CHARGING_STATION_CORE_FIELDS } from '@lib/queries/fields/charging-station-fields';
import { CONNECTOR_CORE_FIELDS } from '@lib/queries/fields/connector-fields';
import { EVSE_CORE_FIELDS } from '@lib/queries/fields/evse-fields';
import { NETWORK_ALERT_FIELDS } from '@lib/queries/fields/network-alert-fields';

export const NETWORK_ALERTS_LIST_QUERY = gql`
  query NetworkAlertsList(
    $offset: Int!
    $limit: Int!
    $order_by: [NetworkAlerts_order_by!]
    $where: NetworkAlerts_bool_exp
  ) {
    NetworkAlerts(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${NETWORK_ALERT_FIELDS}
      station: ChargingStation {
        ${CHARGING_STATION_CORE_FIELDS}
      }
      evse: Evse {
        ${EVSE_CORE_FIELDS}
      }
      connector: Connector {
        ${CONNECTOR_CORE_FIELDS}
      }
    }
    NetworkAlerts_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const NETWORK_ALERT_GET_QUERY = gql`
  query GetNetworkAlertById($id: Int!) {
    NetworkAlerts_by_pk(id: $id) {
      ${NETWORK_ALERT_FIELDS}
      station: ChargingStation {
        ${CHARGING_STATION_CORE_FIELDS}
      }
      evse: Evse {
        ${EVSE_CORE_FIELDS}
      }
      connector: Connector {
        ${CONNECTOR_CORE_FIELDS}
      }
    }
  }
`;
