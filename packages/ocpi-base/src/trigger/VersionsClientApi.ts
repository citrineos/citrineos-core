// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './BaseClientApi.js';
import { Service } from 'typedi';
import { UnsuccessfulRequestException } from '../exception/UnsuccessfulRequestException.js';
import type { VersionDetailsResponseDTO } from '../model/DTO/VersionDetailsResponseDTO.js';
import { VersionDetailsResponseDTOSchema } from '../model/DTO/VersionDetailsResponseDTO.js';
import { VersionListResponseDTOSchema } from '../model/DTO/VersionListResponseDTO.js';
import type { VersionListResponseDTO } from '../model/DTO/VersionListResponseDTO.js';
import { HttpMethod, type PartnerProfile } from '@citrineos/base';
import { VersionsInterface } from '../model/EndpointIdentifier.js';

@Service()
export class VersionsClientApi extends BaseClientApi {
  getUrl(partnerProfile: PartnerProfile, versionInterface = VersionsInterface.VERSIONS): string {
    switch (versionInterface) {
      case VersionsInterface.VERSIONS:
        return partnerProfile.credentials!.versionsUrl;
      case VersionsInterface.DETAILS:
        return partnerProfile.version.versionDetailsUrl!;
    }
  }
  /**
   * This endpoint lists all the available OCPI versions and the corresponding URLs to where version specific details such as the supported endpoints can be found.
   */
  async getVersions(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    url?: string,
  ): Promise<VersionListResponseDTO> {
    try {
      return this.request(
        fromCountryCode,
        fromPartyId,
        toCountryCode,
        toPartyId,
        HttpMethod.Get,
        VersionListResponseDTOSchema,
        partnerProfile,
        false,
        url,
      );
    } catch (e: any) {
      throw new UnsuccessfulRequestException(`Could not get version list. Error: ${e.message}`);
    }
  }

  async getVersionDetails(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    url?: string,
  ): Promise<VersionDetailsResponseDTO> {
    try {
      url = url || this.getUrl(partnerProfile, VersionsInterface.DETAILS);
      return this.request(
        fromCountryCode,
        fromPartyId,
        toCountryCode,
        toPartyId,
        HttpMethod.Get,
        VersionDetailsResponseDTOSchema,
        partnerProfile,
        false,
        url,
      );
    } catch (e: any) {
      throw new UnsuccessfulRequestException(`Could not get version details. Error: ${e.message}`);
    }
  }
}
