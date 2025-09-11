// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPIRegistration } from './json';

export interface ITenantDto {
  id?: number;
  name: string;
  url?: string | null;
  countryCode?: string | null;
  partyId?: string | null;
  serverProfileOCPI?: OCPIRegistration.ServerProfile | null;
  updatedAt?: Date;
  createdAt?: Date;
}

export enum ITenantDtoProps {
  id = 'id',
  name = 'name',
  url = 'url',
  countryCode = 'countryCode',
  partyId = 'partyId',
  serverProfileOCPI = 'serverProfileOCPI',
  updatedAt = 'updatedAt',
  createdAt = 'createdAt',
}
