// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './BaseClientApi.js';
import type { Session, SessionResponse } from '../model/Session.js';
import { SessionResponseSchema } from '../model/Session.js';
import { Service } from 'typedi';
import type { OcpiEmptyResponse } from '../model/OcpiEmptyResponse.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';
import { ModuleId } from '../model/ModuleId.js';
import { EndpointIdentifier } from '../model/EndpointIdentifier.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/base';

@Service()
export class SessionsClientApi extends BaseClientApi {
  CONTROLLER_PATH = ModuleId.Sessions;

  getUrl(partnerProfile: PartnerProfile): string {
    const url = partnerProfile.endpoints?.find(
      (value: Endpoint) => value.identifier === EndpointIdentifier.SESSIONS_RECEIVER,
    )?.url;
    if (!url) {
      throw new Error(
        `No Session endpoint available for patnerProfile ${JSON.stringify(partnerProfile)}`,
      );
    }
    return url;
  }

  async getSession(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
  ): Promise<SessionResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      SessionResponseSchema,
      partnerProfile,
    );
  }

  async patchSession(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    body: Partial<Session>,
  ): Promise<OcpiEmptyResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Patch,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      undefined,
      body,
    );
  }

  async putSession(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    body: Session,
  ): Promise<OcpiEmptyResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Put,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      undefined,
      body,
    );
  }
}
