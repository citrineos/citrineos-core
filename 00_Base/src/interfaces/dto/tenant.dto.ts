// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ServerProfileSchema } from './types/ocpi.registration.js';

export const TenantSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  url: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  partyId: z.string().nullable().optional(),
  serverProfileOCPI: ServerProfileSchema.nullable().optional(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
});

export const TenantProps = TenantSchema.keyof().enum;

export type TenantDto = z.infer<typeof TenantSchema>;

export const TenantCreateSchema = TenantSchema.omit({
  id: true,
  updatedAt: true,
  createdAt: true,
});

export type TenantCreate = z.infer<typeof TenantCreateSchema>;

export const TenantUpdateSchema = TenantSchema.partial().omit({
  updatedAt: true,
  createdAt: true,
});

export type TenantUpdate = z.infer<typeof TenantUpdateSchema>;

export const tenantSchemas = {
  Tenant: TenantSchema,
  TenantCreate: TenantCreateSchema,
  TenantUpdate: TenantUpdateSchema,
};
