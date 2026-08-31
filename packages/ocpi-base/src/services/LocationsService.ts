// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj } from 'tslog';
import type { Logger } from 'tslog';
import type { LocationResponse, PaginatedLocationResponse } from '../model/DTO/LocationDTO.js';
import type { EvseResponse } from '../model/DTO/EvseDTO.js';
import type { ConnectorResponse } from '../model/DTO/ConnectorDTO.js';
import { PaginatedParams } from '../controllers/param/PaginatedParams.js';
import {
  buildOcpiPaginatedResponse,
  DEFAULT_LIMIT,
  DEFAULT_OFFSET,
} from '../model/PaginatedResponse.js';
import { buildOcpiResponse, OcpiResponseStatusCode } from '../model/OcpiResponse.js';
import { buildOcpiErrorResponse } from '../model/OcpiErrorResponse.js';
import { OcpiHeaders } from '../model/OcpiHeaders.js';
import { NotFoundException } from '../exception/NotFoundException.js';
import type {
  GetConnectorByIdQueryResult,
  GetConnectorByIdQueryVariables,
  GetEvseByIdQueryResult,
  GetEvseByIdQueryVariables,
  GetLocationByIdQueryResult,
  GetLocationByIdQueryVariables,
  GetLocationsQueryResult,
  GetLocationsQueryVariables,
  Locations_Bool_Exp,
  Timestamptz_Comparison_Exp,
} from '../graphql/index.js';
import {
  GET_CONNECTOR_BY_ID_QUERY,
  GET_EVSE_BY_ID_QUERY,
  GET_LOCATION_BY_ID_QUERY,
  GET_LOCATIONS_QUERY,
} from '../graphql/index.js';
import type { ConnectorMapper, EvseMapper, LocationMapper } from '../mapper/index.js';
import type { IOcpiGraphqlClient } from '../graphql/index.js';
import type { OcpiGraphqlDependencies } from '../dependencies.js';
import type { ChargingStationDto, ConnectorDto, EvseDto, LocationDto } from '@citrineos/types';

export interface LocationsServiceDependencies extends OcpiGraphqlDependencies {
  locationMapper: LocationMapper;
  evseMapper: EvseMapper;
  connectorMapper: ConnectorMapper;
}

export class LocationsService {
  private readonly logger: Logger<ILogObj>;
  private readonly ocpiGraphqlClient: IOcpiGraphqlClient;
  private readonly locationMapper: LocationMapper;
  private readonly evseMapper: EvseMapper;
  private readonly connectorMapper: ConnectorMapper;

  constructor({
    logger,
    ocpiGraphqlClient,
    locationMapper,
    evseMapper,
    connectorMapper,
  }: LocationsServiceDependencies) {
    this.logger = logger;
    this.ocpiGraphqlClient = ocpiGraphqlClient;
    this.locationMapper = locationMapper;
    this.evseMapper = evseMapper;
    this.connectorMapper = connectorMapper;
  }

  /**
   * Sender Methods
   */

  async getLocations(
    ocpiHeaders: OcpiHeaders,
    paginatedParams?: PaginatedParams,
  ): Promise<PaginatedLocationResponse> {
    this.logger.debug(
      `Getting all locations with headers ${JSON.stringify(ocpiHeaders)} and parameters ${JSON.stringify(paginatedParams)}`,
    );
    const limit = paginatedParams?.limit ?? DEFAULT_LIMIT;
    const offset = paginatedParams?.offset ?? DEFAULT_OFFSET;
    const where: Locations_Bool_Exp = {
      Tenant: {
        countryCode: { _eq: ocpiHeaders.toCountryCode },
        partyId: { _eq: ocpiHeaders.toPartyId },
      },
    };
    const dateFilters: Timestamptz_Comparison_Exp = {};
    if (paginatedParams?.dateFrom) dateFilters._gte = paginatedParams.dateFrom.toISOString();
    if (paginatedParams?.dateTo) dateFilters._lt = paginatedParams.dateTo.toISOString();
    if (Object.keys(dateFilters).length > 0) {
      where.updatedAt = dateFilters;
    }
    const variables = {
      limit,
      offset,
      where,
    };

    const response = await this.ocpiGraphqlClient.request<
      GetLocationsQueryResult,
      GetLocationsQueryVariables
    >(GET_LOCATIONS_QUERY, variables);

    // Map GraphQL DTOs to OCPI DTOs
    const locations =
      response.Locations.map((value) => this.locationMapper.fromGraphql(value as LocationDto)) ??
      [];
    const locationsTotal = response.Locations_aggregate?.aggregate?.count ?? 0;

    return buildOcpiPaginatedResponse(
      OcpiResponseStatusCode.GenericSuccessCode,
      locationsTotal,
      limit,
      offset,
      locations,
    ) as PaginatedLocationResponse;
  }

  private parseLocationId(locationId: string): number {
    if (!/^\d+$/.test(locationId.trim())) {
      throw new NotFoundException(`Unknown location: ${locationId}`);
    }
    return Number(locationId.trim());
  }

  async getLocationById(ocpiHeaders: OcpiHeaders, locationId: string): Promise<LocationResponse> {
    this.logger.debug(`Getting location ${locationId}`);

    try {
      const id = this.parseLocationId(locationId);
      const variables = {
        id,
        countryCode: ocpiHeaders.toCountryCode,
        partyId: ocpiHeaders.toPartyId,
      };
      const response = await this.ocpiGraphqlClient.request<
        GetLocationByIdQueryResult,
        GetLocationByIdQueryVariables
      >(GET_LOCATION_BY_ID_QUERY, variables);
      // response.Locations is an array, so pick the first
      if (!response.Locations || response.Locations.length === 0) {
        throw new NotFoundException(`Unknown location: ${locationId}`);
      }
      if (response.Locations.length > 1) {
        this.logger.warn(
          `Multiple locations found for id ${locationId}. Returning the first one. All entries: ${JSON.stringify(response.Locations)}`,
        );
      }
      const location = this.locationMapper.fromGraphql(response.Locations[0] as LocationDto);
      return buildOcpiResponse(
        OcpiResponseStatusCode.GenericSuccessCode,
        location,
      ) as LocationResponse;
    } catch (e) {
      const statusCode =
        e instanceof NotFoundException
          ? OcpiResponseStatusCode.ClientUnknownLocation
          : OcpiResponseStatusCode.ClientGenericError;
      return buildOcpiErrorResponse(statusCode, (e as Error).message) as LocationResponse;
    }
  }

  async getEvseById(
    ocpiHeaders: OcpiHeaders,
    locationId: string,
    stationId: string,
    evseId: number,
  ): Promise<EvseResponse> {
    this.logger.debug(
      `Getting EVSE ${evseId} from Charging Station ${stationId} in Location ${locationId}`,
    );

    try {
      const variables = {
        locationId: this.parseLocationId(locationId),
        stationId,
        evseId,
        countryCode: ocpiHeaders.toCountryCode,
        partyId: ocpiHeaders.toPartyId,
      };
      const response = await this.ocpiGraphqlClient.request<
        GetEvseByIdQueryResult,
        GetEvseByIdQueryVariables
      >(GET_EVSE_BY_ID_QUERY, variables);
      const station = response.Locations?.[0]?.chargingPool?.[0];
      const evseRecord = station?.evses?.[0];
      if (!station || !evseRecord) {
        throw new NotFoundException(`Unknown location: ${locationId}`);
      }
      const evse = this.evseMapper.fromGraphql(
        station as ChargingStationDto,
        evseRecord as EvseDto,
      );
      return buildOcpiResponse(OcpiResponseStatusCode.GenericSuccessCode, evse);
    } catch (e) {
      const statusCode =
        e instanceof NotFoundException
          ? OcpiResponseStatusCode.ClientUnknownLocation
          : OcpiResponseStatusCode.ClientGenericError;
      return buildOcpiErrorResponse(statusCode, (e as Error).message) as EvseResponse;
    }
  }

  async getConnectorById(
    ocpiHeaders: OcpiHeaders,
    locationId: string,
    stationId: string,
    evseId: number,
    connectorId: number,
  ): Promise<ConnectorResponse> {
    this.logger.debug(
      `Getting Connector ${connectorId} from EVSE ${evseId} in Charging Station ${stationId} in Location ${locationId}`,
    );

    try {
      const variables = {
        locationId: this.parseLocationId(locationId),
        stationId,
        evseId,
        connectorId,
        countryCode: ocpiHeaders.toCountryCode,
        partyId: ocpiHeaders.toPartyId,
      };
      const response = await this.ocpiGraphqlClient.request<
        GetConnectorByIdQueryResult,
        GetConnectorByIdQueryVariables
      >(GET_CONNECTOR_BY_ID_QUERY, variables);
      // Traverse to the Connector object
      const connectors = response.Locations?.[0]?.chargingPool?.[0]?.evses?.[0]?.connectors;
      if (!connectors || connectors.length === 0) {
        throw new NotFoundException(`Unknown location: ${locationId}`);
      }
      if (connectors.length > 1) {
        this.logger.warn(
          `Multiple connectors found for location id ${locationId}, station id ${stationId}, EVSE id ${evseId}, and connector id ${connectorId}. Returning the first one. All entries: ${JSON.stringify(connectors)}`,
        );
      }
      const connector = this.connectorMapper.fromGraphql(connectors[0] as ConnectorDto);
      return buildOcpiResponse(OcpiResponseStatusCode.GenericSuccessCode, connector);
    } catch (e) {
      const statusCode =
        e instanceof NotFoundException
          ? OcpiResponseStatusCode.ClientUnknownLocation
          : OcpiResponseStatusCode.ClientGenericError;
      return buildOcpiErrorResponse(statusCode, (e as Error).message) as ConnectorResponse;
    }
  }
}
