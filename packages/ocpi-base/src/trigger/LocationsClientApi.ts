// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './BaseClientApi.js';
import type { ConnectorDTO, ConnectorResponse } from '../model/DTO/ConnectorDTO.js';
import { ConnectorResponseSchema } from '../model/DTO/ConnectorDTO.js';
import type { LocationDTO, LocationResponse } from '../model/DTO/LocationDTO.js';
import { LocationResponseSchema } from '../model/DTO/LocationDTO.js';
import type { OcpiEmptyResponse } from '../model/OcpiEmptyResponse.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';
import type { EvseDTO, EvseResponse } from '../model/DTO/EvseDTO.js';
import { EvseResponseSchema } from '../model/DTO/EvseDTO.js';
import { Service } from 'typedi';
import { ModuleId } from '../model/ModuleId.js';
import { EndpointIdentifier } from '../model/EndpointIdentifier.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/base';

@Service()
export class LocationsClientApi extends BaseClientApi {
  CONTROLLER_PATH = ModuleId.Locations;

  getUrl(partnerProfile: PartnerProfile): string {
    const url = partnerProfile.endpoints?.find(
      (value: Endpoint) => value.identifier === EndpointIdentifier.LOCATIONS_RECEIVER,
    )?.url;
    if (!url) {
      throw new Error(
        `No Locations endpoint available for partnerProfile ${JSON.stringify(partnerProfile)}`,
      );
    }
    return url;
  }

  async getConnector(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
    evseUid: string,
    connectorId: string,
  ): Promise<ConnectorResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}/${evseUid}/${connectorId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      ConnectorResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
    );
  }

  async getEvse(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
    evseUid: string,
  ): Promise<EvseResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}/${evseUid}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      EvseResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
    );
  }

  async getLocation(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
  ): Promise<LocationResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      LocationResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
    );
  }

  async patchConnector(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
    evseUid: string,
    connectorId: string,
    requestBody: Partial<ConnectorDTO>,
  ): Promise<OcpiEmptyResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}/${evseUid}/${connectorId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Patch,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
      requestBody,
    );
  }

  async patchEvse(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
    evseUid: string,
    requestBody: Partial<EvseDTO>,
  ): Promise<OcpiEmptyResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}/${evseUid}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Patch,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
      requestBody,
    );
  }

  async patchLocation(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
    requestBody: Partial<LocationDTO>,
  ): Promise<OcpiEmptyResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Patch,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
      requestBody,
    );
  }

  async putConnector(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
    evseUid: string,
    connectorId: string,
    connector: ConnectorDTO,
  ): Promise<OcpiEmptyResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}/${evseUid}/${connectorId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Put,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
      connector,
    );
  }

  async putEvse(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
    evseUid: string,
    evse: EvseDTO,
  ): Promise<OcpiEmptyResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}/${evseUid}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Put,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
      evse,
    );
  }

  async putLocation(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    locationId: string,
    location: LocationDTO,
  ): Promise<OcpiEmptyResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${locationId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Put,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
      location,
    );
  }
}
