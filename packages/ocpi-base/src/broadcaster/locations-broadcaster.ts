// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseBroadcaster } from './base-broadcaster.js';
import type { LocationsClientApi } from '../trigger/locations-client-api.js';
import type { ILogObj, Logger } from 'tslog';
import type { CredentialsService } from '../services/credentials-service.js';
import type { LocationDTO } from '../model/dto/location-dto.js';
import type { EvseDTO } from '../model/dto/evse-dto.js';
import { UID_FORMAT } from '../model/dto/evse-dto.js';
import type { ConnectorDTO } from '../model/dto/connector-dto.js';
import { ModuleId } from '../model/module-id.js';
import { InterfaceRole } from '../model/interface-role.js';
import {
  type ChargingStationDto,
  type ConnectorDto,
  type EvseDto,
  type LocationDto,
  type TenantDto,
  HttpMethod,
} from '@citrineos/types';
import type { ConnectorMapper, EvseMapper, LocationMapper } from '../mapper/index.js';
import type { OcpiDependencies } from '../dependencies.js';
import { OcpiEmptyResponseSchema } from '../model/ocpi-empty-response.js';

export interface LocationsBroadcasterDependencies extends OcpiDependencies {
  credentialsService: CredentialsService;
  locationsClientApi: LocationsClientApi;
  locationMapper: LocationMapper;
  evseMapper: EvseMapper;
  connectorMapper: ConnectorMapper;
}

export class LocationsBroadcaster extends BaseBroadcaster {
  readonly logger: Logger<ILogObj>;
  readonly credentialsService: CredentialsService;
  readonly locationsClientApi: LocationsClientApi;
  private readonly locationMapper: LocationMapper;
  private readonly evseMapper: EvseMapper;
  private readonly connectorMapper: ConnectorMapper;

  constructor({
    logger,
    credentialsService,
    locationsClientApi,
    locationMapper,
    evseMapper,
    connectorMapper,
  }: LocationsBroadcasterDependencies) {
    super();
    this.logger = logger;
    this.credentialsService = credentialsService;
    this.locationsClientApi = locationsClientApi;
    this.locationMapper = locationMapper;
    this.evseMapper = evseMapper;
    this.connectorMapper = connectorMapper;
  }

  async broadcastPutLocation(tenant: TenantDto, locationDto: LocationDto): Promise<void> {
    const location = this.locationMapper.fromGraphql(locationDto);
    const path = `/${tenant.countryCode}/${tenant.partyId}/${location.id}`;
    await this.broadcastLocation(tenant, location, HttpMethod.Put, path);
  }

  async broadcastPatchLocation(
    tenant: TenantDto,
    locationDto: Partial<LocationDto>,
  ): Promise<void> {
    const locationId = locationDto.id;
    if (!locationId) throw new Error('Location ID missing');
    const location = this.locationMapper.fromPartialGraphql(locationDto);
    const path = `/${tenant.countryCode}/${tenant.partyId}/${locationId}`;
    await this.broadcastLocation(tenant, location, HttpMethod.Patch, path);
  }

  private async broadcastLocation(
    tenant: TenantDto,
    location: Partial<LocationDTO>,
    method: HttpMethod,
    path: string,
  ): Promise<void> {
    try {
      await this.locationsClientApi.broadcastToClients({
        cpoCountryCode: tenant.countryCode!,
        cpoPartyId: tenant.partyId!,
        moduleId: ModuleId.Locations,
        interfaceRole: InterfaceRole.RECEIVER,
        httpMethod: method,
        schema: OcpiEmptyResponseSchema,
        body: location,
        path: path,
      });
    } catch (e) {
      this.logger.error(`broadcast${method}Location failed for Location ${path}`, e);
    }
  }

  async broadcastPutEvse(
    tenant: TenantDto,
    evseDto: EvseDto,
    chargingStationDto: ChargingStationDto,
  ): Promise<void> {
    const locationId = chargingStationDto?.locationId;
    if (!locationId) throw new Error('Location ID missing in EVSE data');
    const evse = this.evseMapper.fromGraphql(chargingStationDto!, evseDto);
    if (!evse) throw new Error('Failed to map EVSE data');
    const path = `/${tenant.countryCode}/${tenant.partyId}/${locationId}/${UID_FORMAT(evseDto.ocppConnectionName, evseDto.id!)}`;
    await this.broadcastEvse(tenant, evse, HttpMethod.Put, path);
  }

  async broadcastPatchEvse(
    tenant: TenantDto,
    evseDto: Partial<EvseDto>,
    chargingStationDto: Partial<ChargingStationDto>,
  ): Promise<void> {
    const locationId = chargingStationDto?.locationId;
    if (!locationId) throw new Error('Location ID missing in EVSE data');
    const evse = this.evseMapper.fromPartialGraphql(chargingStationDto!, evseDto);
    if (!evse) throw new Error('Failed to map EVSE data');
    const path = `/${tenant.countryCode}/${tenant.partyId}/${locationId}/${UID_FORMAT(evseDto.ocppConnectionName!, evseDto.id!)}`;
    await this.broadcastEvse(tenant, evse, HttpMethod.Patch, path);
  }

  private async broadcastEvse(
    tenant: TenantDto,
    evseData: Partial<EvseDTO>,
    method: HttpMethod,
    path: string,
  ): Promise<void> {
    try {
      await this.locationsClientApi.broadcastToClients({
        cpoCountryCode: tenant.countryCode!,
        cpoPartyId: tenant.partyId!,
        moduleId: ModuleId.Locations,
        interfaceRole: InterfaceRole.RECEIVER,
        httpMethod: method,
        schema: OcpiEmptyResponseSchema,
        body: evseData,
        path: path,
      });
    } catch (e) {
      this.logger.error(`broadcast${method}Evse failed for ${path}`, e);
    }
  }

  async broadcastPutConnector(tenant: TenantDto, connectorDto: ConnectorDto): Promise<void> {
    const locationId = connectorDto.chargingStation?.locationId;
    if (!locationId) throw new Error('Location ID missing in Connector data');
    const connector = this.connectorMapper.fromGraphql(connectorDto);
    if (!connector) throw new Error('Failed to map Connector data');
    const path = `/${tenant.countryCode}/${tenant.partyId}/${locationId}/${UID_FORMAT(connectorDto.ocppConnectionName, connectorDto.evseId!)}/${connectorDto.id}`;
    await this.broadcastConnector(tenant, connector, HttpMethod.Put, path);
  }

  async broadcastPatchConnector(
    tenant: TenantDto,
    connectorDto: Partial<ConnectorDto>,
  ): Promise<void> {
    const locationId = connectorDto.chargingStation?.locationId;
    if (!locationId) throw new Error('Location ID missing in Connector data');
    const connector = this.connectorMapper.fromPartialGraphql(connectorDto);
    if (!connector) throw new Error('Failed to map Connector data');
    const path = `/${tenant.countryCode}/${tenant.partyId}/${locationId}/${UID_FORMAT(connectorDto.ocppConnectionName!, connectorDto.evseId!)}/${connectorDto.id}`;
    await this.broadcastConnector(tenant, connector, HttpMethod.Patch, path);
  }

  private async broadcastConnector(
    tenant: TenantDto,
    connectorData: Partial<ConnectorDTO>,
    method: HttpMethod,
    path: string,
  ): Promise<void> {
    try {
      await this.locationsClientApi.broadcastToClients({
        cpoCountryCode: tenant.countryCode!,
        cpoPartyId: tenant.partyId!,
        moduleId: ModuleId.Locations,
        interfaceRole: InterfaceRole.RECEIVER,
        httpMethod: method,
        schema: OcpiEmptyResponseSchema,
        body: connectorData,
        path: path,
      });
    } catch (e) {
      this.logger.error(`broadcast${method}Connector failed for ${path}`, e);
    }
  }
}
