// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';

export const CHARGING_STATION_SEQUENCES_GET_QUERY = gql`
  query ChargingStationSequencesGet($stationId: Int!, $type: String!) {
    ChargingStationSequences(where: { stationId: { _eq: $stationId }, type: { _eq: $type } }) {
      value
    }
  }
`;
