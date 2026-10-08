// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  GetChargingStationByPkQueryResult,
  GetChargingStationByPkQueryVariables,
  GetEvseByIdQueryResult,
  GetEvseByIdQueryVariables,
  IDtoEvent,
} from '../../../index.js';
import {
  AbstractDtoModule,
  AsDtoEventHandler,
  DtoEventObjectType,
  DtoEventType,
  GET_CHARGING_STATION_BY_PK_QUERY,
  GET_EVSE_BY_ID_QUERY,
  OcpiModule,
} from '../../../index.js';
import type { IOcpiGraphqlClient, LocationsBroadcaster } from '../../../index.js';
import type { DtoEventReceiverFactory } from '../../../index.js';
import type { OcpiConfiguredDependencies } from '../../server/dependencies.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { LocationsModuleApi } from './module/locations-module-api.js';
import type {
  ChargingStationDto,
  ConnectorDto,
  EvseDto,
  LocationDto,
  TenantDto,
} from '@citrineos/types';

export { LocationsModuleApi } from './module/locations-module-api.js';
export type { ILocationsModuleApi } from './module/i-locations-module-api.js';

export interface LocationsModuleDependencies extends OcpiConfiguredDependencies {
  dtoEventReceiverFactory: DtoEventReceiverFactory;
  locationsBroadcaster: LocationsBroadcaster;
  ocpiGraphqlClient: IOcpiGraphqlClient;
}

export class LocationsModule extends AbstractDtoModule implements OcpiModule {
  readonly logger: Logger<ILogObj>;
  readonly locationsBroadcaster: LocationsBroadcaster;
  readonly ocpiGraphqlClient: IOcpiGraphqlClient;

  constructor({
    config,
    logger,
    dtoEventReceiverFactory,
    locationsBroadcaster,
    ocpiGraphqlClient,
  }: LocationsModuleDependencies) {
    super(config, dtoEventReceiverFactory(), logger);
    this.logger = logger;
    this.locationsBroadcaster = locationsBroadcaster;
    this.ocpiGraphqlClient = ocpiGraphqlClient;
  }

  getController(): any {
    return LocationsModuleApi;
  }

  async init(): Promise<void> {
    this._logger.info('Initializing Locations Module...');
    await this._receiver.init();
    this._logger.info('Locations Module initialized successfully.');
  }

  async shutdown(): Promise<void> {
    this._logger.info('Shutting down Locations Module...');
    await super.shutdown();
  }

  @AsDtoEventHandler(DtoEventType.INSERT, DtoEventObjectType.Location, 'LocationNotification')
  async handleLocationInsert(event: IDtoEvent<LocationDto>): Promise<void> {
    this._logger.debug(`Handling Location Insert: ${JSON.stringify(event)}`);
    const locationDto = event._payload;
    const tenant = locationDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${locationDto.id}, cannot broadcast.`,
      );
      return;
    }

    await this.locationsBroadcaster.broadcastPutLocation(tenant, locationDto);
  }

  @AsDtoEventHandler(DtoEventType.UPDATE, DtoEventObjectType.Location, 'LocationNotification')
  async handleLocationUpdate(event: IDtoEvent<Partial<LocationDto>>): Promise<void> {
    this._logger.debug(`Handling Location Update: ${JSON.stringify(event)}`);
    const locationDto = event._payload;
    const tenant = locationDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${locationDto.id}, cannot broadcast.`,
      );
      return;
    }

    await this.locationsBroadcaster.broadcastPatchLocation(tenant, locationDto);
  }

  @AsDtoEventHandler(
    DtoEventType.UPDATE,
    DtoEventObjectType.ChargingStation,
    'ChargingStationNotification',
  )
  async handleChargingStationUpdate(event: IDtoEvent<Partial<ChargingStationDto>>): Promise<void> {
    this._logger.debug(`Handling Charging Station Update: ${JSON.stringify(event)}`);
    // Updates are Location/Evse PATCH requests
    // await this.locationsBroadcaster.broadcastPatchEvse(event._payload); // todo
  }

  @AsDtoEventHandler(DtoEventType.INSERT, DtoEventObjectType.Evse, 'EvseNotification')
  async handleEvseInsert(event: IDtoEvent<EvseDto>): Promise<void> {
    this._logger.debug(`Handling EVSE Insert: ${JSON.stringify(event)}`);
    const evseDto = event._payload;
    const tenant = evseDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${evseDto.id}, cannot broadcast.`,
      );
      return;
    }

    if (evseDto.stationId == null) {
      this._logger.error(
        `Station ID missing in ${event._context.eventType} notification for ${event._context.objectType} ${evseDto.id}, cannot broadcast.`,
      );
      return;
    }

    const chargingStationResponse = await this.ocpiGraphqlClient.request<
      GetChargingStationByPkQueryResult,
      GetChargingStationByPkQueryVariables
    >(GET_CHARGING_STATION_BY_PK_QUERY, { id: evseDto.stationId });
    if (!chargingStationResponse.ChargingStations[0]) {
      this._logger.error(
        `Charging Station not found for station ID ${evseDto.stationId}, cannot broadcast.`,
      );
      return;
    }
    const chargingStationDto = chargingStationResponse.ChargingStations[0] as ChargingStationDto;

    await this.locationsBroadcaster.broadcastPutEvse(tenant, evseDto, chargingStationDto);
  }

  @AsDtoEventHandler(DtoEventType.UPDATE, DtoEventObjectType.Evse, 'EvseNotification')
  async handleEvseUpdate(event: IDtoEvent<Partial<EvseDto>>): Promise<void> {
    this._logger.debug(`Handling EVSE Update: ${JSON.stringify(event)}`);
    const evseDto = event._payload;
    const tenant = evseDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${evseDto.id}, cannot broadcast.`,
      );
      return;
    }

    if (evseDto.stationId == null) {
      this._logger.error(
        `Station ID missing in ${event._context.eventType} notification for ${event._context.objectType} ${evseDto.id}, cannot broadcast.`,
      );
      return;
    }

    const chargingStationResponse = await this.ocpiGraphqlClient.request<
      GetChargingStationByPkQueryResult,
      GetChargingStationByPkQueryVariables
    >(GET_CHARGING_STATION_BY_PK_QUERY, { id: evseDto.stationId });
    if (!chargingStationResponse.ChargingStations[0]) {
      this._logger.error(
        `Charging Station not found for station ID ${evseDto.stationId}, cannot broadcast.`,
      );
      return;
    }
    const chargingStationDto = chargingStationResponse.ChargingStations[0] as ChargingStationDto;

    await this.locationsBroadcaster.broadcastPatchEvse(tenant, evseDto, chargingStationDto);
  }

  @AsDtoEventHandler(DtoEventType.INSERT, DtoEventObjectType.Connector, 'ConnectorNotification')
  async handleConnectorInsert(event: IDtoEvent<ConnectorDto>): Promise<void> {
    this._logger.debug(`Handling Connector Insert: ${JSON.stringify(event)}`);
    const connectorDto = event._payload;
    const tenant = connectorDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${connectorDto.id}, cannot broadcast.`,
      );
      return;
    }

    if (connectorDto.stationId == null) {
      this._logger.error(
        `Station ID missing in ${event._context.eventType} notification for ${event._context.objectType} ${connectorDto.id}, cannot broadcast.`,
      );
      return;
    }

    const chargingStationResponse = await this.ocpiGraphqlClient.request<
      GetChargingStationByPkQueryResult,
      GetChargingStationByPkQueryVariables
    >(GET_CHARGING_STATION_BY_PK_QUERY, {
      id: connectorDto.stationId,
    });
    if (!chargingStationResponse.ChargingStations[0]) {
      this._logger.error(
        `Charging Station not found for station ID ${connectorDto.stationId}, cannot broadcast.`,
      );
      return;
    }
    connectorDto.chargingStation = chargingStationResponse
      .ChargingStations[0] as ChargingStationDto;

    await this.locationsBroadcaster.broadcastPutConnector(tenant, connectorDto);
  }

  @AsDtoEventHandler(DtoEventType.UPDATE, DtoEventObjectType.Connector, 'ConnectorNotification')
  async handleConnectorUpdate(event: IDtoEvent<Partial<ConnectorDto>>): Promise<void> {
    this._logger.debug(`Handling Connector Update: ${JSON.stringify(event)}`);
    const connectorDto = event._payload;
    const tenant = connectorDto.tenant;
    if (!tenant) {
      this._logger.error(
        `Tenant data missing in ${event._context.eventType} notification for ${event._context.objectType} ${connectorDto.id}, cannot broadcast.`,
      );
      return;
    }

    if (connectorDto.stationId == null) {
      this._logger.error(
        `Station ID missing in ${event._context.eventType} notification for ${event._context.objectType} ${connectorDto.id}, cannot broadcast.`,
      );
      return;
    }

    const chargingStationResponse = await this.ocpiGraphqlClient.request<
      GetChargingStationByPkQueryResult,
      GetChargingStationByPkQueryVariables
    >(GET_CHARGING_STATION_BY_PK_QUERY, {
      id: connectorDto.stationId,
    });
    if (!chargingStationResponse.ChargingStations[0]) {
      this._logger.error(
        `Charging Station not found for station ID ${connectorDto.stationId}, cannot broadcast.`,
      );
      return;
    }
    const chargingStationDto = chargingStationResponse.ChargingStations[0] as ChargingStationDto;
    connectorDto.chargingStation = chargingStationDto;

    // TODO: skip the connector PATCH for status-only changes; status is pushed at the EVSE level below

    await this.locationsBroadcaster.broadcastPatchConnector(tenant, connectorDto);

    if (connectorDto.status !== undefined && connectorDto.evseId != null) {
      await this.broadcastEvseStatus(tenant, connectorDto.evseId, chargingStationDto);
    }
  }

  // The connector notification is the only one a StatusNotification produces, and OCPI carries
  // status on the EVSE, so re-read the EVSE with its connectors and push the derived status.
  private async broadcastEvseStatus(
    tenant: TenantDto,
    evseId: number,
    chargingStationDto: ChargingStationDto,
  ): Promise<void> {
    if (chargingStationDto.locationId == null) {
      this._logger.error(
        `Location ID missing for Charging Station ${chargingStationDto.id}, cannot broadcast status of EVSE ${evseId}.`,
      );
      return;
    }

    const response = await this.ocpiGraphqlClient.request<
      GetEvseByIdQueryResult,
      GetEvseByIdQueryVariables
    >(GET_EVSE_BY_ID_QUERY, {
      locationId: chargingStationDto.locationId,
      stationId: chargingStationDto.ocppConnectionName,
      evseId,
      countryCode: tenant.countryCode!,
      partyId: tenant.partyId!,
    });
    const evseRecord = response.Locations?.[0]?.chargingPool?.[0]?.evses?.[0];
    if (!evseRecord) {
      this._logger.error(
        `EVSE ${evseId} not found for Charging Station ${chargingStationDto.id}, cannot broadcast status.`,
      );
      return;
    }

    await this.locationsBroadcaster.broadcastPatchEvseStatus(
      tenant,
      evseRecord as EvseDto,
      chargingStationDto,
    );
  }
}
