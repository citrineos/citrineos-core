// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  GetChargingStationByPkQueryResult,
  GetChargingStationByPkQueryVariables,
  IDtoEvent,
  OcpiConfig,
} from '../../index.js';
import {
  AbstractDtoModule,
  AsDtoEventHandler,
  DtoEventObjectType,
  DtoEventType,
  GET_CHARGING_STATION_BY_PK_QUERY,
  LocationsBroadcaster,
  OcpiConfigToken,
  OcpiGraphqlClient,
  OcpiModule,
  RabbitMqDtoReceiver,
} from '../../index.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { LocationsModuleApi } from './module/LocationsModuleApi.js';
import type { ChargingStationDto, ConnectorDto, EvseDto, LocationDto } from '@citrineos/base';
import { Inject, Service } from 'typedi';

export { LocationsModuleApi } from './module/LocationsModuleApi.js';
export type { ILocationsModuleApi } from './module/ILocationsModuleApi.js';

@Service()
export class LocationsModule extends AbstractDtoModule implements OcpiModule {
  constructor(
    @Inject(OcpiConfigToken) config: OcpiConfig,
    readonly logger: Logger<ILogObj>,
    readonly locationsBroadcaster: LocationsBroadcaster,
    readonly ocpiGraphqlClient: OcpiGraphqlClient,
  ) {
    super(config, new RabbitMqDtoReceiver(config, logger), logger);
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
    connectorDto.chargingStation = chargingStationResponse
      .ChargingStations[0] as ChargingStationDto;

    // TODO: filter out status updates, since they should only apply at the EVSE level

    await this.locationsBroadcaster.broadcastPatchConnector(tenant, connectorDto);
  }
}
