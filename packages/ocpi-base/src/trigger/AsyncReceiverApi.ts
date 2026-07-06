// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './BaseClientApi.js';
import { Service } from 'typedi';
import type { OcpiEmptyResponse } from '../model/OcpiEmptyResponse.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';
import { HttpMethod, type PartnerProfile } from '@citrineos/base';

@Service()
export class AsyncReceiverApi extends BaseClientApi {
  getUrl(): string {
    throw new Error('AsyncReceiverApi must be called with url.');
  }

  async postAsyncResponse(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    url: string,
    body: any,
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
      url,
      body,
    );
  }
}
