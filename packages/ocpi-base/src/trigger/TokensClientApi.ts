// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './BaseClientApi.js';
import { Service } from 'typedi';
import { ModuleId } from '../model/ModuleId.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/base';
import { EndpointIdentifier } from '../model/EndpointIdentifier.js';
import type { PaginatedParams } from './param/PaginatedParams.js';
import type { PaginatedTokenResponse } from '../model/DTO/TokenDTO.js';
import { PaginatedTokenResponseSchema } from '../model/DTO/TokenDTO.js';
import { TokenType } from '../model/TokenType.js';
import type { LocationReferences } from '../model/LocationReferences.js';
import type { AuthorizationInfoResponse } from '../model/AuthorizationInfo.js';
import { AuthorizationInfoResponseSchema } from '../model/AuthorizationInfo.js';

@Service()
export class TokensClientApi extends BaseClientApi {
  CONTROLLER_PATH = ModuleId.Tokens;

  getUrl(partnerProfile: PartnerProfile): string {
    const url = partnerProfile.endpoints?.find(
      (value: Endpoint) => value.identifier === EndpointIdentifier.TOKENS_SENDER,
    )?.url;
    if (!url) {
      throw new Error(
        `No Tokens endpoint available for partnerProfile ${JSON.stringify(partnerProfile)}`,
      );
    }
    return url;
  }

  async getTokens(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    paginatedParams: PaginatedParams,
  ): Promise<PaginatedTokenResponse> {
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      PaginatedTokenResponseSchema,
      partnerProfile,
      true,
      undefined,
      undefined,
      paginatedParams,
    );
  }

  async postToken(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    tokenId: string,
    tokenType?: TokenType,
    body?: LocationReferences,
  ): Promise<AuthorizationInfoResponse> {
    const path = `${tokenId}/authorize`;
    const otherParams: Record<string, string> | undefined = tokenType && {
      type: tokenType,
    };
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Post,
      AuthorizationInfoResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
      body,
      undefined,
      otherParams,
    );
  }
}
