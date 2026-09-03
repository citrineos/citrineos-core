// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi } from './base-client-api.js';
import type { Tariff, TariffResponse } from '../model/tariff.js';
import { TariffResponseSchema } from '../model/tariff.js';
import type { OcpiEmptyResponse } from '../model/ocpi-empty-response.js';
import { OcpiEmptyResponseSchema } from '../model/ocpi-empty-response.js';
import { ModuleId } from '../model/module-id.js';
import { EndpointIdentifier } from '../model/endpoint-identifier.js';
import { type Endpoint, HttpMethod, type PartnerProfile } from '@citrineos/types';

export class TariffsClientApi extends BaseClientApi {
  CONTROLLER_PATH = ModuleId.Tariffs;

  getUrl(partnerProfile: PartnerProfile): string {
    const url = partnerProfile.endpoints?.find(
      (value: Endpoint) => value.identifier === EndpointIdentifier.TARIFFS_RECEIVER,
    )?.url;
    if (!url) {
      throw new Error(
        `No Tariffs endpoint available for partnerProfile ${JSON.stringify(partnerProfile)}`,
      );
    }
    return url;
  }

  async getTariff(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    tariffId: string,
  ): Promise<TariffResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${tariffId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Get,
      TariffResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
    );
  }

  async putTariff(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    tariffId: string,
    tariff: Tariff,
  ): Promise<TariffResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${tariffId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Put,
      TariffResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
      tariff,
    );
  }

  async deleteTariff(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
    tariffId: string,
  ): Promise<OcpiEmptyResponse> {
    const path = `${fromCountryCode}/${fromPartyId}/${tariffId}`;
    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Delete,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      `${this.getUrl(partnerProfile)}/${path}`,
    );
  }
}
