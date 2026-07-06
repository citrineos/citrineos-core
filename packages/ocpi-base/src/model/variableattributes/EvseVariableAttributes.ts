// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IsNotEmpty, IsString } from 'class-validator';
import { ConnectorVariableAttributes } from './ConnectorVariableAttributes.js';

/**
 * Represents the EVSE variable attributes
 * necessary to map to an OCPI Location/EVSE/Connector.
 *
 * Properties are in snake_case to ensure SQL properties are properly mapped,
 * as CamelCase does register.
 */
export class EvseVariableAttributes {
  @IsString()
  @IsNotEmpty()
  evse_availability_state!: string;

  @IsString()
  @IsNotEmpty()
  evse_id!: string;

  @IsString()
  @IsNotEmpty()
  evse_dc_voltage!: string;

  @IsString()
  @IsNotEmpty()
  evse_dc_current!: string;

  @IsString()
  @IsNotEmpty()
  evse_power!: string;

  @IsString()
  @IsNotEmpty()
  connector_ids_string!: string;

  /* Helper properties */
  id!: number;

  station_id!: string;

  connectors: Map<number, ConnectorVariableAttributes> = new Map<
    number,
    ConnectorVariableAttributes
  >();
}

export const CONSTRUCT_EVSE_VARIABLE_ATTRIBUTES_QUERY = (
  stationId: string,
  evseComponentId: number,
) => `
  select * 
  from 
    coalesce(
      (
        select string_agg(distinct e."connectorId"::text, ',') from "VariableAttributes" va 
        left join "Variables" v on va."variableId" = v."id" 
        left join "Components" c on va."componentId" = c."id"
        left join "Evses" e on c."evseDatabaseId" = e."databaseId"
        where va."stationId" = '${stationId}' and e."connectorId" is not null
      ), ''
    ) as connector_ids_string,
    coalesce(
      (
        select va."value" 
        from "VariableAttributes" va 
          left join "Variables" v on va."variableId" = v."id" 
          left join "Components" c on va."componentId" = c."id"
          left join "Evses" e on c."evseDatabaseId" = e."databaseId" 
        where va."stationId" = '${stationId}' and e."id" = ${evseComponentId} and c."name" = 'EVSE' and v."name" = 'AvailabilityState'
      ), 'Unavailable'
    ) as evse_availability_state,
    coalesce(
      (
        select va."value" 
        from "VariableAttributes" va 
          left join "Variables" v on va."variableId" = v."id" 
          left join "Components" c on va."componentId" = c."id"
          left join "Evses" e on c."evseDatabaseId" = e."databaseId" 
        where va."stationId" = '${stationId}' and e."id" = ${evseComponentId} and c."name" = 'EVSE' and v."name" = 'EvseId'
      ), 'Unknown'
    ) as evse_id,
    coalesce(
      (
        select va."value" 
        from "VariableAttributes" va 
          left join "Variables" v on va."variableId" = v."id" 
          left join "Components" c on va."componentId" = c."id"
          left join "Evses" e on c."evseDatabaseId" = e."databaseId" 
        where va."stationId" = '${stationId}' and e."id" = ${evseComponentId} and c."name" = 'EVSE' and v."name" = 'DCVoltage'
      ), '0'
    ) as evse_dc_voltage,
    coalesce(
      (
        select va."value" 
        from "VariableAttributes" va 
          left join "Variables" v on va."variableId" = v."id" 
          left join "Components" c on va."componentId" = c."id"
          left join "Evses" e on c."evseDatabaseId" = e."databaseId" 
        where va."stationId" = '${stationId}' and e."id" = ${evseComponentId} and c."name" = 'EVSE' and v."name" = 'DCCurrent'
      ), '0'
    ) as evse_dc_current,
    coalesce(
      (
        select va."value" 
        from "VariableAttributes" va 
          left join "Variables" v on va."variableId" = v."id" 
          left join "Components" c on va."componentId" = c."id"
          left join "Evses" e on c."evseDatabaseId" = e."databaseId" 
        where va."stationId" = '${stationId}' and e."id" = 1 and c."name" = 'EVSE' and v."name" = 'Power'
      ), '0'
    ) as evse_power;
`;
