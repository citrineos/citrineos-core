// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi, MissingRequiredParamException } from './BaseClientApi.js';
import { ModuleId } from '../model/ModuleId.js';
import type { CredentialsResponse } from '../model/CredentialsResponse.js';
import { CredentialsResponseSchema } from '../model/CredentialsResponse.js';
import { Service } from 'typedi';
import type { OcpiEmptyResponse } from '../model/OcpiEmptyResponse.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/base';
import { EndpointIdentifier } from '../model/EndpointIdentifier.js';
import type { CredentialsDTO } from '../index.js';

@Service()
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
