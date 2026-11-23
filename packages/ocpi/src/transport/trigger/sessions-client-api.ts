// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './base-client-api.js';
import type { Session, SessionResponse } from '../../types/session.js';
import { SessionResponseSchema } from '../../types/session.js';
import type { OcpiEmptyResponse } from '../../types/ocpi-empty-response.js';
import { OcpiEmptyResponseSchema } from '../../types/ocpi-empty-response.js';
import { ModuleId } from '../../types/module-id.js';
import { EndpointIdentifier } from '../../types/endpoint-identifier.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/types';

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

  private buildSessionUrl(
    fromCountryCode: string,
    fromPartyId: string,
    partnerProfile: PartnerProfile,
    sessionId: string,
  ): string {
    return `${this.getUrl(partnerProfile)}/${fromCountryCode}/${fromPartyId}/${sessionId}`;
  }

  async getSession(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    sessionId: string,
  ): Promise<SessionResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      SessionResponseSchema,
      partnerProfile,
      true,
      this.buildSessionUrl(fromCountryCode, fromPartyId, partnerProfile, sessionId),
    );
  }

  async patchSession(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    sessionId: string,
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
      this.buildSessionUrl(fromCountryCode, fromPartyId, partnerProfile, sessionId),
      body,
    );
  }

  async putSession(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    sessionId: string,
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
      this.buildSessionUrl(fromCountryCode, fromPartyId, partnerProfile, sessionId),
      body,
    );
  }
}
