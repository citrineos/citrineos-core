// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { TenantDto, TenantPartnerDto } from '@citrineos/types';

export class TenantPartnerClass implements Partial<TenantPartnerDto> {
  id?: number;
  countryCode?: string | null;
  partyId?: string | null;
  partnerProfileOCPI?: any;
  updatedAt?: Date;
  createdAt?: Date;
  tenant?: TenantDto;
  tenantId: number | undefined;
}
