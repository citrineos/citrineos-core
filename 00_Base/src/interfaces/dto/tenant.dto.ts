// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export interface ITenantDto {
  id?: number;
  name: string;
  url?: string | null;
  countryCode?: string | null;
  partyId?: string | null;
  updatedAt?: Date;
  createdAt?: Date;
}

export enum ITenantDtoProps {
  tenantId = 'tenantId',
  updatedAt = 'updatedAt',
  createdAt = 'createdAt',
}
