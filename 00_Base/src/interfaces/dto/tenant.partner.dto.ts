// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IBaseDto, OCPIRegistration } from '../..';

export interface ITenantPartnerDto extends IBaseDto {
  id?: number;
  countryCode?: string | null;
  partyId?: string | null;
  partnerProfileOCPI?: OCPIRegistration.PartnerProfile | null;
}

export enum ITenantPartnerDtoProps {
  id = 'id',
  countryCode = 'countryCode',
  partyId = 'partyId',
  partnerProfileOCPI = 'partnerProfileOCPI',
  updatedAt = 'updatedAt',
  createdAt = 'createdAt',
}
