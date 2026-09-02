// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './base-client-api.js';
import type { Cdr, CdrResponse } from '../model/cdr.js';
import { CdrResponseSchema } from '../model/cdr.js';
import type { OcpiEmptyResponse } from '../model/ocpi-empty-response.js';
import { OcpiEmptyResponseSchema } from '../model/ocpi-empty-response.js';
import { ModuleId } from '../model/module-id.js';
import { EndpointIdentifier } from '../model/endpoint-identifier.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/types';

export class CdrsClientApi extends BaseClientApi {
  CONTROLLER_PATH = ModuleId.Cdrs;

  getUrl(partnerProfile: PartnerProfile): string {
    const url = partnerProfile.endpoints?.find(
      (value: Endpoint) => value.identifier === EndpointIdentifier.CDRS_RECEIVER,
    )?.url;
    if (!url) {
      throw new Error(
        `No CDR endpoint available for partnerProfile ${JSON.stringify(partnerProfile)}`,
      );
    }
    return url;
  }

  async getCdr(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    url: string, // Provided in the response to a Cdr POST
  ): Promise<CdrResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      CdrResponseSchema,
      partnerProfile,
      true,
      url,
    );
  }

  async postCdr(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    body: Cdr,
  ): Promise<OcpiEmptyResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Post,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      undefined,
      body,
    );
  }
}
