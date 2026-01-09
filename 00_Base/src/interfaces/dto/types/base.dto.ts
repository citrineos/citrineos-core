// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { TenantSchema } from '../tenant.dto.js';

export const BaseSchema = z.object({
  tenantId: z.number().int(),
  tenant: TenantSchema.optional(),
  updatedAt: z.date().optional(),
  createdAt: z.date().optional(),
});

export const BaseProps = BaseSchema.keyof().enum;

export type BaseDto = z.infer<typeof BaseSchema>;
