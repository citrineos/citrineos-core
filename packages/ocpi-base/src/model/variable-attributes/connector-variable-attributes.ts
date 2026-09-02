// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Represents the Connector variable attributes
 * necessary to map to an OCPI Location/EVSE/Connector.
 *
 * Properties are in snake_case to ensure SQL properties are properly mapped,
 * as CamelCase does register.
 */
export class ConnectorVariableAttributes {
  @IsString()
  @IsNotEmpty()
  connector_type!: string;

  @IsString()
  @IsNotEmpty()
  connector_availability_state!: string;

  /* Helper properties */
  id!: number;

  evse_id!: number;

  station_id!: string;
}

export const CONSTRUCT_CONNECTOR_VARIABLE_ATTRIBUTES_QUERY = (
  stationId: string,
  evseComponentId: number,
  connectorId: number,
) => `
  select * 
  from
    coalesce(
      (
        select va."value" 
        from "VariableAttributes" va 
          left join "Variables" v on va."variableId" = v."id" 
          left join "Components" c on va."componentId" = c."id"
          left join "Evses" e on c."evseDatabaseId" = e."databaseId" 
        where va."stationId" = '${stationId}' and e."id" = ${evseComponentId} and e."connectorId" = ${connectorId} and c."name" = 'Connector' and v."name" = 'ConnectorType'
      ), 'Unknown'
    ) as connector_type,
    coalesce(
      (
        select va."value" 
        from "VariableAttributes" va 
          left join "Variables" v on va."variableId" = v."id" 
          left join "Components" c on va."componentId" = c."id"
          left join "Evses" e on c."evseDatabaseId" = e."databaseId" 
        where va."stationId" = '${stationId}' and e."id" = ${evseComponentId} and e."connectorId" = ${connectorId} and c."name" = 'Connector' and v."name" = 'AvailabilityState'
      ), 'Unavailable'
    ) as connector_availability_state;
`;
