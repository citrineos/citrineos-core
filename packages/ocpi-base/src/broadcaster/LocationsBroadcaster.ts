// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseBroadcaster } from './BaseBroadcaster.js';
import { Service } from 'typedi';
import { LocationsClientApi } from '../trigger/LocationsClientApi.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { CredentialsService } from '../services/CredentialsService.js';
import type { LocationDTO } from '../model/DTO/LocationDTO.js';
import type { EvseDTO } from '../model/DTO/EvseDTO.js';
import { UID_FORMAT } from '../model/DTO/EvseDTO.js';
import type { ConnectorDTO } from '../model/DTO/ConnectorDTO.js';
import { ModuleId } from '../model/ModuleId.js';
import { InterfaceRole } from '../model/InterfaceRole.js';
import type {
  ChargingStationDto,
  ConnectorDto,
  EvseDto,
  LocationDto,
  TenantDto,
} from '@citrineos/base';
import { HttpMethod } from '@citrineos/base';
import { ConnectorMapper, EvseMapper, LocationMapper } from '../mapper/index.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';

@Service()
export class LocationsBroadcaster extends BaseBroadcaster {
  constructor(
    readonly logger: Logger<ILogObj>,
    readonly credentialsService: CredentialsService,
    readonly locationsClientApi: LocationsClientApi,
  ) {
    super();
  }

  async broadcastPutLocation(tenant: TenantDto, locationDto: LocationDto): Promise<void> {
    const location = LocationMapper.fromGraphql(locationDto);
    const path = `/${tenant.countryCode}/${tenant.partyId}/${location.id}`;
    await this.broadcastLocation(tenant, location, HttpMethod.Put, path);
  }

  async broadcastPatchLocation(
    tenant: TenantDto,
    locationDto: Partial<LocationDto>,
  ): Promise<void> {
    const locationId = locationDto.id;
    if (!locationId) throw new Error('Location ID missing');
    const location = LocationMapper.fromPartialGraphql(locationDto);
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
    const evse = EvseMapper.fromGraphql(chargingStationDto!, evseDto);
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
    const evse = EvseMapper.fromPartialGraphql(chargingStationDto!, evseDto);
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
    const connector = ConnectorMapper.fromGraphql(connectorDto);
    if (!connector) throw new Error('Failed to map Connector data');
    const path = `/${tenant.countryCode}/${tenant.partyId}/${locationId}/${UID_FORMAT(connectorDto.ocppConnectionName, connectorDto.evseId)}/${connectorDto.id}`;
    await this.broadcastConnector(tenant, connector, HttpMethod.Put, path);
  }

  async broadcastPatchConnector(
    tenant: TenantDto,
    connectorDto: Partial<ConnectorDto>,
  ): Promise<void> {
    const locationId = connectorDto.chargingStation?.locationId;
    if (!locationId) throw new Error('Location ID missing in Connector data');
    const connector = ConnectorMapper.fromPartialGraphql(connectorDto);
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
