// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './BaseClientApi.js';
import type { Cdr, CdrResponse } from '../model/Cdr.js';
import { CdrResponseSchema } from '../model/Cdr.js';
import { Service } from 'typedi';
import type { OcpiEmptyResponse } from '../model/OcpiEmptyResponse.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';
import { ModuleId } from '../model/ModuleId.js';
import { EndpointIdentifier } from '../model/EndpointIdentifier.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/base';

@Service()
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
