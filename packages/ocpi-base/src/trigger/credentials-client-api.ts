// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi, MissingRequiredParamException } from './base-client-api.js';
import { ModuleId } from '../model/module-id.js';
import type { CredentialsResponse } from '../model/credentials-response.js';
import { CredentialsResponseSchema } from '../model/credentials-response.js';
import type { OcpiEmptyResponse } from '../model/ocpi-empty-response.js';
import { OcpiEmptyResponseSchema } from '../model/ocpi-empty-response.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/types';
import { EndpointIdentifier } from '../model/endpoint-identifier.js';
import type { CredentialsDTO } from '../index.js';

export class CredentialsClientApi extends BaseClientApi {
  CONTROLLER_PATH = ModuleId.Credentials;

  getUrl(partnerProfile: PartnerProfile): string {
    const url = partnerProfile.endpoints?.find(
      (value: Endpoint) => value.identifier === EndpointIdentifier.CREDENTIALS,
    )!.url;
    if (!url) {
      throw new MissingRequiredParamException(`${EndpointIdentifier.CREDENTIALS}.url`);
    }
    return url;
  }

  async getCredentials(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
  ): Promise<CredentialsResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      CredentialsResponseSchema,
      partnerProfile,
      false,
    );
  }

  async postCredentials(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    body: CredentialsDTO,
  ): Promise<CredentialsResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Post,
      CredentialsResponseSchema,
      partnerProfile,
      false,
      undefined,
      body,
    );
  }

  async putCredentials(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    body: CredentialsDTO,
  ): Promise<CredentialsResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Put,
      CredentialsResponseSchema,
      partnerProfile,
      false,
      undefined,
      body,
    );
  }

  async deleteCredentials(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
  ): Promise<OcpiEmptyResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Delete,
      OcpiEmptyResponseSchema,
      partnerProfile,
      false,
    );
  }
}
