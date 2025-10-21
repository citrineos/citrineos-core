// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { BaseSchema } from './types/base.dto.js';
import { PartnerProfileSchema } from './types/ocpi.registration.js';

export const TenantPartnerSchema = BaseSchema.extend({
  id: z.number().int().optional(),
  countryCode: z.string().nullable().optional(),
  partyId: z.string().nullable().optional(),
  partnerProfileOCPI: PartnerProfileSchema.nullable().optional(),
});

export const TenantPartnerProps = TenantPartnerSchema.keyof().enum;

export type TenantPartnerDto = z.infer<typeof TenantPartnerSchema>;

export const TenantPartnerCreateSchema = TenantPartnerSchema.omit({
  id: true,
  tenant: true,
  updatedAt: true,
  createdAt: true,
});

export type TenantPartnerCreate = z.infer<typeof TenantPartnerCreateSchema>;

export const tenantPartnerSchemas = {
  TenantPartner: TenantPartnerSchema,
  TenantPartnerCreate: TenantPartnerCreateSchema,
};
